-- =============================================================
-- DECAYSTATE :: SUPABASE SETUP
-- Run this entire file in your Supabase SQL Editor
-- Project: DecayState | Updated: 2026-02-22
-- =============================================================


-- =============================================================
-- SECTION 1: CORE TABLES
-- =============================================================

-- profiles: extends auth.users with app-specific data
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  name                text not null,
  username            text unique,
  email               text,
  avatar_url          text,
  bio                 text,
  notification_prefs  jsonb not null default '{"email":true,"push":true,"weekly":false,"decay":true}'::jsonb,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- missions: a user's goals over time (multiple supported, one active)
create table public.missions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  goal        text not null,
  manifesto   text,
  timeframe   text not null default '30 Days',
  image_url   text,                             -- Storage path: userId/timestamp.ext
  is_active   boolean not null default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- mandates: daily tasks, optionally linked to a mission
create table public.mandates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  mission_id   uuid references public.missions(id) on delete set null,
  label        text not null,
  category     text not null check (category in ('physical', 'intellectual', 'spiritual')),
  rationale    text,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- journal_entries: daily protocol logs, optionally linked to mission + mandate
create table public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  mission_id  uuid references public.missions(id) on delete set null,
  mandate_id  uuid references public.mandates(id) on delete set null,
  date        date not null default current_date,
  wins        text,
  failures    text,
  adjustments text,
  image_url   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);


-- =============================================================
-- SECTION 2: AI CHAT TABLES
-- =============================================================

-- conversations: scoped chat threads (per-mission or global)
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  mission_id  uuid references public.missions(id) on delete set null,
  title       text not null default 'New Session',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ai_chats: individual messages within a conversation
create table public.ai_chats (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender          text not null check (sender in ('user', 'ai')),
  text            text not null,
  created_at      timestamptz default now()
);


-- =============================================================
-- SECTION 3: SYSTEM TABLES
-- =============================================================

-- activity_log: real-time event stream for the dashboard terminal
create table public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('mandate', 'journal', 'mission', 'ai', 'system')),
  message    text not null,
  created_at timestamptz default now()
);

-- subscriptions: Dodo Payments billing state mirror
create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  dodo_customer_id     text,
  dodo_subscription_id text,
  tier                 text not null default 'observer'
                         check (tier in ('observer', 'operator')),
  status               text not null default 'active'
                         check (status in ('active', 'cancelled', 'on_hold', 'failed', 'renewed')),
  current_period_end   timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);


-- =============================================================
-- SECTION 4: ROW LEVEL SECURITY
-- =============================================================

alter table public.profiles        enable row level security;
alter table public.missions        enable row level security;
alter table public.mandates        enable row level security;
alter table public.journal_entries enable row level security;
alter table public.conversations   enable row level security;
alter table public.ai_chats        enable row level security;
alter table public.activity_log    enable row level security;
alter table public.subscriptions   enable row level security;

-- profiles: users can read/update their own row only
create policy "profiles: own data"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- missions
create policy "missions: own data"
  on public.missions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- mandates
create policy "mandates: own data"
  on public.mandates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- journal_entries
create policy "journal_entries: own data"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- conversations
create policy "conversations: own data"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ai_chats
create policy "ai_chats: own data"
  on public.ai_chats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- activity_log
create policy "activity_log: own data"
  on public.activity_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- subscriptions: read-only for users (writes happen via service role in webhook)
create policy "subscriptions: read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);


-- =============================================================
-- SECTION 5: AUTO updated_at TRIGGER
-- =============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger trg_missions_updated_at
  before update on public.missions
  for each row execute function public.handle_updated_at();

create trigger trg_mandates_updated_at
  before update on public.mandates
  for each row execute function public.handle_updated_at();

create trigger trg_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.handle_updated_at();

create trigger trg_conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();


-- =============================================================
-- SECTION 6: AUTO-CREATE PROFILE ON SIGN UP
-- (fires whenever a new user registers via Supabase Auth)
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, username, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );

  -- also seed an observer subscription row
  insert into public.subscriptions (user_id, tier, status)
  values (new.id, 'observer', 'active');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================
-- SECTION 7: BACKFILL FOR PRE-EXISTING USERS
-- If you had auth users before running this script, run the
-- two INSERT statements below (uncommented) in the SQL Editor
-- to create their missing profile + subscription rows.
-- =============================================================

-- INSERT INTO public.profiles (id, name, email)
-- SELECT
--   id,
--   coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)),
--   email
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.profiles);
--
-- INSERT INTO public.subscriptions (user_id, tier, status)
-- SELECT id, 'observer', 'active'
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM public.subscriptions);


-- =============================================================
-- SECTION 8: STORAGE BUCKETS
-- Two buckets:
--   avatars        → profile photos (public read)
--   mission-images → the "source image" uploaded in onboarding (private)
-- =============================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('mission-images', 'mission-images', false),
  ('journal-images', 'journal-images', true)   -- public: image URLs work without auth
on conflict (id) do nothing;

-- avatars: any authenticated user can upload to their own folder (user_id/*)
create policy "avatars: upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- mission-images: private, only the owner can read/write
create policy "mission-images: upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'mission-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "mission-images: read own"
  on storage.objects for select
  using (
    bucket_id = 'mission-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "mission-images: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'mission-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- journal-images: public read, owner write
create policy "journal-images: upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'journal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "journal-images: public read"
  on storage.objects for select
  using (bucket_id = 'journal-images');

create policy "journal-images: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'journal-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- =============================================================
-- DONE
-- Tables:  profiles, missions, mandates, journal_entries,
--          conversations, ai_chats, activity_log, subscriptions,
--          future_self_images
-- Buckets: avatars, mission-images, journal-images, future-self-images
-- =============================================================
