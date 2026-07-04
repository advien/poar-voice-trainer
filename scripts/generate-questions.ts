/**
 * Question-bank generator (hybrid sourcing + semantic dedup).
 *
 *   Concepts (open terminology) ──▶ LLM ──▶ prompts ──▶ dedup ──▶ Supabase
 *
 * Dedup is SEMANTIC: each candidate is embedded and compared (cosine
 * similarity) against existing prompts of the same mode AND prompts already
 * accepted in this run. Anything above the similarity threshold is dropped,
 * so paraphrases are caught — not just exact text matches.
 *
 * Usage:
 *   npm run gen:questions -- --dry-run         # generate + dedup, no writes
 *   npm run gen:questions                       # generate + insert (needs service_role)
 *   npm run gen:questions -- --sim 0.88         # looser/tighter dedup (default 0.85)
 *   npm run gen:questions -- --mode interview --area robotics --max 5
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import OpenAI from "openai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CONCEPTS } from "./concepts";
import { MODES, type AreaId, type ModeId } from "../src/lib/modes";

// ── CLI args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const val = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY_RUN = has("--dry-run");
const MAX = val("--max") ? Number(val("--max")) : Infinity;
const ONLY_MODE = val("--mode") as ModeId | undefined;
const ONLY_AREA = val("--area") as AreaId | undefined;
const SIM_THRESHOLD = val("--sim") ? Number(val("--sim")) : 0.85;
const CHAT_MODEL = process.env.FEEDBACK_MODEL ?? "gpt-4o-mini";
const EMBED_MODEL = "text-embedding-3-small";

const MODE_INSTRUCTIONS: Record<ModeId, string> = {
  "explain-term":
    "a spoken-practice prompt that asks the learner to explain the concept clearly to a non-expert colleague",
  "patient-communication":
    "a short patient scenario where the learner must respond to a patient with empathy and plain language",
  interview:
    "an interview or clinical case question a POAR examiner might ask about the concept",
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // OpenAI embeddings are unit-normalized → dot product = cosine.
}

async function embed(openai: OpenAI, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += 256) {
    const batch = texts.slice(i, i + 256);
    const res = await openai.embeddings.create({ model: EMBED_MODEL, input: batch });
    vectors.push(...res.data.map((d) => d.embedding));
  }
  return vectors;
}

async function generateForCombo(
  openai: OpenAI,
  mode: ModeId,
  area: AreaId,
  concepts: string[],
): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write original practice prompts for clinicians training in " +
          "prosthetics, orthotics, and assistive robotics. Each prompt must be " +
          "ORIGINAL (do not quote any source), one or two sentences, and ready " +
          'to read aloud. Return JSON: { "prompts": string[] } with exactly ' +
          "one prompt per concept, in order.",
      },
      {
        role: "user",
        content:
          `Area: ${area}. For each concept below, write ${MODE_INSTRUCTIONS[mode]}.\n\n` +
          `Concepts:\n${concepts.map((c, i) => `${i + 1}. ${c}`).join("\n")}`,
      },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { prompts?: string[] };
  return (parsed.prompts ?? []).map((p) => p.trim()).filter(Boolean);
}

async function main() {
  if (!process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("Missing OPENAI_API_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local");
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Read client (anon is enough to read active questions for dedup).
  const reader: SupabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  let writer: SupabaseClient | null = null;
  if (!DRY_RUN) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY — needed to insert (or use --dry-run).");
      process.exit(1);
    }
    writer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
  }

  // Load existing prompts and embed them, grouped by mode.
  const { data: existing } = await reader.from("questions").select("mode, prompt");
  const byMode = new Map<ModeId, { texts: string[]; norms: Set<string> }>();
  for (const row of (existing ?? []) as { mode: ModeId; prompt: string }[]) {
    const g = byMode.get(row.mode) ?? { texts: [], norms: new Set<string>() };
    g.texts.push(row.prompt);
    g.norms.add(normalize(row.prompt));
    byMode.set(row.mode, g);
  }
  const vecCache = new Map<ModeId, number[][]>();
  for (const [mode, g] of byMode) vecCache.set(mode, await embed(openai, g.texts));

  console.log(`Loaded ${existing?.length ?? 0} existing prompts. Dedup threshold: ${SIM_THRESHOLD}`);

  const modes = (ONLY_MODE ? [ONLY_MODE] : MODES.map((m) => m.id)) as ModeId[];
  const areas = (ONLY_AREA ? [ONLY_AREA] : (Object.keys(CONCEPTS) as AreaId[])) as AreaId[];

  let generated = 0;
  let kept = 0;
  let inserted = 0;
  let dropped = 0;

  for (const mode of modes) {
    const seenNorms = byMode.get(mode)?.norms ?? new Set<string>();
    const modeVecs = vecCache.get(mode) ?? [];
    vecCache.set(mode, modeVecs);

    for (const area of areas) {
      const concepts = CONCEPTS[area].slice(0, MAX);
      const candidates = await generateForCombo(openai, mode, area, concepts);
      generated += candidates.length;

      const candVecs = await embed(openai, candidates);
      const fresh: string[] = [];

      candidates.forEach((prompt, i) => {
        const norm = normalize(prompt);
        if (seenNorms.has(norm)) {
          dropped++;
          return;
        }
        const v = candVecs[i];
        const maxSim = modeVecs.reduce((m, ev) => Math.max(m, cosine(v, ev)), 0);
        if (maxSim >= SIM_THRESHOLD) {
          dropped++;
          return;
        }
        // Accept: register so later candidates dedup against it too.
        seenNorms.add(norm);
        modeVecs.push(v);
        fresh.push(prompt);
      });

      kept += fresh.length;
      console.log(`[${mode} × ${area}] generated ${candidates.length}, kept ${fresh.length}`);
      if (DRY_RUN) {
        fresh.slice(0, 2).forEach((p) => console.log(`    • ${p}`));
        continue;
      }
      if (fresh.length && writer) {
        const { error } = await writer
          .from("questions")
          .insert(fresh.map((prompt) => ({ mode, areas: [area], prompt })));
        if (error) console.error(`    insert failed: ${error.message}`);
        else inserted += fresh.length;
      }
    }
  }

  console.log(
    `\nDone. Generated ${generated}, dropped ${dropped} as duplicates, kept ${kept}.` +
      (DRY_RUN ? " (dry run — nothing written)" : ` Inserted ${inserted}.`),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
