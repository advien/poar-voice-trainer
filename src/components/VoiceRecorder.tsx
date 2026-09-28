"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AreaId, ModeId } from "@/lib/modes";
import AccessDialog from "@/components/AccessDialog";
import ConsentGate from "@/components/ConsentGate";
import { RESULT_DISCLAIMER } from "@/lib/privacy";
import {
  AXES,
  AXIS_CRITERIA,
  LEVEL_MEANING,
  type Assessment,
  type Level,
} from "@/lib/assessment";

export interface RecorderContext {
  mode: ModeId;
  areas?: AreaId[];
  questionId?: string;
  prompt?: string;
}

type Status =
  | "idle"
  | "recording"
  | "review"
  | "transcribing"
  | "feedback"
  | "done";

interface SessionResult {
  transcript: string;
  assessment: Assessment;
}

// Practice answers don't need more than this; also keeps the upload well
// under the server's 15 MB cap.
const MAX_RECORDING_MS = 5 * 60 * 1000;

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
  const [gate, setGate] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const recordedBlobRef = useRef<Blob | null>(null);

  // Revoke the playback object URL when it changes or on unmount.
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    setResult(null);
    setAudioUrl(null); // triggers cleanup of the previous take
    setElapsedMs(0);

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
        if (timerRef.current) clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        recordedBlobRef.current = blob;
        // Hand off to a review step so the user can listen before submitting.
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("review");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");

      // Live elapsed-time counter.
      startedAtRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 250);

      // Auto-stop at the limit; the flow then proceeds as a normal stop.
      autoStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORDING_MS);
    } catch (err) {
      setError(micErrorMessage(err));
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  }, []);

  const submitRecording = useCallback(() => {
    if (recordedBlobRef.current) void handleSubmit(recordedBlobRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const discardRecording = useCallback(() => {
    recordedBlobRef.current = null;
    setAudioUrl(null);
    setElapsedMs(0);
    setStatus("idle");
  }, []);

  async function handleSubmit(audio: Blob) {
    try {
      // 1. Transcribe
      setStatus("transcribing");
      const form = new FormData();
      form.append("audio", audio, "recording.webm");
      form.append("mode", mode);
      const tRes = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!tRes.ok) {
        const body = (await tRes.json().catch(() => null)) as {
          error?: string;
          gate?: boolean;
        } | null;
        if (tRes.status === 402) {
          setGate(body?.error ?? "This is a paid service.");
          setStatus("review");
          return;
        }
        throw new Error(body?.error ?? "Transcription failed");
      }
      const { transcript } = (await tRes.json()) as { transcript: string };

      // 2. Feedback
      setStatus("feedback");
      const fRes = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, transcript }),
      });
      if (!fRes.ok) {
        const body = (await fRes.json().catch(() => null)) as {
          error?: string;
          gate?: boolean;
        } | null;
        if (fRes.status === 402) {
          setGate(body?.error ?? "This is a paid service.");
          setStatus("review");
          return;
        }
        throw new Error(body?.error ?? "Feedback generation failed");
      }
      const { assessment } = (await fRes.json()) as { assessment: Assessment };

      // Results live in this component and nowhere else — no save step.
      setResult({ transcript, assessment });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  }

  const busy =
    status === "transcribing" || status === "feedback";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <AccessDialog
        open={gate !== null}
        message={gate ?? ""}
        onClose={() => setGate(null)}
        onRedeemed={() => {
          // The take is still in hand — close the dialog and finish the run
          // the person already made, rather than making them record again.
          setGate(null);
          submitRecording();
        }}
      />

      <ConsentGate onAccepted={setConsented} />

      <div className="flex items-center gap-4">
        {status === "recording" ? (
          <>
            <button
              onClick={stopRecording}
              className="rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700"
            >
              ⏹ Stop recording
            </button>
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
              <span className="font-mono tabular-nums text-slate-700">
                {formatDuration(elapsedMs)}
              </span>
              <span>/ 5:00</span>
            </span>
          </>
        ) : status !== "review" ? (
          <>
            <button
              onClick={startRecording}
              disabled={busy || !consented}
              className="rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              🎙 {status === "done" ? "Record again" : "Start recording"}
            </button>
            <span className="text-sm text-slate-500">{statusLabel(status)}</span>
          </>
        ) : null}
      </div>

      {status === "review" && audioUrl && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-600">
            Review your take ({formatDuration(elapsedMs)}) — listen back, then
            submit or re-record.
          </p>
          <audio controls src={audioUrl} className="mt-3 w-full" />
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={submitRecording}
              className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
            >
              Submit for feedback
            </button>
            <button
              onClick={discardRecording}
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-600 hover:bg-white"
            >
              ↻ Re-record
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          {result.assessment.summary && (
            <p className="text-slate-800">{result.assessment.summary}</p>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              How it held up
            </h3>
            <div className="mt-2 space-y-3">
              {AXES.map(axis => (
                <AxisCard
                  key={axis}
                  label={axis}
                  criterion={AXIS_CRITERIA[axis]}
                  verdict={result.assessment.axes[axis]}
                />
              ))}
            </div>
          </section>

          {result.assessment.next && (
            <section className="rounded-lg border border-brand/30 bg-brand/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand">
                Next time
              </h3>
              <p className="mt-2 text-slate-800">{result.assessment.next}</p>
            </section>
          )}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Transcript
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-slate-800">
              {result.transcript}
            </p>
          </section>
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {RESULT_DISCLAIMER}
          </p>
        </div>
      )}
    </div>
  );
}

const LEVEL_STYLE: Record<Level, string> = {
  solid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "needs work": "border-amber-200 bg-amber-50 text-amber-800",
  missing: "border-slate-200 bg-slate-50 text-slate-600",
};

/**
 * One axis: where it landed, what it is judged on, and why it landed there.
 * The criterion is shown to the learner and not kept in the prompt alone —
 * a verdict whose basis is hidden is the thing the scores used to be.
 */
function AxisCard({
  label,
  criterion,
  verdict,
}: {
  label: string;
  criterion: string;
  verdict: { level: Level; note: string };
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium capitalize text-slate-900">{label}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${LEVEL_STYLE[verdict.level]}`}
        >
          {verdict.level}
        </span>
        <span className="text-xs text-slate-500">
          {LEVEL_MEANING[verdict.level]}
        </span>
      </div>

      {verdict.note && (
        <p className="mt-2 text-sm text-slate-700">{verdict.note}</p>
      )}

      <p className="mt-2 text-xs text-slate-500">{criterion}</p>
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

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function statusLabel(status: Status): string {
  switch (status) {
    case "recording":
      return "Recording… speak now (auto-stops at 5 min).";
    case "transcribing":
      return "Transcribing audio…";
    case "feedback":
      return "Generating feedback…";
    case "done":
      return "Session saved.";
    default:
      return "Ready when you are!";
  }
}
