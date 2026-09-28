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

export interface Assessment {
  /** One or two sentences on the answer as a whole. */
  summary: string;
  axes: Record<Axis, AxisVerdict>;
  /** The single thing to change next time. */
  next: string;
}

const isLevel = (v: unknown): v is Level =>
  typeof v === "string" && (LEVELS as readonly string[]).includes(v);

/**
 * Coerce whatever the model returned into an Assessment. A malformed axis
 * becomes "missing" with an empty note rather than throwing: the learner should
 * still get their transcript and the rest of the feedback.
 */
export function parseAssessment(raw: unknown): Assessment {
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
  };
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
