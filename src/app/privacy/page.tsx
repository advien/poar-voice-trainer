import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, POLICY_VERSION } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Privacy — POAR Voice Trainer",
  description:
    "What happens to your recording, what is stored (almost nothing), who processes it, and how to reach us.",
};

/**
 * The full privacy notice. The short version by the record button and the
 * line under the results both come from src/lib/privacy.ts, so the three
 * cannot drift apart.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Privacy</h1>
      <p className="mt-2 text-sm text-slate-500">
        Version {POLICY_VERSION}
      </p>

      <div className="mt-8 space-y-8 text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            The short version
          </h2>
          <p className="mt-2 leading-relaxed">
            You record an answer. It goes to OpenAI, comes back as text, and a
            model scores it. You read the result and it disappears. There is no
            account, no history, and nothing about you is kept.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            What happens to the recording
          </h2>
          <p className="mt-2 leading-relaxed">
            The audio is recorded in your browser and sent to{" "}
            <strong>OpenAI</strong> for transcription (Whisper) and for the
            coaching text and scores (GPT-4o mini). OpenAI processes API data on
            servers outside the EU and, under its API terms, does not use it to
            train its models.
          </p>
          <p className="mt-3 leading-relaxed">
            The audio is not written to any database here and is not kept after
            the request. The transcript, the feedback and the scores are sent
            back to your browser and held in the page while it is open. Close
            the tab and they are gone.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            What is stored
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              <strong>A counter for the free attempt.</strong> To stop one
              visitor using the service repeatedly, the number of attempts is
              stored against a one-way hash of your IP address, salted with a
              secret. The address itself is never written down and cannot be
              recovered from the hash.
            </li>
            <li>
              <strong>The fact that you accepted this notice</strong> — the same
              hash, the version above, and the date. No content, no identifiers
              you would recognise.
            </li>
            <li>
              <strong>What the service itself consumed.</strong> Each paid call
              records which model ran, how many seconds of audio or tokens it
              handled, and when — so the running cost can be watched. These rows
              describe the service, not you: they carry no content and nothing
              that links them to a visitor.
            </li>
          </ul>
          <p className="mt-3 leading-relaxed">
            That is the whole list for the open trial. No transcripts, no
            audio, no scores, no name, no email, no analytics, no advertising
            or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cookies</h2>
          <p className="mt-2 leading-relaxed">
            Browsing and practising anonymously sets no cookies at all. Two
            things can set one: redeeming an access code, which records that it
            was redeemed so you are not asked again for 30 days; and signing in,
            which sets the session cookies Supabase uses to keep you signed in.
            Both are strictly functional — nothing here tracks you between
            sites.
          </p>
          <p className="mt-3 leading-relaxed">
            Your acceptance of this notice is remembered in your
            browser&apos;s local storage so you are not asked twice; clearing
            your browser data clears it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Who else is involved
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              <strong>OpenAI</strong> — transcription and scoring, as described
              above.
            </li>
            <li>
              <strong>Cloudflare</strong> — hosting and network. Like any web
              host it processes connection data, including IP addresses, to
              serve and protect the site.
            </li>
            <li>
              <strong>Supabase</strong> — the database holding the two counters
              above, and the question bank.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Your rights</h2>
          <p className="mt-2 leading-relaxed">
            There is nothing here that identifies you, so there is usually
            nothing to hand over or erase. If you believe otherwise, or want the
            attempt counter and consent record tied to your connection removed,
            write to{" "}
            <a
              className="text-brand underline"
              href={`mailto:${CONTACT_EMAIL}?subject=Privacy%20request`}
            >
              {CONTACT_EMAIL}
            </a>
            . The same address takes any question about this notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
          <p className="mt-2 leading-relaxed">
            You can sign in, by a one-time link sent to your email. Accounts are
            invitation-only: sign-up is closed, so a link only reaches an
            address that already has one.
          </p>
          <p className="mt-3 leading-relaxed">
            An account holds your email address and the sign-in records
            Supabase keeps for it. Nothing else yet — practice history is not
            saved for accounts either, and when that changes this notice will
            say what is kept, and for how long, before the first session is
            stored.
          </p>
        </section>
      </div>

      <p className="mt-10">
        <Link href="/" className="text-sm text-brand hover:underline">
          ← Back to the trainer
        </Link>
      </p>
    </div>
  );
}
