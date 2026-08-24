-- =============================================================
-- DECAYSTATE :: WAITLIST TABLE
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- =============================================================

create table public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  tier       text not null default '02'
               check (tier in ('01', '02', '03')),
  created_at timestamptz default now()
);

-- No RLS needed — inserts happen via service role from the API route.
-- Reads are admin-only via Supabase Dashboard or direct SQL.

-- Optional: index for fast lookup by email
create index waitlist_email_idx on public.waitlist(email);
