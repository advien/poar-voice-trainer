import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { summarise } from "@/lib/usage";
import { listAttempts } from "@/lib/attempts";
import AttemptHistory from "@/components/AttemptHistory";
import { CONTACT_EMAIL } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Account — POAR Voice Trainer",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const usd = (n: number) =>
  n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;

/**
 * The account: what practice has been done, and what it costs to run.
 *
 * Practice history is not here yet — the open trial deliberately stores
 * nothing, and saving answers for signed-in users is the next piece of work.
 * Rather than a chart of fabricated zeros, this says so.
 */
export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account");

  const [month, attempts] = await Promise.all([
    summarise(30),
    listAttempts(50),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Account</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Practice history</h2>
        <p className="mt-1 text-sm text-slate-500">
          Yours alone. The open trial keeps nothing at all — see the{" "}
          <Link href="/privacy" className="text-brand underline">
            privacy notice
          </Link>
          .
        </p>

        <AttemptHistory rows={attempts} />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Running cost</h2>
          {month && (
            <span className="text-xl font-semibold text-slate-900">
              {usd(month.costUsd)}
            </span>
          )}
        </div>

        {month === null ? (
          <p className="mt-2 text-sm text-slate-500">
            No usage log available yet.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">
              Last 30 days · {month.calls} call{month.calls === 1 ? "" : "s"} ·{" "}
              {month.audioMinutes.toFixed(1)} min of audio
            </p>
            <p className="mt-3 text-sm">
              <Link href="/usage" className="text-brand underline">
                Full breakdown
              </Link>
            </p>
          </>
        )}
      </section>

      <p className="mt-8 text-sm text-slate-500">
        Questions about the account: {CONTACT_EMAIL}
      </p>
    </div>
  );
}
