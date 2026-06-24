import { NextResponse } from "next/server";
import { getOpenAI, FEEDBACK_MODEL } from "@/lib/openai";
import { feedbackSystemPrompt, getMode } from "@/lib/modes";

/**
 * POST /api/feedback
 * Body: { mode: string, transcript: string }
 * Returns: { feedback: string }
 *
 * Generates coaching feedback on the transcript with OpenAI, using a
 * per-mode system prompt.
 */
export async function POST(request: Request) {
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

  const practiceMode = mode ? getMode(mode) : undefined;
  if (!practiceMode) {
    return NextResponse.json({ error: "Unknown mode." }, { status: 400 });
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: FEEDBACK_MODEL,
      messages: [
        { role: "system", content: feedbackSystemPrompt(practiceMode) },
        {
          role: "user",
          content:
            `Prompt the user answered: "${practiceMode.prompt}"\n\n` +
            `Their transcribed answer:\n"""\n${transcript}\n"""`,
        },
      ],
    });

    const feedback = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("Feedback generation failed:", err);
    return NextResponse.json(
      { error: "Feedback generation failed." },
      { status: 502 },
    );
  }
}
