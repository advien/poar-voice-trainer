-- ────────────────────────────────────────────────────────────────
-- POAR Voice Trainer — Supabase schema proposal (MVP, milestone 1)
--
-- Run in the Supabase SQL editor (Project → SQL → New query), or via
-- the Supabase CLI. This is a proposal — review before applying.
--
-- Auth users live in the built-in `auth.users` table; we reference it.
-- ────────────────────────────────────────────────────────────────

-- Enum for the three MVP practice modes.
create type practice_mode as enum (
  'explain-term',
  'patient-communication',
  'interview'
);

-- Enum for the three POAR subject areas.
create type poar_area as enum (
  'prosthetics',
  'orthotics',
  'robotics'
);

-- ────────────────────────────────────────────────────────────────
-- Question bank. Each question belongs to one practice mode and is
-- tagged with ONE OR MORE POAR areas (cross-cutting questions are fine).
-- Reference data, readable by everyone; only admins should write
-- (writes go through the service-role key / SQL editor).
-- ────────────────────────────────────────────────────────────────
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  mode        practice_mode not null,
  areas       poar_area[] not null,
  prompt      text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),

  -- A question must carry at least one area tag.
  constraint questions_areas_not_empty check (array_length(areas, 1) >= 1)
);

create index if not exists questions_mode_idx
  on public.questions (mode)
  where is_active;

-- GIN index supports overlap queries (areas && ARRAY[...]) for filtering.
create index if not exists questions_areas_gin_idx
  on public.questions using gin (areas);

alter table public.questions enable row level security;

create policy "Anyone can read active questions"
  on public.questions for select
  using (is_active);

-- One row per completed practice session.
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
  mode        practice_mode not null,

  -- POAR area tags the question carried (denormalized for history).
  areas       poar_area[],

  -- The question that was answered (nullable: free-form sessions allowed).
  question_id uuid references public.questions (id) on delete set null,

  -- The prompt the user responded to (denormalized for history).
  prompt      text,

  -- Whisper transcript of the user's spoken answer.
  transcript  text not null,

  -- AI-generated feedback (Claude/OpenAI).
  feedback    text,

  -- Optional structured scores for later analytics (0–100).
  clarity_score        smallint,
  accuracy_score       smallint,
  professionalism_score smallint,

  -- Optional: path to stored audio in Supabase Storage (if retained).
  audio_path  text,

  created_at  timestamptz not null default now()
);

create index if not exists sessions_user_id_created_at_idx
  on public.sessions (user_id, created_at desc);

-- ────────────────────────────────────────────────────────────────
-- Row Level Security: users may only see and write their own sessions.
-- ────────────────────────────────────────────────────────────────
alter table public.sessions enable row level security;

create policy "Users can read their own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- Optional (later milestone): a Storage bucket for retained audio.
--   insert into storage.buckets (id, name, public)
--   values ('recordings', 'recordings', false);
-- with RLS policies scoping objects to auth.uid().
-- ────────────────────────────────────────────────────────────────
