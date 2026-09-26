/**
 * Metering for what this app spends at OpenAI.
 *
 * It records one row per paid call — endpoint, model, audio seconds, token
 * counts, timestamp — and nothing else. No transcript, no visitor, no content
 * of any kind; these rows describe the service's own consumption.
 *
 * The figures here are this app's own arithmetic, not a bill. The authoritative
 * numbers live in the OpenAI dashboard, and the two will differ by a little:
 * rounding, billing windows, and prices that changed since PRICES was updated.
 * Treat this page as "what the app did" and the dashboard as "what it cost".
 */
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * USD, per the OpenAI price list as of 2026-09-26. If OpenAI changes a price,
 * change it here — nothing else reads these numbers.
 */
export const PRICES = {
  /** Per minute of audio. */
  "whisper-1": { perAudioMinute: 0.006 },
  /** Per 1M tokens. */
  "gpt-4o-mini": { perMInput: 0.15, perMOutput: 0.6 },
  "gpt-4o": { perMInput: 2.5, perMOutput: 10 },
} as const;

export interface UsageEvent {
  /** Which route spent the money. */
  endpoint: "transcribe" | "feedback";
  model: string;
  audioSeconds?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
}

export interface UsageRow extends UsageEvent {
  created_at: string;
}

/** Estimated cost of a single call, in USD. */
export function costOf(row: {
  model: string;
  audioSeconds?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
}): number {
  const price = PRICES[row.model as keyof typeof PRICES];
  if (!price) return 0;

  if ("perAudioMinute" in price) {
    return ((row.audioSeconds ?? 0) / 60) * price.perAudioMinute;
  }

  return (
    ((row.promptTokens ?? 0) / 1_000_000) * price.perMInput +
    ((row.completionTokens ?? 0) / 1_000_000) * price.perMOutput
  );
}

/**
 * Write one usage row. Never throws and never blocks the caller: a metering
 * failure must not cost the person their answer.
 */
export async function recordUsage(event: UsageEvent): Promise<void> {
  if (!hasSupabaseAdmin()) return;

  try {
    const { error } = await getSupabaseAdmin().from("usage_log").insert({
      endpoint: event.endpoint,
      model: event.model,
      audio_seconds: event.audioSeconds ?? null,
      prompt_tokens: event.promptTokens ?? null,
      completion_tokens: event.completionTokens ?? null,
    });
    if (error) throw error;
  } catch (err) {
    console.warn("usage: could not record the call", err);
  }
}

export interface UsageSummary {
  days: number;
  calls: number;
  audioMinutes: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  byModel: {
    model: string;
    calls: number;
    costUsd: number;
  }[];
}

/** Totals over the last `days` days, with a per-model breakdown. */
export async function summarise(days: number): Promise<UsageSummary | null> {
  if (!hasSupabaseAdmin()) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("usage_log")
      .select("model, audio_seconds, prompt_tokens, completion_tokens")
      .gte("created_at", since);
    if (error) throw error;

    const rows = (data ?? []) as {
      model: string;
      audio_seconds: number | null;
      prompt_tokens: number | null;
      completion_tokens: number | null;
    }[];

    const perModel = new Map<string, { calls: number; costUsd: number }>();
    let audioSeconds = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let costUsd = 0;

    for (const r of rows) {
      const cost = costOf({
        model: r.model,
        audioSeconds: r.audio_seconds,
        promptTokens: r.prompt_tokens,
        completionTokens: r.completion_tokens,
      });
      costUsd += cost;
      audioSeconds += r.audio_seconds ?? 0;
      promptTokens += r.prompt_tokens ?? 0;
      completionTokens += r.completion_tokens ?? 0;

      const entry = perModel.get(r.model) ?? { calls: 0, costUsd: 0 };
      entry.calls += 1;
      entry.costUsd += cost;
      perModel.set(r.model, entry);
    }

    return {
      days,
      calls: rows.length,
      audioMinutes: audioSeconds / 60,
      promptTokens,
      completionTokens,
      costUsd,
      byModel: [...perModel.entries()]
        .map(([model, v]) => ({ model, ...v }))
        .sort((a, b) => b.costUsd - a.costUsd),
    };
  } catch (err) {
    console.warn("usage: could not read the log", err);
    return null;
  }
}
