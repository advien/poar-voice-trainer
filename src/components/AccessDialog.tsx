"use client";

import { useEffect, useRef } from "react";

/**
 * Shown when the server refuses a run with 402 — the free attempt is spent.
 * It explains the stop and gives one way forward; it is not the gate itself,
 * which lives in the route handlers (see src/lib/access.ts).
 */
export default function AccessDialog({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="access-title" className="text-lg font-semibold text-slate-900">
          Free attempt used
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p>

        <p className="mt-4 text-sm text-slate-600">
          Write to{" "}
          <a
            href="mailto:adsnufkin@gmail.com?subject=POAR%20Voice%20Trainer%20access"
            className="font-medium text-brand underline"
          >
            adsnufkin@gmail.com
          </a>
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
