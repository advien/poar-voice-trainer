import Link from "next/link";
import type { PracticeMode } from "@/lib/modes";

export function ModeCard({ mode }: { mode: PracticeMode }) {
  return (
    <Link
      href={`/session/${mode.id}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-brand hover:shadow-md"
    >
      <span className="text-3xl">{mode.icon}</span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-brand">
        {mode.title}
      </h2>
      <p className="text-sm font-medium text-brand">{mode.tagline}</p>
      <p className="mt-3 flex-1 text-sm text-slate-600">{mode.description}</p>
      <span className="mt-4 text-sm font-medium text-brand">
        Start →
      </span>
    </Link>
  );
}
