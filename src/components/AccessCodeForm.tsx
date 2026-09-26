"use client";

import { useState } from "react";

/**
 * Redeems an access code, so nobody has to open a browser console to do it.
 * The server sets the cookie; what happens next is the caller's business —
 * reload a locked page, or carry on with the recording in hand.
 */
export default function AccessCodeForm({
  onSuccess,
}: {
  /**
   * Called once the code is accepted. Without it the page reloads, which is
   * right for a locked page and wrong mid-recording: a reload would discard
   * the take the person just made.
   */
  onSuccess?: () => void;
} = {}) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setState("sending");
    setMessage(null);

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setState("error");
        setMessage(body?.error ?? "That code was not accepted.");
        return;
      }

      if (onSuccess) onSuccess();
      else window.location.reload();
    } catch {
      setState("error");
      setMessage("Could not reach the server. Try again.");
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-wrap items-start gap-2">
      <label className="sr-only" htmlFor="access-code">
        Access code
      </label>
      <input
        id="access-code"
        type="password"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Access code"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={state === "sending" || !code.trim()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {state === "sending" ? "Checking…" : "Redeem"}
      </button>

      {message && (
        <p className="w-full text-sm text-red-700">{message}</p>
      )}
    </form>
  );
}
