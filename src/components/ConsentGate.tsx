"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_SUMMARY,
  POLICY_VERSION,
} from "@/lib/privacy";

/**
 * Asked once, before the first recording: the person is told where the audio
 * goes and that nothing is kept, and ticks the box.
 *
 * The browser remembers the accepted version so the question is not repeated;
 * the server keeps its own row (POST /api/consent) because local storage
 * belongs to the visitor and can be cleared at any time.
 *
 * `onAccepted` reports the current state to the parent, which disables
 * recording until it is true.
 */
export default function ConsentGate({
  onAccepted,
}: {
  onAccepted: (accepted: boolean) => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch {
      // Private mode or blocked storage: just ask again.
    }
    const ok = stored === POLICY_VERSION;
    setAccepted(ok);
    onAccepted(ok);
    setReady(true);
  }, [onAccepted]);

  function toggle(next: boolean) {
    setAccepted(next);
    onAccepted(next);

    try {
      if (next) {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, POLICY_VERSION);
      } else {
        window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      }
    } catch {
      // Not fatal — the checkbox still governs this visit.
    }

    if (next) {
      // Bookkeeping; the person is not kept waiting on it.
      void fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: POLICY_VERSION }),
      }).catch(() => {});
    }
  }

  // Avoid a flash of the unticked box for someone who already agreed.
  if (!ready) return null;
  if (accepted) return null;

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm leading-relaxed text-slate-600">
        {CONSENT_SUMMARY}{" "}
        <Link href="/privacy" className="text-brand underline">
          Full privacy notice
        </Link>
      </p>

      <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        <span>I understand, and I&apos;m ready to record.</span>
      </label>
    </div>
  );
}
