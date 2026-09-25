import { NextResponse } from "next/server";
import { getOpenAI, FEEDBACK_MODEL } from "@/lib/openai";
import { feedbackSystemPrompt, getMode } from "@/lib/modes";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { checkAccess, paymentRequired } from "@/lib/access";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cap transcript length sent to the model (chars ≈ generous 5-min answer).
const MAX_TRANSCRIPT_CHARS = 8_000;

export interface Scores {
  clarity: number;
  accuracy: number;
  professionalism: number;
}

const clampScore = (n: unknown): number => {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
};

/**
 * POST /api/feedback
 * Body: { mode: string, transcript: string }
 * Returns: { feedback: string, scores: Scores }
 *
 * Generates coaching feedback + 0–100 scores (clarity, accuracy,
 * professionalism) on the transcript with OpenAI, using a per-mode prompt.
 */
export async function POST(request: Request) {
  const rl = rateLimit(`feedback:${clientIp(request)}`, 10, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  // Already counted by /api/transcribe — this only refuses a caller who is
  // out of attempts and reaching the model directly.
  const access = await checkAccess(request);
  if (!access.allowed) return paymentRequired();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local." },
      { status: 500 },
    );
  }

  const { mode, transcript } = (await request.json()) as {
    mode?: string;
    transcript?: string;
  };

  if (!transcript) {
    return NextResponse.json({ error: "Missing transcript." }, { status: 400 });
  }
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return NextResponse.json(
      { error: "Transcript is too long." },
      { status: 413 },
    );
  }

  const practiceMode = mode ? getMode(mode) : undefined;
  if (!practiceMode) {
    return NextResponse.json({ error: "Unknown mode." }, { status: 400 });
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: FEEDBACK_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            feedbackSystemPrompt(practiceMode) +
            "\n\nReturn JSON with this exact shape: " +
            '{ "feedback": string, "clarity": number, "accuracy": number, ' +
            '"professionalism": number }. The three scores are integers 0-100 ' +
            "rating this specific answer. Put the prose coaching in `feedback`.",
        },
        {
          role: "user",
          content:
            `Prompt the user answered: "${practiceMode.prompt}"\n\n` +
            `Their transcribed answer:\n"""\n${transcript}\n"""`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      feedback?: string;
      clarity?: number;
      accuracy?: number;
      professionalism?: number;
    };

    return NextResponse.json({
      feedback: (parsed.feedback ?? "").trim(),
      scores: {
        clarity: clampScore(parsed.clarity),
        accuracy: clampScore(parsed.accuracy),
        professionalism: clampScore(parsed.professionalism),
      } satisfies Scores,
    });
  } catch (err) {
    console.error("Feedback generation failed:", err);
    return NextResponse.json(
      { error: "Feedback generation failed." },
      { status: 502 },
    );
  }
}
