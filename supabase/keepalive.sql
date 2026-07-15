-- ────────────────────────────────────────────────────────────────
-- Keep-alive support. Run once in the Supabase SQL editor.
--
-- A read-only REST ping proved insufficient to prevent free-tier
-- pausing (project froze within 4 days of a successful HTTP 200 ping),
-- so the GitHub Action now performs a real WRITE via this RPC.
--
-- Security model: the table has RLS enabled with NO policies, so it is
-- unreachable through the API. The only entry point is keepalive_ping(),
-- a SECURITY DEFINER function that updates a single fixed row. anon can
-- execute it; worst case an attacker can... refresh a timestamp.
-- ────────────────────────────────────────────────────────────────

create table if not exists public.keepalive (
  id        smallint primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);

insert into public.keepalive (id) values (1)
on conflict (id) do nothing;

alter table public.keepalive enable row level security;
-- Intentionally no policies: direct API access is blocked.

create or replace function public.keepalive_ping()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  update public.keepalive
     set pinged_at = now()
   where id = 1
  returning pinged_at;
$$;

revoke all on function public.keepalive_ping() from public;
grant execute on function public.keepalive_ping() to anon;
