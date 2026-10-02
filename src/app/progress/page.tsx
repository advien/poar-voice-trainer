import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Progress — POAR Voice Trainer",
  description:
    "Progress lives in an account. The open trial keeps nothing, by design.",
};

/**
 * There is no history to show here: the open trial stores nothing, and a signed
 * in person's history is on /account. Rather than a page that quietly lists
 * nothing, this says where progress is and why.
 */
export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Progress</h1>

      <p className="mt-4 leading-relaxed text-slate-700">
        Nothing is tracked here. The open trial sends your recording for
        transcription and coaching, shows the result, and keeps none of it — no
        audio, no transcript, no result. There is nothing to build a history
        from, which is the point.
      </p>

      <p className="mt-4 leading-relaxed text-slate-700">
        Counting how often each axis needed work needs somewhere to keep your
        attempts, and that is an account. Signed in, your history and those
        counts are on your{" "}
        <Link href="/account" className="text-brand underline">
          account page
        </Link>{" "}
        — visible to you and to nobody else. Accounts are by invitation.
      </p>

      <p className="mt-6 leading-relaxed text-slate-700">
        Want one? Write to{" "}
        <a
          className="font-medium text-brand underline"
          href={`mailto:${CONTACT_EMAIL}?subject=POAR%20Voice%20Trainer%20account`}
        >
          {CONTACT_EMAIL}
        </a>
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
