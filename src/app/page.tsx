import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-brand">
        Prosthetics · Orthotics · Assistive Robotics
      </p>
      <h1 className="mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">
        Learn to explain POAR clearly — out loud.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
        POAR Voice Trainer is a voice-based AI assistant for practicing how you
        explain prosthetics, orthotics, and assistive robotics. Record your
        voice, get it transcribed, receive AI feedback, and track your progress.
      </p>

      <div className="mt-10 flex items-center justify-center gap-4">
        <Link
          href="/modes"
          className="rounded-lg bg-brand px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          Start practicing
        </Link>
      </div>

      <h2
        id="how-it-works"
        className="mt-20 text-center text-sm font-semibold uppercase tracking-wide text-brand"
      >
        How it works
      </h2>

      <div className="mt-6 grid gap-6 text-left sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Record",
            body: "Choose a mode and speak your answer into the mic.",
          },
          {
            step: "2",
            title: "Transcribe & review",
            body: "Your speech is transcribed and analyzed by AI.",
          },
          {
            step: "3",
            title: "Improve",
            body: "Get feedback, save the session, and practice again.",
          },
        ].map((s) => (
          <div
            key={s.step}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
              {s.step}
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
