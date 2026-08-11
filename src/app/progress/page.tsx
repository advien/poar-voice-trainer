import Link from "next/link";
import { getMode } from "@/lib/modes";
import {
  averageScores,
  getRecentSessions,
  overallScore,
  weakestMode,
} from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const sessions = await getRecentSessions(50);
  const averages = averageScores(sessions);
  const weakest = weakestMode(sessions);

  // Oldest → newest for the trend.
  const scored = sessions
    .filter((s) => overallScore(s) != null)
    .slice()
    .reverse();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Your progress</h1>
      <p className="mt-1 text-sm text-slate-500">
        Scores across your last {sessions.length} session
        {sessions.length === 1 ? "" : "s"}.
      </p>

      {sessions.length === 0 ? (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No sessions yet.{" "}
          <Link href="/modes" className="font-medium text-brand hover:underline">
            Record your first one →
          </Link>
        </div>
      ) : (
        <>
          {averages && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Overall" value={averages.overall} primary />
              <StatCard label="Clarity" value={averages.clarity} />
              <StatCard label="Accuracy" value={averages.accuracy} />
              <StatCard
                label="Professionalism"
                value={averages.professionalism}
              />
            </div>
          )}

          {weakest && weakest.count > 0 && (
            <Link
              href={`/session/${weakest.mode}`}
              className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:border-amber-300"
            >
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Focus area: {getMode(weakest.mode)?.title ?? weakest.mode}
                </p>
                <p className="text-xs text-amber-700">
                  Your lowest average ({weakest.overall}) across{" "}
                  {weakest.count} session{weakest.count === 1 ? "" : "s"}.
                  Practice it →
                </p>
              </div>
              <span className="shrink-0 text-2xl font-bold text-amber-700">
                {weakest.overall}
              </span>
            </Link>
          )}

          {scored.length > 1 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Overall score over time
              </h2>
              <div className="mt-3 flex h-32 items-end gap-1.5">
                {scored.map((s) => {
                  const v = overallScore(s) as number;
                  return (
                    <div
                      key={s.id}
                      title={`${v} · ${new Date(s.created_at).toLocaleDateString()}`}
                      className="flex-1 rounded-t bg-brand/80 transition-colors hover:bg-brand"
                      style={{ height: `${Math.max(v, 2)}%` }}
                    />
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Oldest → newest. Hover a bar for the score.
              </p>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Recent sessions
            </h2>
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {sessions.map((s) => {
                const v = overallScore(s);
                return (
                  <li key={s.id}>
                    <Link
                      href={`/progress/${s.id}`}
                      className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-800">
                          {s.prompt ?? "(free-form session)"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {getMode(s.mode)?.title ?? s.mode} ·{" "}
                          {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold ${
                          v == null
                            ? "bg-slate-100 text-slate-400"
                            : "bg-brand/10 text-brand"
                        }`}
                      >
                        {v ?? "—"}
                      </span>
                      <span className="shrink-0 text-slate-300">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  primary,
}: {
  label: string;
  value: number;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        primary ? "border-brand bg-brand/5" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand">{value}</p>
    </div>
  );
}
