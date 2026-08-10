import Link from "next/link";
import { notFound } from "next/navigation";
import { AREAS, getMode, type AreaId } from "@/lib/modes";
import { getSession, overallScore } from "@/lib/sessions";

export const dynamic = "force-dynamic";

const areaLabel = (id: AreaId) =>
  AREAS.find((a) => a.id === id)?.label ?? id;

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session) notFound();

  const mode = getMode(session.mode);
  const overall = overallScore(session);
  const scores: [string, number | null][] = [
    ["Clarity", session.clarity_score],
    ["Accuracy", session.accuracy_score],
    ["Professionalism", session.professionalism_score],
  ];

  // Link back into practice with the same question preselected.
  const repeatHref = session.question_id
    ? `/session/${session.mode}?q=${session.question_id}`
    : `/session/${session.mode}`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/progress" className="text-sm text-slate-500 hover:text-brand">
        ← Progress
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode?.title ?? session.mode}
          </h1>
          <p className="text-sm text-slate-400">
            {new Date(session.created_at).toLocaleString()}
          </p>
        </div>
        {overall != null && (
          <div className="shrink-0 rounded-xl border border-brand bg-brand/5 px-4 py-2 text-center">
            <p className="text-xs font-medium text-slate-500">Overall</p>
            <p className="text-2xl font-bold text-brand">{overall}</p>
          </div>
        )}
      </div>

      {session.areas && session.areas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {session.areas.map((a) => (
            <span
              key={a}
              className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
            >
              {areaLabel(a)}
            </span>
          ))}
        </div>
      )}

      {session.prompt && (
        <div className="mt-6 rounded-lg border-2 border-brand-dark bg-white px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Question
          </p>
          <p className="mt-1 text-slate-800">{session.prompt}</p>
        </div>
      )}

      {overall != null && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {scores.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {label}
                </span>
                <span className="text-lg font-semibold text-brand">
                  {value ?? "—"}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${value ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Transcript
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-slate-800">
          {session.transcript}
        </p>
      </section>

      {session.feedback && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            AI Feedback
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-800">
            {session.feedback}
          </p>
        </section>
      )}

      <div className="mt-8">
        <Link
          href={repeatHref}
          className="inline-block rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
        >
          ↻ Practice this again
        </Link>
      </div>
    </div>
  );
}
