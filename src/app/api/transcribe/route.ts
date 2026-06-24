import { NextResponse } from "next/server";
import { getOpenAI, TRANSCRIBE_MODEL } from "@/lib/openai";

/**
 * POST /api/transcribe
 * Accepts multipart form data: { audio: File, mode: string }
 * Returns: { transcript: string }
 *
 * Transcribes the recorded audio with OpenAI Whisper.
 */
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local." },
      { status: 500 },
    );
  }

  const form = await request.formData();
  const audio = form.get("audio");

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
  }

  try {
    const transcription = await getOpenAI().audio.transcriptions.create({
      file: audio,
      model: TRANSCRIBE_MODEL,
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (err) {
    console.error("Transcription failed:", err);
    return NextResponse.json(
      { error: "Transcription failed." },
      { status: 502 },
    );
  }
}
