# Supabase + Dodo Payments Integration for DecayState

**DecayState** gamified accountability app — goals, mandates, journal, decay image. All moving from `localStorage` to Supabase + Dodo Payments.

---

## Pricing Strategy

### Competitor Benchmarks
| App | Price | Notes |
|-----|-------|-------|
| Habitica | $4.99/mo | Gamified RPG habits |
| Finch | $9.99/mo | Self-care pet |
| Todoist | $4/mo | Task management |

**2 tiers at launch** — maximize conversion, add ELITE tier once usage data exists.

| Tier | Price | DB Value |
|------|-------|----------|
| **OBSERVER** | Free | `observer` |
| **OPERATOR** | $7/mo · $56/yr | `operator` |

### Feature Gating

| Feature | OBSERVER | OPERATOR |
|---------|----------|----------|
| Active goals | 1 | Unlimited |
| Daily mandates | Max 5 | Unlimited |
| Journal entries | Max 10 | Unlimited |
| AI mandate generation | 3/day | 20/day |
| AI chat messages | 10/day | Unlimited |
| Chat history (ai_chats) | ✓ persisted | ✓ persisted |
| Chat conversations | 3 total | Unlimited |
| Weekly image evolution | ✗ | ✓ |
| Decay recovery protocols | ✗ | ✓ |
| Activity log history | 24 hours | Forever |

> **AI chat is persisted for ALL users** — every message goes to `ai_chats` regardless of tier. The tier difference is daily message quota + number of conversations allowed.

---

## Database Schema

All timestamps are `timestamptz` (UTC-stored). Display in user's timezone at the app layer.

```sql
-- ─────────────────────────────────────────
-- CORE TABLES
-- ─────────────────────────────────────────

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  username    text unique,
  email       text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- A user's goals over time (can have multiple, one active)
create table public.missions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  goal        text not null,
  manifesto   text,
  timeframe   text not null default '30 Days',
  is_active   boolean not null default true,  -- only one active at a time
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Daily tasks, optionally tied to a mission
create table public.mandates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  mission_id   uuid references public.missions(id) on delete set null,  -- nullable FK
  label        text not null,
  category     text not null check (category in ('physical', 'intellectual', 'spiritual')),
  rationale    text,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Journal logs, optionally tied to a mission and/or specific mandate
create table public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  mission_id  uuid references public.missions(id) on delete set null,   -- nullable FK
  mandate_id  uuid references public.mandates(id) on delete set null,   -- nullable FK
  date        date not null default current_date,
  wins        text,
  failures    text,
  adjustments text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- AI CHAT TABLES
-- ─────────────────────────────────────────

-- Conversations: scoped chat threads per mission context
-- A conversation can be mission-specific or global (mission_id = null)
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  mission_id  uuid references public.missions(id) on delete set null,  -- nullable FK
  title       text not null default 'New Session',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Individual messages within a conversation
create table public.ai_chats (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender          text not null check (sender in ('user', 'ai')),
  text            text not null,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- SYSTEM TABLES
-- ─────────────────────────────────────────

create table public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('mandate', 'journal', 'mission', 'ai', 'system')),
  message    text not null,
  created_at timestamptz default now()
);

create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  dodo_customer_id     text,
  dodo_subscription_id text,
  tier                 text not null default 'observer' check (tier in ('observer', 'operator')),
  status               text not null default 'active'
                         check (status in ('active', 'cancelled', 'on_hold', 'failed', 'renewed')),
  current_period_end   timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ─────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.missions       enable row level security;
alter table public.mandates       enable row level security;
alter table public.journal_entries enable row level security;
alter table public.conversations  enable row level security;
alter table public.ai_chats       enable row level security;
alter table public.activity_log   enable row level security;
alter table public.subscriptions  enable row level security;

create policy "own data" on public.profiles      for all using (auth.uid() = id);
create policy "own data" on public.missions       for all using (auth.uid() = user_id);
create policy "own data" on public.mandates       for all using (auth.uid() = user_id);
create policy "own data" on public.journal_entries for all using (auth.uid() = user_id);
create policy "own data" on public.conversations  for all using (auth.uid() = user_id);
create policy "own data" on public.ai_chats       for all using (auth.uid() = user_id);
create policy "own data" on public.activity_log   for all using (auth.uid() = user_id);
create policy "own data" on public.subscriptions  for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- AUTO updated_at TRIGGER
-- ─────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- Attach to all tables with updated_at
create trigger trg_profiles      before update on public.profiles      for each row execute function update_updated_at();
create trigger trg_missions      before update on public.missions       for each row execute function update_updated_at();
create trigger trg_mandates      before update on public.mandates       for each row execute function update_updated_at();
create trigger trg_journal       before update on public.journal_entries for each row execute function update_updated_at();
create trigger trg_conversations before update on public.conversations  for each row execute function update_updated_at();
create trigger trg_subscriptions before update on public.subscriptions  for each row execute function update_updated_at();
```

### Entity Relationship Summary

```
profiles
  ├── missions (1:many) ← is_active flag marks current
  │     └── mandates (1:many, nullable mission_id)
  │     └── journal_entries (1:many, nullable mission_id + mandate_id)
  │     └── conversations (1:many, nullable mission_id)
  │           └── ai_chats (1:many)
  ├── subscriptions (1:1)
  └── activity_log (1:many)
```

### AI Chat Context Design

When the AI responds in any conversation, it receives full context:
- **All missions** (not just the current one) — so it can reason about past goals, patterns, and progression
- **Active mandates** tied to the scoped mission (or all if conversation is global)
- **Recent journal entries** (last 5)
- **Current integrity score**
- **Conversation's linked mission** (if any) — so it knows the planning context

