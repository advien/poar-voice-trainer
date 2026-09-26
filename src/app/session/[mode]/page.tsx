import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionExperience } from "@/components/SessionExperience";
import { getMode, MODES } from "@/lib/modes";
import { getQuestionsForMode } from "@/lib/questions";

// Questions are fetched live from Supabase, so render on demand.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return MODES.map((m) => ({ mode: m.id }));
}

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ mode: modeParam }, { q }] = await Promise.all([params, searchParams]);
  const mode = getMode(modeParam);
  if (!mode) notFound();

  const questions = await getQuestionsForMode(mode.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/modes" className="text-sm text-slate-500 hover:text-brand">
        ← All modes
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-3xl">{mode.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{mode.title}</h1>
          <p className="text-sm font-medium text-brand">{mode.tagline}</p>
        </div>
      </div>

      {mode.why && (
      <details className="group mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer list-none text-sm font-medium text-slate-700 marker:content-none">
          <span className="text-brand group-open:hidden">▸ </span>
          <span className="hidden text-brand group-open:inline">▾ </span>
          Why this mode exists
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{mode.why}</p>
      </details>
      )}

      <div className="mt-8">
        <SessionExperience
          mode={mode.id}
          questions={questions}
          fallbackPrompt={mode.prompt}
          initialQuestionId={q}
        />
      </div>
    </div>
  );
}
