"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CONTACT_EMAIL } from "@/lib/privacy";

/**
 * Sign-in by magic link.
 *
 * Accounts are not open: sign-up is disabled in Supabase, so a link only
 * arrives for an address that already has one. The confirmation below says
 * exactly that rather than promising an email to everyone — a message that
 * claimed "check your inbox" for an unknown address would be a small lie, and
 * would also tell a stranger which addresses exist.
 */
function LoginForm() {
  const params = useSearchParams();
  const linkExpired = params.get("error") === "link_expired";

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("sending");
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }

    setState("sent");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>

      {linkExpired && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That link is no longer valid. Ask for a fresh one below.
        </p>
      )}

      {state === "sent" ? (
        <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 leading-relaxed text-slate-700">
          If <strong>{email}</strong> has an account, a sign-in link is on its
          way. The link works once and expires shortly.
        </p>
      ) : (
        <>
          <p className="mt-4 leading-relaxed text-slate-600">
            Enter your email and you&apos;ll get a one-time sign-in link. No
            password to remember.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </label>

            <button
              type="submit"
              disabled={state === "sending"}
              className="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {state === "sending" ? "Sending…" : "Email me a link"}
            </button>

            {message && (
              <p className="text-sm text-red-700">{message}</p>
            )}
          </form>
        </>
      )}

      <p className="mt-8 text-sm leading-relaxed text-slate-500">
        Accounts are invitation-only for now. To ask for one, write to{" "}
        <a
          className="text-brand underline"
          href={`mailto:${CONTACT_EMAIL}?subject=POAR%20Voice%20Trainer%20account`}
        >
          {CONTACT_EMAIL}
        </a>
        . You can practise without an account — the{" "}
        <Link href="/" className="text-brand underline">
          open trial
        </Link>{" "}
        needs no sign-in.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
