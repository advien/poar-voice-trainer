-- ────────────────────────────────────────────────────────────────
-- Answer checklists and the per-item results stored with an attempt
-- (v2, step 4: reference answers and gap analysis).
--
-- A checklist is the list of things a good answer to one question covers. The
-- model marks each item covered / partial / missing; the account page then
-- shows which items a person keeps missing. Questions without a checklist
-- keep working and simply sit out of that statistics.
--
-- Run in the Supabase SQL editor, after schema.sql and attempts.sql. The
-- checklists themselves live in checklist_seed.sql, not here, so this file
-- stays structure only.
-- ────────────────────────────────────────────────────────────────

-- Where a checklist stands. An unreviewed checklist is a study aid, not a
-- standard of care, and the interface says so; only a clinician's read moves
-- it to the second value.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'checklist_review_status') then
    create type checklist_review_status as enum ('derived_from_source', 'clinician_reviewed');
  end if;
end
$$;

create table if not exists public.question_checklists (
  id             uuid primary key default gen_random_uuid(),
  -- One checklist per question. seed.sql truncates `questions` and issues new
  -- ids, which cascades here; checklist_seed.sql re-attaches every checklist
  -- by the question's prompt text, so no checklist is keyed on a uuid that a
  -- reseed would throw away.
  question_id    uuid not null unique references public.questions (id) on delete cascade,

  -- [{"key": "follow_up_plan", "label": "A follow-up plan"}, ...]
  -- `key` is stable and is what attempts and statistics refer to; `label` is
  -- what a person reads and may be reworded without breaking history.
  items          jsonb not null
                 check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),

  -- Provenance, so no checklist is ever of unknown origin.
  source         text not null,
  source_licence text not null,
  review_status  checklist_review_status not null default 'derived_from_source',

  created_at     timestamptz not null default now()
);

comment on table public.question_checklists is
  'Required elements of a good answer, per question. Study aid until review_status is clinician_reviewed.';

-- ────────────────────────────────────────────────────────────────
-- Row-level security: anyone may read, nobody may write through the API.
-- Checklists are content, not user data; they are changed from the SQL editor
-- or with the service-role key, never from a visitor's request.
-- ────────────────────────────────────────────────────────────────

alter table public.question_checklists enable row level security;

drop policy if exists "Anyone can read checklists" on public.question_checklists;
create policy "Anyone can read checklists"
  on public.question_checklists for select
  using (true);

-- ────────────────────────────────────────────────────────────────
-- What an attempt remembers about its checklist.
--
-- [{"key": "...", "label": "...", "status": "covered|partial|missing"}, ...]
--
-- The label is copied in so an old attempt still reads correctly after a
-- checklist is reworded or retired. Key, label and status only — never a quote
-- from the answer, because this column outlives the two-day transcript purge.
-- Null for an attempt whose question had no checklist.
--
-- It is written in the same insert as the rest of the attempt: attempts has no
-- update policy, on purpose.
-- ────────────────────────────────────────────────────────────────

alter table public.attempts
  add column if not exists checklist_results jsonb;

alter table public.attempts
  drop constraint if exists attempts_checklist_results_is_array;
alter table public.attempts
  add constraint attempts_checklist_results_is_array
  check (checklist_results is null or jsonb_typeof(checklist_results) = 'array');

comment on column public.attempts.checklist_results is
  'Per-item verdicts: key, label and covered/partial/missing only. No free text, so nothing from the answer outlives the transcript purge.';

-- Check it landed:
--   select column_name, data_type from information_schema.columns
--    where table_name = 'attempts' and column_name = 'checklist_results';
--   select polname from pg_policy where polrelid = 'public.question_checklists'::regclass;
