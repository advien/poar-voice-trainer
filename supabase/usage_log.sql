-- ────────────────────────────────────────────────────────────────
-- Metering for the app's own OpenAI spend (see src/lib/usage.ts).
--
-- One row per paid call: which route, which model, how much audio, how many
-- tokens, and when. Nothing about the person who triggered it — no visitor
-- hash, no transcript, no content. These rows describe the service, not its
-- users, which is why the privacy notice can still say no content is stored.
--
-- Run in the Supabase SQL editor (Project → SQL → New query).
-- ────────────────────────────────────────────────────────────────

create table if not exists public.usage_log (
  id                bigint generated always as identity primary key,
  endpoint          text        not null check (endpoint in ('transcribe', 'feedback')),
  model             text        not null,
  audio_seconds     numeric,
  prompt_tokens     integer,
  completion_tokens integer,
  created_at        timestamptz not null default now()
);

comment on table public.usage_log is
  'Per-call OpenAI consumption for this app. No user content and no visitor identifiers.';

-- The usage page always asks "since when", so that is the index worth having.
create index if not exists usage_log_created_at_idx
  on public.usage_log (created_at desc);

-- RLS on with no policies: only the service-role key reaches it.
alter table public.usage_log enable row level security;
