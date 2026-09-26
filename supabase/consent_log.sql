-- ────────────────────────────────────────────────────────────────
-- Consent ledger for the privacy notice (see src/app/api/consent/route.ts).
--
-- One row per visitor per policy version: the same salted hash used by the
-- access gate, the version accepted, and when. No content, no raw address —
-- nothing that points back at a person. The browser keeps its own copy for
-- convenience; this is the durable one, in case the question is ever asked.
--
-- Run in the Supabase SQL editor (Project → SQL → New query).
-- ────────────────────────────────────────────────────────────────

create table if not exists public.consent_log (
  visitor_hash   text        not null,
  policy_version text        not null,
  accepted_at    timestamptz not null default now(),
  primary key (visitor_hash, policy_version)
);

comment on table public.consent_log is
  'Acceptance of the privacy notice, per visitor hash and policy version. No personal content.';

-- RLS on with no policies: anon and authenticated cannot read or write it.
-- Route handlers use the service-role key, which bypasses RLS.
alter table public.consent_log enable row level security;
