import { ModeCard } from "@/components/ModeCard";
import { MODES } from "@/lib/modes";

export default function ModesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">
        Choose a practice mode
      </h1>
      <p className="mt-2 text-slate-600">
        Each mode gives you a prompt to respond to out loud. Pick one to begin.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((mode) => (
          <ModeCard key={mode.id} mode={mode} />
        ))}
      </div>
    </div>
  );
}
