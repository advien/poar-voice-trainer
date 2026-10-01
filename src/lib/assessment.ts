/**
 * How an answer is reported back.
 *
 * The three axes used to come back as numbers from 0 to 100. Nothing justified
 * that precision: the model cannot reproduce 71 versus 76 on the same answer,
 * and a learner reads any number as a grade. Three named levels are something a
 * model applies consistently, and they point at work to do rather than at a
 * mark to feel bad about.
 *
 * Each axis carries one sentence saying why it landed there, and the whole
 * answer carries exactly one instruction for the next attempt — one, because a
 * list of five improvements is a list nobody acts on.
 */

export const LEVELS = ["solid", "needs work", "missing"] as const;
export type Level = (typeof LEVELS)[number];

export const AXES = ["clarity", "accuracy", "professionalism"] as const;
export type Axis = (typeof AXES)[number];

/** What each axis is judged on — shown to the learner, not just to the model. */
export const AXIS_CRITERIA: Record<Axis, string> = {
  clarity:
    "Could a listener follow it? Structure, plain language, jargon explained when used.",
  accuracy:
    "Is what was said correct and complete enough for the question asked?",
  professionalism:
    "Tone and manner: measured, respectful, appropriate to the person being addressed.",
};

/** What each level means, in the learner's terms. */
export const LEVEL_MEANING: Record<Level, string> = {
  solid: "Held up on this answer.",
  "needs work": "Came through partly — this is where the next attempt goes.",
  missing: "Not demonstrated in this answer.",
};

export interface AxisVerdict {
  level: Level;
  /** One sentence, specific to what was said. */
  note: string;
}

/**
 * Per-question checklists: the elements a good answer to one question covers.
 * Unlike the axes these have no "solid" — an element is either said, half said,
 * or not said — so they get their own statuses rather than reusing LEVELS.
 */
export const CHECK_STATUSES = ["covered", "partial", "missing"] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

/** Mirrors the checklist_review_status enum in supabase/checklists.sql. */
export type ChecklistReview = "derived_from_source" | "clinician_reviewed";

export interface ChecklistItem {
  /** Stable; what attempts and statistics refer to. */
  key: string;
  /** What a person reads; may be reworded without breaking history. */
  label: string;
}

/**
 * Key, label and status only — never a note quoting the answer, because this is
 * stored with the attempt and outlives the two-day transcript purge.
 */
export interface ChecklistVerdict extends ChecklistItem {
  status: CheckStatus;
}

export interface Assessment {
  /** One or two sentences on the answer as a whole. */
  summary: string;
  axes: Record<Axis, AxisVerdict>;
  /** The single thing to change next time. */
  next: string;
  /** Absent when the question has no checklist. */
  checklist?: ChecklistVerdict[];
}

const isLevel = (v: unknown): v is Level =>
  typeof v === "string" && (LEVELS as readonly string[]).includes(v);

const isStatus = (v: unknown): v is CheckStatus =>
  typeof v === "string" && (CHECK_STATUSES as readonly string[]).includes(v);

const asRecord = (v: unknown): Record<string, unknown> =>
  typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};

/** Checklist items as stored in the database; entries that are not usable are dropped. */
export function parseChecklistItems(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: ChecklistItem[] = [];
  for (const entry of raw) {
    const { key, label } = asRecord(entry);
    if (typeof key !== "string" || typeof label !== "string") continue;
    if (!key.trim() || !label.trim() || seen.has(key)) continue;
    seen.add(key);
    items.push({ key, label });
  }
  return items;
}

/**
 * The model's checklist answer, matched back to the items we asked about. The
 * result has exactly one verdict per item, in the checklist's own order: a key
 * the model invented is dropped, and an item it skipped or mislabelled counts
 * as "missing" — not credited, because it was not shown to have been said.
 */
export function parseChecklist(
  raw: unknown,
  items: ChecklistItem[],
): ChecklistVerdict[] {
  const byKey = new Map<string, unknown>();
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const { key, status } = asRecord(entry);
      if (typeof key === "string" && !byKey.has(key)) byKey.set(key, status);
    }
  }
  return items.map(({ key, label }) => {
    const status = byKey.get(key);
    return { key, label, status: isStatus(status) ? status : "missing" };
  });
}

/**
 * Verdicts read back from the database. Unlike parseChecklist there is no item
 * list to hold them to — the label was copied in when the attempt was saved —
 * so this only drops what is not a well-formed verdict. Null if nothing is left.
 */
export function parseStoredChecklist(raw: unknown): ChecklistVerdict[] | null {
  if (!Array.isArray(raw)) return null;
  const verdicts: ChecklistVerdict[] = [];
  for (const entry of raw) {
    const { key, label, status } = asRecord(entry);
    if (typeof key !== "string" || typeof label !== "string") continue;
    if (!isStatus(status)) continue;
    verdicts.push({ key, label, status });
  }
  return verdicts.length > 0 ? verdicts : null;
}

/**
 * Coerce whatever the model returned into an Assessment. A malformed axis
 * becomes "missing" with an empty note rather than throwing: the learner should
 * still get their transcript and the rest of the feedback.
 *
 * Pass the question's checklist items, if it has any, to get `checklist` back.
 */
export function parseAssessment(
  raw: unknown,
  checklist: ChecklistItem[] = [],
): Assessment {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const rawAxes = (obj.axes ?? {}) as Record<string, unknown>;

  const axes = {} as Record<Axis, AxisVerdict>;
  for (const axis of AXES) {
    const entry = (rawAxes[axis] ?? {}) as Record<string, unknown>;
    axes[axis] = {
      level: isLevel(entry.level) ? entry.level : "missing",
      note: typeof entry.note === "string" ? entry.note.trim() : "",
    };
  }

  return {
    summary: typeof obj.summary === "string" ? obj.summary.trim() : "",
    axes,
    next: typeof obj.next === "string" ? obj.next.trim() : "",
    ...(checklist.length > 0
      ? { checklist: parseChecklist(obj.checklist, checklist) }
      : {}),
  };
}

/** Appended to the JSON contract when the question has a checklist. */
export function checklistFormat(items: ChecklistItem[]): string {
  return (
    'Also add a "checklist" field: an array with exactly one ' +
    '{"key": string, "status": string} entry for each item below, using the ' +
    'key exactly as given. "status" is exactly one of "covered" (clearly said), ' +
    '"partial" (touched on but vague or incomplete), "missing" (not said). ' +
    "Judge only what the speaker actually said; do not credit what they might " +
    "have meant. Add no notes to the checklist entries.\nItems:\n" +
    items.map(i => `- ${i.key}: ${i.label}`).join("\n")
  );
}

/** The JSON contract handed to the model. */
export const ASSESSMENT_FORMAT =
  'Return JSON of exactly this shape: {"summary": string, "axes": ' +
  '{"clarity": {"level": string, "note": string}, "accuracy": {"level": ' +
  'string, "note": string}, "professionalism": {"level": string, "note": ' +
  'string}}, "next": string}. Each "level" is exactly one of "solid", ' +
  '"needs work", "missing" — never a number and never any other word. Each ' +
  '"note" is ONE sentence naming something the speaker actually said or ' +
  'failed to say; no generic praise. "summary" is one or two sentences on ' +
  'the answer as a whole. "next" is ONE instruction for the next attempt, ' +
  'phrased as an action, not a wish.';
