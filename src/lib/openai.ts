import OpenAI from "openai";

/**
 * Lazily construct a server-only OpenAI client. Constructed per request (not
 * at module load) so the build doesn't fail when OPENAI_API_KEY is unset.
 * Never import this from a Client Component.
 */
let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/** Model used for chat-based feedback. Override with FEEDBACK_MODEL. */
export const FEEDBACK_MODEL = process.env.FEEDBACK_MODEL ?? "gpt-4o-mini";

/** Whisper model used for speech-to-text. */
export const TRANSCRIBE_MODEL = "whisper-1";
