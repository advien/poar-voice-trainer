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
  params: { mode: string };
  searchParams: { q?: string };
}) {
  const mode = getMode(params.mode);
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

      <div className="mt-8">
        <SessionExperience
          mode={mode.id}
          questions={questions}
          fallbackPrompt={mode.prompt}
          initialQuestionId={searchParams.q}
        />
      </div>
    </div>
  );
}
