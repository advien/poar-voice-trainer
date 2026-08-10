"use client";

import { useMemo, useState } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { AREAS, type AreaId, type ModeId } from "@/lib/modes";
import type { Question } from "@/lib/questions";

function randomOf<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

function areaLabel(id: AreaId): string {
  return AREAS.find((a) => a.id === id)?.label ?? id;
}

/**
 * Drives a practice session: pick one or more POAR areas to train, draw a
 * question whose tags overlap the selection, then record. Falls back to a
 * static prompt when the question bank is empty (Supabase not configured).
 */
export function SessionExperience({
  mode,
  questions,
  fallbackPrompt,
  initialQuestionId,
}: {
  mode: ModeId;
  questions: Question[];
  fallbackPrompt: string;
  initialQuestionId?: string;
}) {
  // When repeating a specific question (?q=), start from it.
  const initial = initialQuestionId
    ? questions.find((q) => q.id === initialQuestionId)
    : undefined;

  // Multi-select: start with all areas active, or just the repeated
  // question's areas so it stays in the pool.
  const [selected, setSelected] = useState<Set<AreaId>>(() =>
    initial ? new Set(initial.areas) : new Set(AREAS.map((a) => a.id)),
  );

  // Questions whose tags overlap the selected areas.
  const pool = useMemo(
    () =>
      questions.filter((q) => q.areas.some((a) => selected.has(a))),
    [questions, selected],
  );

  const [question, setQuestion] = useState<Question | undefined>(
    () => initial ?? randomOf(questions),
  );

  function toggleArea(id: AreaId) {
    setSelected((prev) => {
      const next = new Set(prev);
      // Keep at least one area selected.
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      const nextPool = questions.filter((q) =>
        q.areas.some((a) => next.has(a)),
      );
      // Re-draw if the current question no longer fits the selection.
      if (!question || !question.areas.some((a) => next.has(a))) {
        setQuestion(randomOf(nextPool));
      }
      return next;
    });
  }

  function shuffle() {
    setQuestion(randomOf(pool));
  }

  // No bank yet → simple static-prompt flow.
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-brand/5 px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Your prompt
          </p>
          <p className="mt-1 text-slate-800">{fallbackPrompt}</p>
        </div>
        <VoiceRecorder context={{ mode, prompt: fallbackPrompt }} />
      </div>
    );
  }

  const prompt = question?.prompt ?? "No question matches the selected areas.";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Areas to train{" "}
          <span className="text-slate-400">(pick one or more)</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AREAS.map((a) => {
            const active = selected.has(a.id);
            return (
              <button
                key={a.id}
                aria-pressed={active}
                onClick={() => toggleArea(a.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Your question
          </p>
          {pool.length > 1 && (
            <button
              onClick={shuffle}
              className="shrink-0 text-sm font-medium text-brand hover:underline"
            >
              ↻ Another
            </button>
          )}
        </div>

        {/* Library-card: framed question with area "tabs" hanging below. */}
        <div className="rounded-lg border-2 border-brand-dark bg-white px-5 py-4 shadow-sm">
          <p className="text-slate-800">{prompt}</p>
        </div>
        {question && question.areas.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-4">
            {question.areas.map((a) => (
              <span
                key={a}
                className="-mt-0.5 rounded-b-md border-2 border-t-0 border-brand-dark bg-brand/5 px-3 py-1 text-xs font-medium text-brand-dark"
              >
                {areaLabel(a)}
              </span>
            ))}
          </div>
        )}
      </div>

      <VoiceRecorder
        context={{
          mode,
          areas: question?.areas,
          questionId: question?.id,
          prompt,
        }}
      />
    </div>
  );
}
