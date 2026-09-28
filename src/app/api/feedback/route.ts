import { NextResponse } from "next/server";
import { getOpenAI, FEEDBACK_MODEL } from "@/lib/openai";
import { feedbackSystemPrompt, getMode } from "@/lib/modes";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { checkAccess, paymentRequired } from "@/lib/access";
import { recordUsage } from "@/lib/usage";
import {
  ASSESSMENT_FORMAT,
  parseAssessment,
  type Assessment,
} from "@/lib/assessment";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cap transcript length sent to the model (chars ≈ generous 5-min answer).
const MAX_TRANSCRIPT_CHARS = 8_000;

/**
 * POST /api/feedback
 * Body: { mode: string, transcript: string }
 * Returns: { assessment: Assessment }
 *
 * Coaches the transcript against the mode's rubric: a level and a sentence per
 * axis, and one instruction for the next attempt. See src/lib/assessment.ts for
 * why this is not a score out of a hundred.
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
          content: `${feedbackSystemPrompt(practiceMode)}\n\n${ASSESSMENT_FORMAT}`,
        },
        {
          role: "user",
          content:
            `Prompt the user answered: "${practiceMode.prompt}"\n\n` +
            `Their transcribed answer:\n"""\n${transcript}\n"""`,
        },
      ],
    });

    await recordUsage({
      endpoint: "feedback",
      model: FEEDBACK_MODEL,
      promptTokens: completion.usage?.prompt_tokens ?? null,
      completionTokens: completion.usage?.completion_tokens ?? null,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const assessment: Assessment = parseAssessment(JSON.parse(raw));

    return NextResponse.json({ assessment });
  } catch (err) {
    console.error("Feedback generation failed:", err);
    return NextResponse.json(
      { error: "Feedback generation failed." },
      { status: 502 },
    );
  }
}
