import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { hasAccessCode } from "@/lib/access";
import { summarise, type UsageSummary } from "@/lib/usage";
import AccessCodeForm from "@/components/AccessCodeForm";

export const metadata: Metadata = {
  title: "Usage — POAR Voice Trainer",
  robots: { index: false, follow: false },
};

// Always read the live numbers, never a cached page.
export const dynamic = "force-dynamic";

const usd = (n: number) =>
  n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;

/**
 * What this app has spent at OpenAI. Private: it is behind the access code,
 * because it is the owner's cost data, not something for visitors.
 *
 * These are the app's own figures, computed from the token and audio counts
 * each call reported. The bill of record is the OpenAI dashboard; the two
 * differ by rounding and by any price change not yet reflected in PRICES.
 */
export default async function UsagePage() {
  const h = await headers();
  const request = new Request("https://usage.local", { headers: h });

  if (!hasAccessCode(request)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Usage</h1>
        <p className="mt-4 leading-relaxed text-slate-700">
          This page is private — it shows what the service costs to run. Redeem
          an access code to see it.
        </p>

        <AccessCodeForm />
        <p className="mt-8 text-sm text-slate-500">
          <Link href="/" className="text-brand hover:underline">
            ← Back to the trainer
          </Link>
        </p>
      </div>
    );
  }

  const [week, month, all] = await Promise.all([
    summarise(7),
    summarise(30),
    summarise(3650),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Usage</h1>
      <p className="mt-2 leading-relaxed text-slate-600">
        What this app spent at OpenAI, counted from what each call reported.
        The bill of record is the{" "}
        <a
          className="text-brand underline"
          href="https://platform.openai.com/usage"
          target="_blank"
          rel="noopener"
        >
          OpenAI dashboard
        </a>
        ; expect small differences.
      </p>

      {week === null ? (
        <p className="mt-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No usage log available — either Supabase is not configured, or
          <code className="mx-1">usage_log.sql</code> has not been run yet.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          <Period title="Last 7 days" data={week} />
          <Period title="Last 30 days" data={month} />
          <Period title="All time" data={all} />
        </div>
      )}

      <p className="mt-10 text-sm text-slate-500">
        These rows record models and counts only — no transcripts and no
        visitors. See the{" "}
        <Link href="/privacy" className="text-brand underline">
          privacy notice
        </Link>
        .
      </p>
    </div>
  );
}

function Period({
  title,
  data,
}: {
  title: string;
  data: UsageSummary | null;
}) {
  if (!data) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className="text-xl font-semibold text-slate-900">
          {usd(data.costUsd)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <Stat label="Calls" value={String(data.calls)} />
        <Stat label="Audio" value={`${data.audioMinutes.toFixed(1)} min`} />
        <Stat label="Tokens in" value={data.promptTokens.toLocaleString()} />
        <Stat label="Tokens out" value={data.completionTokens.toLocaleString()} />
      </dl>

      {data.byModel.length > 0 && (
        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 font-medium">Model</th>
              <th className="pb-2 text-right font-medium">Calls</th>
              <th className="pb-2 text-right font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.byModel.map((m) => (
              <tr key={m.model} className="border-b border-slate-100 last:border-0">
                <td className="py-2 text-slate-800">{m.model}</td>
                <td className="py-2 text-right tabular-nums text-slate-600">
                  {m.calls}
                </td>
                <td className="py-2 text-right tabular-nums text-slate-800">
                  {usd(m.costUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
