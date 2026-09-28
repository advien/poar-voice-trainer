-- ────────────────────────────────────────────────────────────────
-- Practice attempts for signed-in accounts (v2, step 1) and the two-day
-- transcript retention that goes with them (step 2).
--
-- The open trial stores nothing and does not touch this table. Only a
-- signed-in user writes here, as themselves, under row-level security — never
-- through the service-role key, which bypasses RLS and is exactly how the old
-- `sessions` table ended up readable by every visitor.
--
-- Run in the Supabase SQL editor (Project → SQL → New query). The retention
-- job at the bottom needs the `pg_cron` extension: enable it once under
-- Database → Extensions before running that part.
-- ────────────────────────────────────────────────────────────────

-- The three levels an axis can come back at. Mirrors LEVELS in
-- src/lib/assessment.ts; changing one without the other will fail the insert,
-- which is the desired kind of failure.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'assessment_level') then
    create type assessment_level as enum ('solid', 'needs work', 'missing');
  end if;
end
$$;

create table if not exists public.attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),

  mode        practice_mode not null,
  -- The question as answered. `question_id` may go null if a question is
  -- retired; `prompt` is denormalised so the history still reads correctly.
  question_id uuid references public.questions (id) on delete set null,
  prompt      text,

  -- Deleted two days after the attempt — see the retention job below. The row
  -- survives; only this column is emptied.
  transcript  text,

  -- What the coach said. These are what a history is made of, and they are
  -- deliberately not the words the person spoke.
  summary                  text,
  next_step                text,
  clarity_level            assessment_level,
  clarity_note             text,
  accuracy_level           assessment_level,
  accuracy_note            text,
  professionalism_level    assessment_level,
  professionalism_note     text
);

comment on table public.attempts is
  'One practice attempt by a signed-in user. Transcripts are purged after two days; verdicts are kept until the user deletes them.';

comment on column public.attempts.transcript is
  'Emptied by the purge_old_transcripts job two days after created_at.';

-- Every read is "this user, newest first".
create index if not exists attempts_user_created_idx
  on public.attempts (user_id, created_at desc);

-- Lets the purge find its work without scanning the whole table.
create index if not exists attempts_transcript_pending_idx
  on public.attempts (created_at)
  where transcript is not null;

-- ────────────────────────────────────────────────────────────────
-- Row-level security: a row belongs to the account that wrote it.
-- ────────────────────────────────────────────────────────────────

alter table public.attempts enable row level security;

drop policy if exists "Users read their own attempts" on public.attempts;
create policy "Users read their own attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert their own attempts" on public.attempts;
create policy "Users insert their own attempts"
  on public.attempts for insert
  with check (auth.uid() = user_id);

-- Deletion is the user's own to perform: the privacy notice promises they can
-- remove their history, and a promise that needs an email to honour is weaker
-- than one the interface can keep.
drop policy if exists "Users delete their own attempts" on public.attempts;
create policy "Users delete their own attempts"
  on public.attempts for delete
  using (auth.uid() = user_id);

-- No update policy on purpose: an attempt is a record of what happened, and
-- nothing in the app has a reason to rewrite one.

-- ────────────────────────────────────────────────────────────────
-- Retention: empty the transcript two days on, keep the verdicts.
--
-- Needs `pg_cron` (Database → Extensions). Runs at 03:17 UTC — an odd minute,
-- because every job scheduled on the hour competes with every other one.
-- ────────────────────────────────────────────────────────────────

create or replace function public.purge_old_transcripts()
returns void
language sql
security definer
set search_path = public
as $$
  update public.attempts
     set transcript = null
   where transcript is not null
     and created_at < now() - interval '2 days';
$$;

comment on function public.purge_old_transcripts is
  'Empties transcripts older than two days. Scheduled by pg_cron; safe to run by hand.';

-- Schedule it. Re-running this file replaces the schedule rather than adding
-- a second copy of it.
select cron.unschedule('purge-old-transcripts')
  where exists (select 1 from cron.job where jobname = 'purge-old-transcripts');

select cron.schedule(
  'purge-old-transcripts',
  '17 3 * * *',
  $$select public.purge_old_transcripts()$$
);

-- Check it landed:
--   select jobname, schedule, active from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 5;
