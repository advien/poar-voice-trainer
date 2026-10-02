import Link from "next/link";
import { AXES, LEVEL_MEANING, type Axis, type Level } from "@/lib/assessment";
import { tallyAxes, tallyChecklist, type AttemptRow } from "@/lib/attempts";
import { getMode } from "@/lib/modes";

const LEVEL_STYLE: Record<Level, string> = {
  solid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "needs work": "border-amber-200 bg-amber-50 text-amber-800",
  missing: "border-slate-200 bg-slate-50 text-slate-600",
};

/** An item needs this many judged answers before a "you miss it" claim is made. */
const MIN_JUDGED_FOR_PATTERN = 3;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * Practice history for the signed-in account.
 *
 * The tally comes first because it is the part worth acting on: not an average
 * of anything, but how often each axis needed work. The attempts below it are
 * the evidence for that count, and they lose their transcript after two days —
 * which the list says outright, so a missing transcript reads as the policy
 * working rather than as data lost.
 */
export default function AttemptHistory({ rows }: { rows: AttemptRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="mt-2 leading-relaxed text-slate-600">
        No attempts yet. Practise while signed in and they appear here — the
        coaching stays, the transcript for two days.{" "}
        <Link href="/modes" className="text-brand underline">
          Pick a mode
        </Link>
        .
      </p>
    );
  }

  const tally = tallyAxes(rows);
  // Only items judged often enough to be a pattern, and only those with a gap.
  const gaps = tallyChecklist(rows).filter(
    t => t.judged >= MIN_JUDGED_FOR_PATTERN && t.partial + t.missing > 0,
  );

  return (
    <div className="mt-4 space-y-8">
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Across your last {rows.length} attempt{rows.length === 1 ? "" : "s"}
        </h3>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {tally.map(t => {
            const judged = t.solid + t.needsWork + t.missing;
            return (
              <div key={t.axis} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium capitalize text-slate-900">{t.axis}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
                  {t.needsWork + t.missing}
                  <span className="text-base font-normal text-slate-500">
                    {" "}
                    of {judged}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  needed work or went missing
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {gaps.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            What your answers keep leaving out
          </h3>
          <ul className="mt-3 space-y-2">
            {gaps.map(g => (
              <li key={g.key} className="text-slate-800">
                <span className="font-medium">{g.label}</span>
                <span className="text-slate-600">
                  {" "}
                  — missed or only partly covered in {g.partial + g.missing} of{" "}
                  {g.judged} answers
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Counted only over answers to questions that have a checklist. The
            checklists are study aids, not a standard of care.
          </p>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Attempts
        </h3>

        <ul className="mt-3 space-y-4">
          {rows.map(row => (
            <li key={row.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-slate-900">
                  {getMode(row.mode)?.title ?? row.mode}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDate(row.created_at)}
                </span>
              </div>

              {row.prompt && (
                <p className="mt-2 text-sm italic text-slate-600">{row.prompt}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {AXES.map(axis => {
                  const level = row.axes[axis].level;
                  if (!level) return null;
                  return (
                    <span
                      key={axis}
                      title={LEVEL_MEANING[level]}
                      className={`rounded-full border px-2 py-0.5 text-xs ${LEVEL_STYLE[level]}`}
                    >
                      <span className="capitalize">{axis}</span>: {level}
                    </span>
                  );
                })}
              </div>

              {row.next_step && (
                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-medium">Next time: </span>
                  {row.next_step}
                </p>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-slate-500">
                  {row.transcript ? "What you said" : "Transcript"}
                </summary>
                {row.transcript ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {row.transcript}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Deleted — transcripts are kept for two days, the coaching
                    above is not. This is the policy working, not a loss.
                  </p>
                )}
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export type { Axis };
