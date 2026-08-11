import { NextResponse } from "next/server";
import { getOpenAI, TRANSCRIBE_MODEL } from "@/lib/openai";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/ratelimit";

// OpenAI SDK + file handling need the Node runtime. Allow headroom for
// Whisper on longer clips (Vercel default is ~10s on Hobby).
export const runtime = "nodejs";
export const maxDuration = 60;

// ~15 MB ≈ well over 5 minutes of MediaRecorder opus audio, and safely
// under Whisper's own 25 MB cap. Anything bigger is not a practice answer.
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

/**
 * POST /api/transcribe
 * Accepts multipart form data: { audio: File, mode: string }
 * Returns: { transcript: string }
 *
 * Transcribes the recorded audio with OpenAI Whisper.
 */
export async function POST(request: Request) {
  // Transcription is the most expensive call — keep the tightest limit.
  const rl = rateLimit(`transcribe:${clientIp(request)}`, 6, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

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
  if (audio.size === 0) {
    return NextResponse.json({ error: "Empty audio file." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Recording is too large (max 15 MB / ~5 minutes)." },
      { status: 413 },
    );
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
