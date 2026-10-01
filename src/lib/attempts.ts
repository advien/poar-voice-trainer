/**
 * Practice attempts for signed-in accounts.
 *
 * Everything here goes through the request-scoped Supabase client — the one
 * carrying the user's cookies — so Postgres sees the person, not the service
 * role, and row-level security does the access control. The service-role
 * client is deliberately absent from this file: reaching for it is what made
 * the old `sessions` table readable by every visitor.
 *
 * Transcripts are emptied two days after the attempt by a scheduled job (see
 * supabase/attempts.sql). A row whose transcript is null is not broken; it is
 * an attempt you can still learn from but no longer re-read.
 */
import { createClient } from "@/lib/supabase/server";
import {
  AXES,
  parseStoredChecklist,
  type Assessment,
  type Axis,
  type ChecklistVerdict,
  type Level,
} from "@/lib/assessment";
import type { ModeId } from "@/lib/modes";

export interface AttemptInput {
  mode: ModeId;
  questionId?: string | null;
  prompt?: string | null;
  transcript: string;
  assessment: Assessment;
}

export interface AttemptRow {
  id: string;
  created_at: string;
  mode: ModeId;
  prompt: string | null;
  /** Null once the two-day window has passed. */
  transcript: string | null;
  summary: string | null;
  next_step: string | null;
  axes: Record<Axis, { level: Level | null; note: string | null }>;
  /** Null when the question had no checklist. */
  checklist: ChecklistVerdict[] | null;
}

/** Column names are flat in Postgres; the app prefers them nested. */
interface AttemptRecord {
  id: string;
  created_at: string;
  mode: ModeId;
  prompt: string | null;
  transcript: string | null;
  summary: string | null;
  next_step: string | null;
  clarity_level: Level | null;
  clarity_note: string | null;
  accuracy_level: Level | null;
  accuracy_note: string | null;
  professionalism_level: Level | null;
  professionalism_note: string | null;
  /** Raw jsonb; checked by parseStoredChecklist on the way out. */
  checklist_results: unknown;
}

const toRow = (r: AttemptRecord): AttemptRow => ({
  id: r.id,
  created_at: r.created_at,
  mode: r.mode,
  prompt: r.prompt,
  transcript: r.transcript,
  summary: r.summary,
  next_step: r.next_step,
  axes: {
    clarity: { level: r.clarity_level, note: r.clarity_note },
    accuracy: { level: r.accuracy_level, note: r.accuracy_note },
    professionalism: {
      level: r.professionalism_level,
      note: r.professionalism_note,
    },
  },
  checklist: parseStoredChecklist(r.checklist_results),
});

/**
 * Save an attempt for the signed-in user. Returns null when nobody is signed
 * in — the trial saves nothing, and that is not an error to report.
 */
export async function saveAttempt(input: AttemptInput): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { assessment } = input;
  const { data, error } = await supabase
    .from("attempts")
    .insert({
      user_id: user.id,
      mode: input.mode,
      question_id: input.questionId ?? null,
      prompt: input.prompt ?? null,
      transcript: input.transcript,
      summary: assessment.summary || null,
      next_step: assessment.next || null,
      clarity_level: assessment.axes.clarity.level,
      clarity_note: assessment.axes.clarity.note || null,
      accuracy_level: assessment.axes.accuracy.level,
      accuracy_note: assessment.axes.accuracy.note || null,
      professionalism_level: assessment.axes.professionalism.level,
      professionalism_note: assessment.axes.professionalism.note || null,
      // Key, label and status only; see ChecklistVerdict.
      checklist_results: assessment.checklist ?? null,
    })
    .select("id")
    .single();

  if (error) {
    // Losing the history entry must not cost the person their coaching, which
    // they already have on screen by this point.
    console.warn("attempts: could not save", error);
    return null;
  }

  return (data as { id: string }).id;
}

/** The signed-in user's attempts, newest first. */
export async function listAttempts(limit = 50): Promise<AttemptRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attempts")
    .select(
      "id, created_at, mode, prompt, transcript, summary, next_step, " +
        "clarity_level, clarity_note, accuracy_level, accuracy_note, " +
        "professionalism_level, professionalism_note, checklist_results",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("attempts: could not read", error);
    return [];
  }

  return (data as unknown as AttemptRecord[]).map(toRow);
}

export interface AxisTally {
  axis: Axis;
  solid: number;
  needsWork: number;
  missing: number;
}

/**
 * How often each axis needed work — the shape a learner can act on, as
 * opposed to an average of numbers that no longer exist.
 */
export function tallyAxes(rows: AttemptRow[]): AxisTally[] {
  return AXES.map(axis => {
    const tally: AxisTally = { axis, solid: 0, needsWork: 0, missing: 0 };
    for (const row of rows) {
      switch (row.axes[axis].level) {
        case "solid":
          tally.solid += 1;
          break;
        case "needs work":
          tally.needsWork += 1;
          break;
        case "missing":
          tally.missing += 1;
          break;
      }
    }
    return tally;
  });
}

export interface ChecklistTally {
  key: string;
  /** From the newest attempt that judged this item. */
  label: string;
  /** Attempts in which this item was judged at all. */
  judged: number;
  covered: number;
  partial: number;
  missing: number;
}

/**
 * How often each checklist item was missed or only half said, worst first.
 * Counts only attempts whose question had a checklist containing the item; an
 * attempt without one is neither a hit nor a miss. Items share a key across
 * questions on purpose, so "the follow-up plan" adds up over different answers.
 * Rows are expected newest first, as listAttempts returns them.
 */
export function tallyChecklist(rows: AttemptRow[]): ChecklistTally[] {
  const byKey = new Map<string, ChecklistTally>();
  for (const row of rows) {
    for (const { key, label, status } of row.checklist ?? []) {
      let tally = byKey.get(key);
      if (!tally) {
        tally = { key, label, judged: 0, covered: 0, partial: 0, missing: 0 };
        byKey.set(key, tally);
      }
      tally.judged += 1;
      tally[status] += 1;
    }
  }
  const gapRate = (t: ChecklistTally) => (t.partial + t.missing) / t.judged;
  return [...byKey.values()].sort(
    (a, b) => gapRate(b) - gapRate(a) || b.judged - a.judged,
  );
}
