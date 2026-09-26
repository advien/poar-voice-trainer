-- ────────────────────────────────────────────────────────────────
-- Free-attempt ledger for the access gate (see src/lib/access.ts).
--
-- One row per visitor, identified by a salted hash of their IP — the raw
-- address is never stored. Written only by the service-role key from route
-- handlers, so no policy grants access to anyone else.
--
-- Run in the Supabase SQL editor (Project → SQL → New query).
-- ────────────────────────────────────────────────────────────────

create table if not exists public.free_usage (
  visitor_hash text primary key,
  attempts     integer     not null default 0,
  first_seen   timestamptz not null default now(),
  last_seen    timestamptz not null default now()
);

comment on table public.free_usage is
  'Attempts spent per visitor against the free allowance. Hash of IP + salt; no raw addresses.';

-- RLS on with no policies: the anon and authenticated roles cannot touch this
-- table at all. The service-role key bypasses RLS, which is how the route
-- handlers write to it.
alter table public.free_usage enable row level security;

-- Housekeeping: old rows serve no purpose once the visitor is long gone.
-- Run occasionally, or schedule with pg_cron if it ever matters.
-- delete from public.free_usage where last_seen < now() - interval '180 days';
