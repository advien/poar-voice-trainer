"use client";

import { useState } from "react";

/**
 * Redeems an access code, so nobody has to open a browser console to do it.
 * On success the cookie is set by the server and the page is reloaded, which
 * is enough for the gate and for /usage to notice.
 */
export default function AccessCodeForm() {
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

      window.location.reload();
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
