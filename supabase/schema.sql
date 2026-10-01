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

-- ────────────────────────────────────────────────────────────────
-- Practice history lives in attempts.sql, not here.
--
-- This file used to define a `sessions` table that kept the full transcript,
-- free-text feedback and 0-100 scores, and an optional audio bucket. All of it
-- is gone on purpose: sessions leaked every visitor's transcripts once, the
-- scores were replaced by named levels, and audio is never kept. If an older
-- database still has the table, drop it by hand:
--   drop table if exists public.sessions;
-- ────────────────────────────────────────────────────────────────