This allows e.g. "compare my marathon mission vs my coding mission" or "looking at all my past goals, what's my pattern?"

---

## Packages

```
@supabase/supabase-js  @supabase/ssr  dodopayments  @dodopayments/nextjs
```

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Browser client |
| `src/lib/supabase-server.ts` | SSR cookie client |
| `src/context/AuthContext.tsx` | Session + auth methods |
| `src/app/api/auth/callback/route.ts` | Auth code exchange |
| `src/lib/db/mandates.ts` | CRUD + mission_id linking |
| `src/lib/db/journal.ts` | CRUD + mission_id + mandate_id linking |
| `src/lib/db/mission.ts` | getMissions, upsertMission, setActive |
| `src/lib/db/activity.ts` | logActivityDB |
| `src/lib/db/conversations.ts` | getConversations, createConversation |
| `src/lib/db/ai-chats.ts` | getChatHistory(conversationId), saveMessage |
| `src/lib/db/subscriptions.ts` | getSubscription, upsertSubscription |
| `src/lib/featureGate.ts` | Tier → limits config |
| `src/lib/dodo.ts` | Dodo Payments server SDK singleton |
| `src/app/api/dodo/create-checkout/route.ts` | Checkout session |
| `src/app/api/dodo/webhook/route.ts` | Subscription lifecycle |
| `src/app/api/dodo/portal/route.ts` | Customer portal |

---

## Modified Files

| File | Change |
|------|--------|
| [src/lib/auth.ts](file:///e:/projects/project-unnamed/Switch/src/lib/auth.ts) | **Deleted** |
| [src/lib/activityLog.ts](file:///e:/projects/project-unnamed/Switch/src/lib/activityLog.ts) | → `logActivityDB()` |
| [src/app/signup/page.tsx](file:///e:/projects/project-unnamed/Switch/src/app/signup/page.tsx) | Supabase signUp |
| [src/app/login/page.tsx](file:///e:/projects/project-unnamed/Switch/src/app/login/page.tsx) | Supabase signIn |
| [src/app/onboarding/page.tsx](file:///e:/projects/project-unnamed/Switch/src/app/onboarding/page.tsx) | Write to `profiles` + `missions` |
| [src/app/layout.tsx](file:///e:/projects/project-unnamed/Switch/src/app/layout.tsx) | `<AuthProvider>` |
| [src/components/dashboard/AIChat.tsx](file:///e:/projects/project-unnamed/Switch/src/components/dashboard/AIChat.tsx) | Load from `ai_chats` via `conversation_id`; create/switch conversations; pass all missions as context; persist all messages; rate-limit by tier |
| [src/components/dashboard/Mandates.tsx](file:///e:/projects/project-unnamed/Switch/src/components/dashboard/Mandates.tsx) | DB + `mission_id` link + Observer gate |
| [src/components/dashboard/Journal.tsx](file:///e:/projects/project-unnamed/Switch/src/components/dashboard/Journal.tsx) | DB + `mission_id` + `mandate_id` link + Observer gate |
| [src/components/dashboard/MissionSelector.tsx](file:///e:/projects/project-unnamed/Switch/src/components/dashboard/MissionSelector.tsx) | `upsertMission()` with `is_active` toggle |
| [src/app/dashboard/page.tsx](file:///e:/projects/project-unnamed/Switch/src/app/dashboard/page.tsx) | Session guard + DB load |
| [src/app/(landing-page)/components/Pricing.tsx](file:///e:/projects/project-unnamed/Switch/src/app/%28landing-page%29/components/Pricing.tsx) | 2-tier + annual toggle + Dodo |
| [src/app/pricing/page.tsx](file:///e:/projects/project-unnamed/Switch/src/app/pricing/page.tsx) | Same |
| [src/app/dashboard/accounts/page.tsx](file:///e:/projects/project-unnamed/Switch/src/app/dashboard/accounts/page.tsx) | Tier + period_end + Dodo portal |

---

## [.env.local](file:///e:/projects/project-unnamed/Switch/.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DODO_API_KEY=
DODO_WEBHOOK_SECRET=
NEXT_PUBLIC_DODO_OPERATOR_PRODUCT_ID=
NEXT_PUBLIC_DODO_OPERATOR_ANNUAL_PRODUCT_ID=
```

---

## Verification Plan

| # | Action | Expected |
|---|--------|----------|
| 1 | Sign up | Profile row created |
| 2 | Complete onboarding | Mission row + `is_active=true` |
| 3 | Add mandate → link to mission | `mission_id` populated |
| 4 | Add journal entry → link to mandate | Both FKs populated |
| 5 | Open AI chat | New conversation created, scoped to active mission |
| 6 | Switch to "Global" conversation | AI receives all missions as context |
| 7 | Send 10 messages (Observer) | All persisted to `ai_chats` |
| 8 | Send 11th message (Observer) | Quota warning shown |
| 9 | Refresh page | Chat history loaded from DB for all users |
| 10 | Upgrade to Operator | Dodo Checkout → webhook → `operator` tier |
| 11 | Create 4th conversation (Observer) | Locked, upgrade CTA |
| 12 | Sign out → different browser → in | All missions, chats, mandates present |
| 13 | Query `conversations` table | Rows show `mission_id` FK correctly linked |
| 14 | Query `mandates` | Rows show `mission_id` FK set |

> [!IMPORTANT]
> **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings → API**.
>
> **Dodo Payments:** `DODO_API_KEY` + `DODO_WEBHOOK_SECRET` from Dodo dashboard. Create monthly ($7) and annual ($56) OPERATOR products, paste the product IDs. Use test environment first.
