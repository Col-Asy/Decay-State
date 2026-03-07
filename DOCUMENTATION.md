# DecayState — Project Documentation

> **"Manifest your future or watch it fade."**
>
> Last updated: March 2026

---

## Table of Contents

| # | Section | Purpose |
|---|---------|---------|
| [1](#1-product-overview) | Product Overview | What DecayState is, the problem it solves, and its core philosophy |
| [2](#2-users--user-journey) | Users & User Journey | Target users, use cases, and the full flow from signup to daily usage |
| [3](#3-system-architecture) | System Architecture | High-level architecture, system components, and request flow |
| [4](#4-technology-stack) | Technology Stack | Frameworks, libraries, AI tools, and infrastructure |
| [5](#5-core-features) | Core Features | Missions, Mandates, Journal, AI Neural Link, and Subscriptions |
| [6](#6-ai-system-deep-dive) | AI System Deep Dive | LangGraph agent, tools, prompts, and the streaming pipeline |
| [7](#7-database-schema) | Database Schema | Entities, relationships, RLS policies, and triggers |
| [8](#8-api-reference) | API Reference | All backend API routes and their contracts |
| [9](#9-frontend-architecture) | Frontend Architecture | Pages, components, routing, state management, and theming |
| [10](#10-authentication--security) | Authentication & Security | Auth flow, session management, middleware, and RLS |
| [11](#11-payments--subscriptions) | Payments & Subscriptions | Dodo Payments integration, webhooks, and feature gating |
| [12](#12-getting-started) | Getting Started | Environment setup, configuration, and running locally |
| [13](#13-development-workflow) | Development Workflow | Project structure, conventions, and contribution guidelines |
| [14](#14-known-limitations--future-roadmap) | Known Limitations & Future Roadmap | Current constraints and planned improvements |

---

## 1. Product Overview

### 1.1 What is DecayState?

DecayState is a **gamified personal accountability web application** that uses an AI mentor (the "Switch Protocol") to help users define goals, execute daily tasks ("mandates"), and track their progress through a journal system — all wrapped in a cyberpunk/military HUD-inspired interface.

The central metaphor is "decay": if you don't act on your goals, your **Integrity Score** drops and your future self "decays." The visual feedback loop — showing a decay probability in real-time — creates urgency and gamification around daily accountability.

### 1.2 Problem Statement

Most productivity tools are either:
- **Too passive** — plain to-do lists with no consequence for inaction
- **Too generic** — no personalization, no AI-driven insights
- **Not sticky** — no gamification, no emotional engagement

DecayState addresses this by:
1. **Visualizing consequences** — Your integrity score drops when mandates go incomplete
2. **AI-powered accountability** — An intelligent mentor that can create tasks, break down goals, and give brutally honest feedback
3. **Structured reflection** — A journal system that tracks wins, failures, and adjustments over time
4. **Gamified theming** — A cyberpunk HUD aesthetic that makes productivity feel like a mission

### 1.3 Core Philosophy

| Principle | Description |
|-----------|-------------|
| **Accountability over comfort** | The AI doesn't sugarcoat. It gives honest feedback based on your actual data |
| **Action over planning** | The mandate system forces daily execution, not just goal-setting |
| **AI as a tool, not a crutch** | The AI can create tasks, break down goals, and modify data — but only when the user explicitly requests it |
| **Privacy-first** | All data is scoped to the user via Supabase RLS. No cross-user data access |
| **Progressive feature access** | Free tier (Observer) gets core features; paid tier (Operator) unlocks unlimited usage |

---

## 2. Users & User Journey

### 2.1 Target Users

| User Type | Description |
|-----------|-------------|
| **Students** | Preparing for competitive exams (JEE, NEET), board exams, or college courses. Need structured daily plans |
| **Self-improvers** | People working on fitness, habits, or personal development goals |
| **Indie hackers / Builders** | Developers and creators building side projects who need accountability |
| **Professionals** | Anyone with a specific, time-bound goal who wants an AI-powered accountability partner |

### 2.2 Use Cases

- Set a major goal (e.g., "Launch SaaS MVP in 90 days") and get AI-generated daily mandates
- Track task completion across 3 categories: **Physical**, **Intellectual**, **Spiritual**
- Journal daily wins, failures, and adjustments with optional image attachments
- Chat with the AI to get study plans, task breakdowns, progress analysis, or honest feedback
- Upgrade to Operator tier for unlimited mandates, journal entries, and AI interactions

### 2.3 User Journey

```
1. SIGNUP (/signup)
   ├─ Enter name, username, email, password
   └─ Supabase creates auth.users → triggers profile row creation

2. ONBOARDING (/onboarding)
   ├─ Step 1: Upload a photo of yourself (optional)
   └─ Step 2: Define your goal, manifesto, and timeframe
       └─ Creates a Mission in the DB with is_active=true

3. COMMAND CENTER (/dashboard)
   ├─ View Integrity Score (mandate completion %)
   ├─ View Decay Probability (100 - integrity)
   ├─ See pending mandate count + journal entry count
   ├─ Live Activity Log (real-time event feed)
   └─ Sector Analysis (per-category breakdown)

4. DAILY LOOP
   ├─ /dashboard/mandates → Add, verify (complete), or delete mandates
   ├─ /dashboard/journal → Log wins, failures, adjustments with images
   ├─ /dashboard/chat → Talk to Neural Link AI for help, plans, or task management
   └─ All actions logged to Activity Log (visible in Command Center)

5. UPGRADE (/pricing)
   └─ Checkout via Dodo Payments → webhook updates subscription tier
```

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│  Next.js 16 App Router · React 19 · TailwindCSS v4 · Framer    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Landing   │  │  Auth    │  │Dashboard │  │  AI Chat     │    │
│  │  Page     │  │ Pages   │  │  Pages   │  │  (Streaming) │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└───────────────────────┬──────────────────────────────────────────┘
                        │  HTTP / SSE
┌───────────────────────▼──────────────────────────────────────────┐
│                     NEXT.JS API ROUTES                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ /api/auth/* │  │ /api/chat   │  │ /api/dodo/*             │  │
│  │ (callback)  │  │ (LangGraph  │  │ (checkout, webhook,     │  │
│  │             │  │  Agent SSE) │  │  portal)                │  │
│  └─────────────┘  └─────────────┘  └──────────────────────────┘  │
└───────────────────────┬──────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Supabase   │ │  Groq API   │ │    Dodo     │
│  (Auth, DB, │ │  (Llama 3.3 │ │  Payments   │
│   Storage,  │ │   70B)      │ │  (Checkout, │
│   RLS)      │ │             │ │   Webhook)  │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 3.2 System Components

| Component | Responsibility |
|-----------|----------------|
| **Next.js App Router** | Page routing, SSR, API routes, middleware |
| **AuthContext** | Client-side session management, signUp/signIn/signOut methods |
| **Middleware (proxy.ts)** | JWT validation via `getClaims()`, session refresh, route protection |
| **DB Layer (`lib/db/*`)** | 7 CRUD modules — one per entity — querying Supabase |
| **LangGraph Agent** | AI agent with 10 tools that can read and modify user data |
| **Feature Gate** | Tier-based limits (Observer vs Operator) for mandates, journal, AI, etc. |
| **Dodo Integration** | Checkout session creation, webhook handling, customer portal |
| **Activity Log** | Dual-write system: Supabase DB + localStorage for live terminal view |

### 3.3 Request Processing Flow

**Example: User sends a chat message**

```
1. User types message in AIChat component
2. Component POSTs to /api/chat with { message, history, integrity, userId }
3. API route creates a server-side Supabase client (from request cookies)
4. Creates LangGraph agent with 10 tools scoped to userId
5. Converts chat history to LangChain message format
6. Streams agent response via SSE (Server-Sent Events)
   ├─ on_chat_model_stream → Text tokens streamed to client
   ├─ on_tool_end → Tool results streamed to client
   └─ Agent loops: agent → tools → agent → ... → END
7. Client renders text tokens in real-time via ReactMarkdown
8. Mutating tool actions (create_mandate, etc.) trigger UI refresh
   └─ window.dispatchEvent("neural-link-data-change")
```

---

## 4. Technology Stack

### 4.1 Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.1.4 | App Router, SSR, API routes |
| **UI Library** | React | 19.2.3 | Component rendering |
| **Language** | TypeScript | 5.x | Static typing |
| **Styling** | TailwindCSS | 4.x | Utility-first CSS |
| **Auth + DB** | Supabase | SSR 0.8 + JS 2.97 | Auth, PostgreSQL, Storage, RLS |
| **AI / LLM** | Groq + LangChain | — | Llama 3.3 70B via Groq API |
| **AI Orchestration** | LangGraph | 1.1.5 | Agent state machine with tool calling |
| **Payments** | Dodo Payments | 2.20.0 | Subscription checkout + webhooks |
| **Animation** | Framer Motion | 12.33.0 | Page transitions, micro-animations |
| **Markdown** | react-markdown | 10.1.0 | Render AI chat responses |
| **Icons** | Lucide React | 0.563 | UI iconography |
| **Fonts** | Google Fonts | — | Inter, Space Grotesk, Roboto Mono |
| **Schema Validation** | Zod | 4.3.6 | Tool input validation in LangGraph |

### 4.2 Infrastructure

| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL database, authentication, file storage, Row Level Security |
| **Groq** | Ultra-fast LLM inference (Llama 3.3 70B Instant/Versatile) |
| **Dodo Payments** | Payment processing (checkout sessions, subscription webhooks, customer portal) |
| **Vercel** (recommended) | Hosting, edge functions, static asset CDN |

---

## 5. Core Features

### 5.1 Missions (Goals)

The foundational entity. A user's overarching objective.

| Field | Purpose |
|-------|---------|
| `goal` | What the user wants to achieve |
| `manifesto` | Detailed plan/strategy |
| `timeframe` | Duration (e.g., "30 Days", "6 Months") |
| `is_active` | Only one active at a time |
| `image_url` | Optional uploaded image (via Supabase Storage) |

**Key behaviors:**
- Created during onboarding or via MissionSelector modal
- `upsertActiveMission()` — if an active mission exists, updates it; otherwise creates a new one and deactivates others
- AI agent can also update the mission via the `update_mission` tool

### 5.2 Mandates (Tasks/Directives)

Daily actionable tasks, optionally linked to a mission.

| Field | Purpose |
|-------|---------|
| `label` | Short task description |
| `category` | `physical`, `intellectual`, or `spiritual` |
| `rationale` | Why this task matters (often AI-generated) |
| `completed` | Boolean completion status |
| `mission_id` | FK to the active mission (nullable) |

**Key behaviors:**
- Categorized into 3 "layers": Physical, Intellectual (Neural), Spiritual (Abstract)
- Completion rate = **Integrity Score** (displayed as a percentage)
- Observer tier limit: 5 mandates max
- AI can create, complete, delete, or edit mandates via tools
- "Verify Compliance" button has a 1.5s scanning animation before marking complete

### 5.3 Journal (Protocol Log)

Daily reflection entries.

| Field | Purpose |
|-------|---------|
| `wins` | What went well |
| `failures` | What went wrong |
| `adjustments` | What to change |
| `mission_id` | Optional link to a mission |
| `mandate_id` | Optional link to a specific mandate |
| `image_url` | Optional image attachment |

**Key behaviors:**
- Split-view UI: Entry form (left) + Timeline archive (right)
- Image upload via Supabase Storage (`journal-images` bucket)
- Observer tier limit: 10 entries max
- AI can create journal entries via the `create_journal_entry` tool

### 5.4 Neural Link (AI Chat)

An AI agent powered by LangGraph that can reason, call tools, and modify user data.

**Architecture:**
- **Agent Node** → calls Groq LLM (Llama 3.3 70B) with tool bindings
- **Tool Node** → executes tools against Supabase
- **Conditional Edge** → routes to tools if LLM returns tool_calls, or ends
- **Streaming** → Real-time SSE text + tool results to the client
- **Fallback** → If Groq returns 400 (malformed tool call), retries without tools

**10 Available Tools:**

| Tool | Type | Purpose |
|------|------|---------|
| `get_user_context` | Read | Fetches mission, mandates, journal, and integrity |
| `get_upcoming_tasks` | Read | Lists mandates with optional filter |
| `break_down_task` | Read | Breaks a complex goal into sub-tasks (suggestions only) |
| `search_journal` | Read | Searches journal entries by keyword |
| `create_mandate` | Write | Creates a single mandate |
| `toggle_mandate` | Write | Marks a mandate as completed/uncompleted |
| `delete_mandate` | Write | Permanently deletes a mandate |
| `edit_mandate` | Write | Updates a mandate's label |
| `update_mission` | Write | Creates or updates the active mission |
| `create_journal_entry` | Write | Creates a journal entry |

### 5.5 Activity Log (Live System Terminal)

A real-time event feed displayed in the Command Center.

- **Dual-write**: Events go to Supabase DB + localStorage (for zero-latency local display)
- **Tier-gated history**: Observer = 24 hours, Operator = 1 year
- **Event types**: `mandate`, `journal`, `mission`, `ai`, `system`
- **Polling**: localStorage checked every 2s for new events

---

## 6. AI System Deep Dive

### 6.1 Agent Architecture

```
                    ┌─────────────┐
         ┌─────────│  __start__   │
         │         └─────────────┘
         ▼
    ┌──────────┐    tool_calls?     ┌──────────┐
    │  Agent   │───── YES ─────────▶│  Tools   │
    │  (LLM)  │                     │  (10x)   │
    │          │◀────────────────────│          │
    └──────────┘                     └──────────┘
         │
       NO tool_calls
         │
         ▼
    ┌──────────┐
    │   END    │
    └──────────┘
```

- **LLM**: `ChatGroq` with `llama-3.3-70b-instant` (or `versatile`)
- **Temperature**: 0.7
- **Max Tokens**: 2,048
- **Recursion Limit**: 10 (prevents infinite tool loops)
- **Error Handling**: If Groq 400 error, retries with a plain (no tools) model

### 6.2 System Prompt Persona

The AI is called the **"Switch Protocol"** and acts as:
- An elite AI mentor — strict, brilliant, but genuinely warm
- A polymath (academics, programming, fitness, psychology, philosophy)
- An "honest older brother" figure — direct feedback, no corporate language
- Adapts tone based on integrity score:
  - < 30%: Direct confrontation
  - \> 80%: Genuine respect + momentum maintenance

### 6.3 Streaming Pipeline

```
Client (AIChat.tsx)                    Server (/api/chat/route.ts)
     │                                        │
     │── POST { message, history } ──────────▶│
     │                                        │── Create LangGraph Agent
     │                                        │── Stream events via SSE
     │◀── data: {type:"text", content:"..."} ─│   (on_chat_model_stream)
     │◀── data: {type:"text", content:"..."} ─│
     │◀── data: {type:"tool_result", ...} ────│   (on_tool_end)
     │◀── data: {type:"text", content:"..."} ─│
     │◀── data: {type:"done"} ────────────────│
     │                                        │
     │── dispatch("neural-link-data-change") ─│  (if mutating tools used)
```

### 6.4 Action Extraction (Legacy)

There is also a separate `/api/chat/actions` route that extracts structured actions from AI responses using a secondary Groq completion call. This was part of an older "Action Card" system and may still be used for specific flows.

---

## 7. Database Schema

### 7.1 Entity Relationship Diagram

```
auth.users (Supabase Auth)
    │
    ▼
profiles (1:1)
    ├── missions (1:many)  ← is_active flag marks current
    │     ├── mandates (1:many, nullable mission_id)
    │     ├── journal_entries (1:many, nullable mission_id + mandate_id)
    │     └── conversations (1:many, nullable mission_id)
    │           └── ai_chats (1:many)
    ├── subscriptions (1:1)
    └── activity_log (1:many)
```

### 7.2 Tables

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | References `auth.users(id)` |
| `name` | TEXT | User's display name |
| `username` | TEXT (UNIQUE) | Operative handle |
| `email` | TEXT | Email address |
| `avatar_url` | TEXT | Profile image URL |
| `created_at` | TIMESTAMPTZ | Auto-set |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

#### `missions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | References `profiles(id)` |
| `goal` | TEXT | Primary objective |
| `manifesto` | TEXT | Detailed plan |
| `timeframe` | TEXT | Duration (default: "30 Days") |
| `is_active` | BOOLEAN | Only one active per user |
| `created_at` / `updated_at` | TIMESTAMPTZ | Auto-managed |

#### `mandates`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | References `profiles(id)` |
| `mission_id` | UUID (FK, nullable) | References `missions(id)` |
| `label` | TEXT | Task description |
| `category` | TEXT | CHECK: `physical`, `intellectual`, `spiritual` |
| `rationale` | TEXT | Why this task matters |
| `completed` | BOOLEAN | Default: false |
| `completed_at` | TIMESTAMPTZ | Set when completed |

#### `journal_entries`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | References `profiles(id)` |
| `mission_id` | UUID (FK, nullable) | Optional link to mission |
| `mandate_id` | UUID (FK, nullable) | Optional link to mandate |
| `date` | DATE | Default: current_date |
| `wins` / `failures` / `adjustments` | TEXT | Reflection content |

#### `conversations`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | References `profiles(id)` |
| `mission_id` | UUID (FK, nullable) | Optional mission scope |
| `title` | TEXT | Default: "New Session" |

#### `ai_chats`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | References `profiles(id)` |
| `conversation_id` | UUID (FK) | References `conversations(id)` |
| `sender` | TEXT | CHECK: `user`, `ai` |
| `text` | TEXT | Message content |

#### `activity_log`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | References `profiles(id)` |
| `type` | TEXT | CHECK: `mandate`, `journal`, `mission`, `ai`, `system` |
| `message` | TEXT | Event description |

#### `subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | References `profiles(id)` |
| `dodo_customer_id` | TEXT | Dodo Payments customer ID |
| `dodo_subscription_id` | TEXT | Dodo subscription ID |
| `tier` | TEXT | CHECK: `observer`, `operator` |
| `status` | TEXT | CHECK: `active`, `cancelled`, `on_hold`, `failed`, `renewed` |
| `current_period_end` | TIMESTAMPTZ | When the billing period ends |

### 7.3 Row Level Security (RLS)

All tables have RLS enabled. The policy is simple: **users can only access their own data**.

```sql
create policy "own data" on public.<table> for all using (auth.uid() = user_id);
-- Exception: subscriptions is SELECT-only for users
create policy "own data" on public.subscriptions for select using (auth.uid() = user_id);
```

### 7.4 Auto-Updated Timestamps

A PostgreSQL trigger function `update_updated_at()` is attached to all tables with an `updated_at` column. It fires `BEFORE UPDATE` on every row.

---

## 8. API Reference

### 8.1 Authentication

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/callback` | GET | Exchanges auth code for session (Supabase OAuth flow) |

**Query params:** `code` (auth code), `next` (redirect URL, default: `/dashboard`)

### 8.2 AI Chat

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Main AI agent endpoint — streams response via SSE |
| `/api/chat/actions` | POST | Extracts structured actions from AI response (legacy) |

**`/api/chat` Request:**
```json
{
  "message": "string",
  "history": [{ "id": "string", "sender": "user|ai", "text": "string", "timestamp": 0 }],
  "integrity": 85,
  "userId": "uuid"
}
```

**`/api/chat` Response:** Server-Sent Events stream
```
data: {"type":"text","content":"Here's my recommendation..."}
data: {"type":"tool_result","tool":"create_mandate","result":{"success":true,"message":"Mandate created: \"Run 5K\""}}
data: {"type":"done"}
```

### 8.3 Payments (Dodo)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dodo/create-checkout` | POST | Creates a Dodo checkout session |
| `/api/dodo/webhook` | POST | Handles subscription lifecycle events |
| `/api/dodo/portal` | POST | Creates a customer portal link |

**Webhook events handled:**
- `subscription.active` / `subscription.renewed` → Set tier to `operator`, status `active`
- `subscription.on_hold` → Update status to `on_hold`
- `subscription.failed` → Update status to `failed`
- `subscription.cancelled` → Revert to `observer` tier

---

## 9. Frontend Architecture

### 9.1 Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `(landing-page)/page.tsx` | Marketing landing page with Hero, DecayDemo, AIPrompt, Manifesto, Methodology, Pricing, FAQ |
| `/login` | `login/page.tsx` | Email/password login via Supabase |
| `/signup` | `signup/page.tsx` | Registration with name, username, email, password |
| `/onboarding` | `onboarding/page.tsx` | 2-step: image upload → goal/manifesto/timeframe |
| `/dashboard` | `dashboard/page.tsx` | Command Center — HUD overview with integrity, KPIs, activity log |
| `/dashboard/mandates` | `dashboard/mandates/page.tsx` | Full mandate management UI |
| `/dashboard/journal` | `dashboard/journal/page.tsx` | Journal entry form + archive timeline |
| `/dashboard/chat` | `dashboard/chat/page.tsx` | Full-page Neural Link AI chat |
| `/dashboard/accounts` | `dashboard/accounts/page.tsx` | Subscription tier, billing, Dodo portal |
| `/pricing` | `pricing/page.tsx` | Standalone pricing page |

### 9.2 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `AIChat` | `dashboard/AIChat.tsx` | Chat interface with streaming, markdown rendering, tool action cards |
| `Mandates` | `dashboard/Mandates.tsx` | Task list with categories, verification animation, tier limits |
| `Journal` | `dashboard/Journal.tsx` | Split-view entry form + timeline, image upload, mission/mandate linking |
| `MissionSelector` | `dashboard/MissionSelector.tsx` | Modal to set/update goal, manifesto, timeframe |
| `Sidebar` | `dashboard/Sidebar.tsx` | Fixed left navigation with module links and tier badge |
| `LiveSystemLog` | `dashboard/LiveSystemLog.tsx` | Real-time activity feed with color-coded event types |
| `OpsSummary` | `dashboard/OpsSummary.tsx` | Per-category compliance breakdown with progress bars |
| `FutureSelfImage` | `dashboard/FutureSelfImage.tsx` | Displays user avatar with integrity-based visual effects |
| `GlobalSearch` | `GlobalSearch.tsx` | Floating search bar on landing page (Ctrl+K shortcut) |

### 9.3 Layout & Routing

```
RootLayout (layout.tsx)
├── <AuthProvider>           ← Wraps entire app with session context
├── <GlobalSearch>           ← Floating landing page search bar
│
├── (landing-page)/          ← Landing page (no sidebar)
│
├── login/                   ← Auth pages (standalone layout)
├── signup/
├── onboarding/
│
└── dashboard/
    └── DashboardLayout      ← Sidebar + main content area
        ├── /                ← Command Center
        ├── /mandates        ← Mandates page
        ├── /journal         ← Journal page
        ├── /chat            ← AI Chat page
        └── /accounts        ← Account/subscription page
```

### 9.4 Design System & Theming

| Element | Value |
|---------|-------|
| **Theme** | Dark mode only (`bg-black`, `text-white`) |
| **Accent Color** | Neon green/yellow (CSS variable `--accent`, likely `#d4ff00`) |
| **Fonts** | `Inter` (body), `Space Grotesk` (display/headings), `Roboto Mono` (monospace/terminal) |
| **UI Style** | Cyberpunk / Military HUD — scanlines, grid overlays, glowing borders, uppercase tracking |
| **Animation** | Framer Motion for page transitions, AnimatePresence for mount/unmount, CSS pulse for live indicators |
| **Scrollbars** | Custom styled (`custom-scrollbar` class) |

### 9.5 State Management

- **Server state**: Fetched from Supabase on component mount via `useEffect`
- **Session state**: `AuthContext` (React Context) — session, user, loading, auth methods
- **Local state**: `useState` for UI state, `sessionStorage` for chat messages and tool actions
- **Cross-component communication**: `CustomEvent("neural-link-data-change")` dispatched when AI modifies data, listened by Mandates/Journal components

---

## 10. Authentication & Security

### 10.1 Auth Flow

```
SIGNUP → supabase.auth.signUp({ email, password, options: { data: { name, username } } })
         └─ Profile row auto-created by Supabase trigger
         └─ Redirects to /onboarding

LOGIN  → AuthContext.signIn(email, password)
         └─ supabase.auth.signInWithPassword()
         └─ Session stored in cookies
         └─ Redirects to /dashboard

OAUTH  → /api/auth/callback?code=xxx
         └─ supabase.auth.exchangeCodeForSession(code)
         └─ Redirects to /dashboard
```

### 10.2 Middleware (Session Proxy)

`middleware.ts` runs on every request (except static assets) and calls `updateSession()` from `lib/supabase/proxy.ts`:

1. Creates a server-side Supabase client
2. Calls `getClaims()` — validates the JWT signature (more secure than `getSession()`)
3. If user is not authenticated and route is **not** public → redirect to `/login`
4. Public routes: `/`, `/login`, `/signup`, `/auth/*`, `/api/*`, `/pricing`

### 10.3 Supabase Client Types

| Client | File | Use Case |
|--------|------|----------|
| **Browser Client** | `lib/supabase/client.ts` | Client Components (DB reads, real-time) |
| **Server Client** | `lib/supabase/server.ts` | Server Components, Route Handlers, Server Actions |
| **Service Role Client** | `lib/supabase/server.ts` | Webhooks, admin tasks — bypasses RLS |
| **Proxy Client** | `lib/supabase/proxy.ts` | Middleware — JWT validation + token refresh |

### 10.4 Security Measures

- **JWT validation** via `getClaims()` in middleware (not the spoofable `getSession()`)
- **RLS on every table** — users can only see/modify their own data
- **Service Role key** only used server-side in webhook handler
- **Environment separation** — `NEXT_PUBLIC_*` for client-safe vars, server-only keys for secrets
- **Password validation** — minimum 8 characters enforced on signup

---

## 11. Payments & Subscriptions

### 11.1 Pricing Tiers

| Tier | Price | DB Value |
|------|-------|----------|
| **OBSERVER** | Free | `observer` |
| **OPERATOR** | $7/month or $56/year | `operator` |

### 11.2 Feature Gating

Defined in `lib/featureGate.ts`:

| Feature | Observer (Free) | Operator ($7/mo) |
|---------|:-:|:-:|
| Active goals | 1 | Unlimited |
| Daily mandates | Max 5 | Unlimited |
| Journal entries | Max 10 | Unlimited |
| AI mandate generation | 3/day | 20/day |
| AI chat messages | 10/day | Unlimited |
| Chat conversations | 3 total | Unlimited |
| Weekly image evolution | ✗ | ✓ |
| Decay recovery protocols | ✗ | ✓ |
| Activity log history | 24 hours | 1 year |

### 11.3 Checkout Flow

```
1. User clicks "Upgrade" on /pricing or /dashboard/accounts
2. Frontend POSTs to /api/dodo/create-checkout { annual: true/false }
3. Server creates a Dodo checkout session with:
   - Product ID (monthly or annual)
   - metadata: { user_id }
   - return_url: /dashboard/accounts?checkout=success
4. Server returns { checkout_url }
5. Frontend redirects to Dodo checkout page
6. After payment, Dodo sends webhook to /api/dodo/webhook
7. Webhook upserts subscription row (tier: "operator", status: "active")
```

### 11.4 Dodo SDK Configuration

```typescript
// lib/dodo.ts
const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  environment: process.env.DODO_ENV === "live" ? "live_mode" : "test_mode",
});
```

---

## 12. Getting Started

### 12.1 Prerequisites

- **Node.js** 18+ 
- **npm** or equivalent package manager
- **Supabase** project (free tier works)
- **Groq** API key ([console.groq.com](https://console.groq.com))
- **Dodo Payments** account (optional, for payments)

### 12.2 Environment Setup

Copy `.env.example` to `.env.local` and fill in all values:

```env
# AI / LLM
GROQ_API_KEY=gsk_...
GROQ_MODEL_ID=llama-3.3-70b-instant

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Server-only

# Dodo Payments (optional)
DODO_API_KEY=...
DODO_WEBHOOK_SECRET=...
NEXT_PUBLIC_DODO_OPERATOR_PRODUCT_ID=...
NEXT_PUBLIC_DODO_OPERATOR_ANNUAL_PRODUCT_ID=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 12.3 Database Setup

Run the SQL schema from `planning.md` in your Supabase SQL Editor. This creates:
- All 8 tables (`profiles`, `missions`, `mandates`, `journal_entries`, `conversations`, `ai_chats`, `activity_log`, `subscriptions`)
- RLS policies for all tables
- `update_updated_at()` trigger function + triggers on all tables with `updated_at`

### 12.4 Supabase Storage Buckets

Create these buckets manually in Supabase Storage:
1. `avatars` (public)
2. `mission-images` (private)
3. `journal-images` (public)

### 12.5 Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 13. Development Workflow

### 13.1 Project Structure

```
Switch/
├── .env.example              # Environment variable template
├── .env.local                 # Local environment variables (gitignored)
├── middleware.ts               # Supabase session refresh middleware
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies and scripts
├── planning.md                 # Database schema + integration plan
├── src/
│   ├── app/
│   │   ├── (landing-page)/     # Marketing pages
│   │   │   ├── page.tsx
│   │   │   └── components/     # Hero, DecayDemo, AIPrompt, etc.
│   │   ├── api/
│   │   │   ├── auth/callback/  # OAuth callback
│   │   │   ├── chat/           # AI chat + action extraction
│   │   │   └── dodo/           # Payments (checkout, webhook, portal)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx      # Dashboard layout with Sidebar
│   │   │   ├── page.tsx        # Command Center
│   │   │   ├── accounts/       # Subscription management
│   │   │   ├── chat/           # Neural Link AI page
│   │   │   ├── journal/        # Journal page
│   │   │   └── mandates/       # Mandates page
│   │   ├── login/              # Login page
│   │   ├── signup/             # Registration page
│   │   ├── onboarding/         # Post-signup onboarding
│   │   ├── pricing/            # Pricing page
│   │   ├── layout.tsx          # Root layout (AuthProvider, GlobalSearch)
│   │   └── globals.css         # Global styles + TailwindCSS
│   ├── components/
│   │   ├── dashboard/          # Dashboard components (9 files)
│   │   ├── ui/                 # Reusable UI primitives (Button, Input)
│   │   └── GlobalSearch.tsx    # Floating search bar
│   ├── context/
│   │   └── AuthContext.tsx     # Auth session provider
│   ├── lib/
│   │   ├── agent/              # LangGraph AI agent
│   │   │   ├── agent.ts        # Agent creation + history conversion
│   │   │   ├── prompts.ts      # System prompt builder
│   │   │   └── tools.ts        # 10 agent tools
│   │   ├── db/                 # Database CRUD modules (7 files)
│   │   ├── supabase/           # Supabase client factories
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server + Service Role clients
│   │   │   └── proxy.ts        # Middleware session handler
│   │   ├── activityLog.ts      # Activity event system
│   │   ├── auth.ts             # Legacy localStorage auth (deprecated)
│   │   ├── dodo.ts             # Dodo Payments SDK singleton
│   │   ├── featureGate.ts      # Tier-based feature limits
│   │   ├── storage.ts          # Supabase Storage upload/delete
│   │   └── utils.ts            # Utility functions
│   └── types.ts                # Core TypeScript interfaces
└── supabase/                   # Supabase config directory
```

### 13.2 Key Conventions

| Convention | Detail |
|------------|--------|
| **File naming** | kebab-case for DB modules (`ai-chats.ts`), PascalCase for components (`AIChat.tsx`) |
| **Imports** | `@/` alias resolves to `src/` |
| **CSS** | TailwindCSS utility classes; custom CSS variables for accent colors |
| **State** | No global state library — React Context for auth, component-local for everything else |
| **DB access** | Always go through `lib/db/*` modules — never query Supabase directly in components |
| **Client vs Server** | `"use client"` directive at top of interactive components; API routes are server-only |
| **Error handling** | DB modules throw errors; components catch and console.error; API routes return JSON errors |

### 13.3 Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `npm run dev` | Start development server |
| `build` | `npm run build` | Production build |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |

---

## 14. Known Limitations & Future Roadmap

### 14.1 Known Limitations

| Limitation | Detail |
|------------|--------|
| **No conversation persistence** | The AIChat component currently stores messages in `sessionStorage`, not in the `ai_chats` DB table. The DB modules exist but are not wired up to the component. |
| **No real-time sync** | If the same user has two browser tabs open, changes in one tab don't automatically reflect in the other (no Supabase Realtime subscriptions used). |
| **Legacy auth code** | `lib/auth.ts` contains dummy localStorage-based auth from an earlier version. It's deprecated but still exists in the codebase. |
| **No mobile responsiveness** | The dashboard is optimized for desktop (≥1280px). The sidebar is fixed at 256px with no hamburger menu. |
| **Observer mandate limit is enforced client-side** | The AI agent enforces a hard limit of 5 mandates, but the client-side limit comes from `featureGate.ts`. A malicious user could bypass client-side checks. |
| **Chat history not loaded from DB** | `getChatHistory()` exists in `lib/db/ai-chats.ts` but the `AIChat` component loads from `sessionStorage` only. |
| **No email verification enforcement** | Supabase signUp works but there's no gate on unverified emails. |

### 14.2 Future Roadmap

| Feature | Description |
|---------|-------------|
| **Persist chat to DB** | Wire up `saveChatMessage()` and `getChatHistory()` in the AIChat component |
| **Conversation threads** | Allow multiple AI conversation threads, scoped to missions |
| **Weekly image evolution** | AI-generated images showing the user's "future self" evolving based on integrity |
| **Decay recovery protocols** | Special recovery missions when integrity drops below 30% |
| **Mobile responsive UI** | Collapsible sidebar, touch-friendly interactions |
| **Real-time sync** | Supabase Realtime subscriptions for multi-tab/multi-device |
| **ELITE tier** | Third pricing tier with advanced analytics and priority AI |
| **Social features** | Public profiles, accountability partners, leaderboards |
| **Onboarding AI analysis** | AI analyzes the user's goal and automatically generates initial mandates |
| **Server-side rate limiting** | Enforce AI message quotas server-side to prevent bypassing |

---

> **End of Documentation**
>
> *This document covers the complete DecayState codebase as of March 2026. For the database schema SQL, refer to [planning.md](planning.md).*
