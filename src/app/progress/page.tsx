import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Progress — POAR Voice Trainer",
  description:
    "Progress tracking belongs to an account. The open trial keeps nothing, by design.",
};

/**
 * There is no history to show: the trial stores nothing. Rather than a page
 * that quietly lists nothing, this says where progress went and why.
 */
export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Progress</h1>

      <p className="mt-4 leading-relaxed text-slate-700">
        Nothing is tracked here. The open trial sends your recording for
        transcription and scoring, shows the result, and keeps none of it — no
        audio, no transcript, no scores. There is nothing to build a history
        from, which is the point.
      </p>

      <p className="mt-4 leading-relaxed text-slate-700">
        Averages, trends and the weakest-area callout need somewhere to store
        your answers, and that needs an account. Accounts are not built yet.
        When they are, progress lives inside one — visible to you and to nobody
        else.
      </p>

      <p className="mt-6 leading-relaxed text-slate-700">
        Want one? Write to{" "}
        <a
          className="font-medium text-brand underline"
          href={`mailto:${CONTACT_EMAIL}?subject=POAR%20Voice%20Trainer%20account`}
        >
          {CONTACT_EMAIL}
        </a>{" "}
        — the address is here in plain text, so it works whether or not your
        browser opens a mail app.
      </p>

      <p className="mt-8 text-sm text-slate-500">
        What the trial does and does not keep is spelled out in the{" "}
        <Link href="/privacy" className="text-brand underline">
          privacy notice
        </Link>
        .
      </p>
    </div>
  );
}
