/**
 * Shared definition of the three MVP practice modes.
 * Used by the mode-selection UI and the session pages.
 */

export type ModeId = "explain-term" | "patient-communication" | "interview";

export type AreaId = "prosthetics" | "orthotics" | "robotics";

export interface PoarArea {
  id: AreaId;
  label: string;
}

export const AREAS: PoarArea[] = [
  { id: "prosthetics", label: "Prosthetics" },
  { id: "orthotics", label: "Orthotics" },
  { id: "robotics", label: "Assistive Robotics" },
];

export interface PracticeMode {
  id: ModeId;
  title: string;
  tagline: string;
  description: string;
  /** Short prompt shown to the user before they start recording. */
  prompt: string;
  /** Accent emoji used in the card UI. */
  icon: string;
  /**
   * Why the mode is worth practising, for the reader who suspects it is soft
   * filler. Shown behind a disclosure on the session page. Omitted where the
   * point of the drill speaks for itself.
   */
  why?: string;
}

export const MODES: PracticeMode[] = [
  {
    id: "explain-term",
    title: "Explain Term",
    tagline: "Define a concept clearly",
    description:
      "Practice explaining a prosthetics, orthotics, or assistive-robotics term so a non-expert can understand it.",
    prompt:
      "Pick a term (e.g. “myoelectric prosthesis”) and explain it out loud as if teaching a new colleague.",
    icon: "📖",
  },
  {
    id: "patient-communication",
    title: "Patient Communication",
    tagline: "Speak with empathy",
    description:
      "Rehearse explaining a device or fitting to a patient with clarity, warmth, and the right level of detail.",
    prompt:
      "Imagine a patient asking how their new orthosis will help. Respond as you would in clinic.",
    icon: "🤝",
    why:
      "You are learning to make a worried person understand their own device — to pace the explanation, check that it landed, and answer fear without retreating into jargon. It is a separate skill from explaining to a colleague, it decides whether a patient actually wears what you fitted, and it is examined: communication sits in POAR competency frameworks and OSCE-style assessments.",
  },
  {
    id: "interview",
    title: "Interview Practice",
    tagline: "Answer like a professional",
    description:
      "Practice answering common interview and case questions about the POAR field.",
    prompt:
      "Answer: “Walk me through how you would assess a patient for a lower-limb prosthesis.”",
    icon: "🎯",
    why:
      "Interview answers fail for reasons unrelated to knowledge: burying the point, running long, or never saying what you actually did. Rehearsing aloud against a rubric turns a vague sense of 'I know this' into an answer with a shape — claim, method, result, limit — which is also how a case discussion with a consultant goes.",
  },
];

export function getMode(id: string): PracticeMode | undefined {
  return MODES.find((m) => m.id === id);
}

/**
 * Build the system prompt that tells the feedback model how to coach the
 * user for a given mode. Kept here so the prompt lives next to the mode it
 * describes.
 */
export function feedbackSystemPrompt(mode: PracticeMode): string {
  const base =
    "You are a coach for clinicians and students in the prosthetics, " +
    "orthotics, and assistive-robotics (POAR) field. You give concise, " +
    "encouraging, actionable feedback on a SPOKEN answer that was " +
    "transcribed. Keep it under 180 words. Start with one specific strength, " +
    "then 2-3 concrete improvements. Be warm but honest.";

  const perMode: Record<ModeId, string> = {
    "explain-term":
      "Focus on whether the explanation is clear and accurate for a " +
      "non-expert, defines jargon, and uses a helpful analogy.",
    "patient-communication":
      "Focus on empathy, plain language, reassurance, checking for " +
      "understanding, and an appropriate level of clinical detail.",
    interview:
      "Focus on structure (e.g. a clear assessment framework), clinical " +
      "reasoning, professionalism, and confidence.",
  };

  return `${base}\n\nMode: ${mode.title}. ${perMode[mode.id]}`;
}
