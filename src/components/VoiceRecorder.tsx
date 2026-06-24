"use client";

import { useCallback, useRef, useState } from "react";
import type { AreaId, ModeId } from "@/lib/modes";

export interface RecorderContext {
  mode: ModeId;
  areas?: AreaId[];
  questionId?: string;
  prompt?: string;
}

type Status = "idle" | "recording" | "transcribing" | "feedback" | "saving" | "done";

interface SessionResult {
  transcript: string;
  feedback: string;
}

/**
 * Voice recording + session flow for a single practice mode.
 *
 * MVP flow:
 *   1. Record audio with the MediaRecorder API.
 *   2. POST audio to /api/transcribe (OpenAI Whisper) → transcript.
 *   3. POST transcript to /api/feedback (Claude/OpenAI) → feedback.
 *   4. POST the whole session to /api/sessions (Supabase) to save.
 */
export function VoiceRecorder({ context }: { context: RecorderContext }) {
  const { mode } = context;
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setResult(null);

    // getUserMedia only exists in a secure context (https or localhost) and
    // when the page isn't sandboxed by a parent iframe without mic permission.
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      const inIframe =
        typeof window !== "undefined" && window.self !== window.top;
      setError(
        inIframe
          ? "Microphone is blocked inside this embedded preview. Open http://localhost:3000 in a normal browser tab and try again."
          : "Microphone isn't available here. Use a modern browser over https or http://localhost.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        void handleSubmit(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch (err) {
      setError(micErrorMessage(err));
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  async function handleSubmit(audio: Blob) {
    try {
      // 1. Transcribe
      setStatus("transcribing");
      const form = new FormData();
      form.append("audio", audio, "recording.webm");
      form.append("mode", mode);
      const tRes = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!tRes.ok) throw new Error("Transcription failed");
      const { transcript } = (await tRes.json()) as { transcript: string };

      // 2. Feedback
      setStatus("feedback");
      const fRes = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, transcript }),
      });
      if (!fRes.ok) throw new Error("Feedback generation failed");
      const { feedback } = (await fRes.json()) as { feedback: string };

      setResult({ transcript, feedback });

      // 3. Save
      setStatus("saving");
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          areas: context.areas,
          questionId: context.questionId,
          prompt: context.prompt,
          transcript,
          feedback,
        }),
      });

      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  }

  const busy =
    status === "transcribing" || status === "feedback" || status === "saving";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-4">
        {status === "recording" ? (
          <button
            onClick={stopRecording}
            className="rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700"
          >
            ⏹ Stop recording
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={busy}
            className="rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            🎙 Start recording
          </button>
        )}
        <span className="text-sm text-slate-500">{statusLabel(status)}</span>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Transcript
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-slate-800">
              {result.transcript}
            </p>
          </section>
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              AI Feedback
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-slate-800">
              {result.feedback}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

/** Map a getUserMedia DOMException to an actionable message. */
function micErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Microphone permission was denied. Click the lock/settings icon in the address bar → Site settings → Microphone → Allow, then reload.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No microphone was found. Connect a mic and try again.";
    case "NotReadableError":
      return "The microphone is in use by another app. Close it and try again.";
    default:
      return "Could not access the microphone. Check that a mic is connected and permission is allowed.";
  }
}

function statusLabel(status: Status): string {
  switch (status) {
    case "recording":
      return "Recording… speak now.";
    case "transcribing":
      return "Transcribing audio…";
    case "feedback":
      return "Generating feedback…";
    case "saving":
      return "Saving session…";
    case "done":
      return "Session saved.";
    default:
      return "Ready when you are.";
  }
}
