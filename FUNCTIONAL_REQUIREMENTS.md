# SRM Institute of Science and Technology  
## College of Engineering and Technology  
### School of Computing  
SRM Nagar, Kattankulathur – 603203, Chengalpattu District, Tamil Nadu  
**Academic Year: 2024-25 (Even)**

---

| | |
|---|---|
| **Test:** CLAT-2 (Online Assessment) | **Date:** 21-04-2025 to 24-04-2025 (2 days) |
| **Course Code & Title:** 21CSS301T – FULL STACK DEVELOPMENT | **Duration:** 3 days |
| **Year & Sem:** III Year / VI Sem | **Max. Marks:** 50 |

---

### Course Articulation Matrix:

|  | PO |  |  |  |  |  |  |  |  |  |  |  | PSO |  |  |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 1 | 2 | 3 |
| CO1 | - | - | - | - | - | - | - | - | - | - | - | - | 1 | - | - |
| CO2 | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 1 |
| CO3 | - | - | - | - | - | - | - | - | - | - | - | - | 2 | - | - |
| CO4 | - | - | - | - | - | - | - | - | - | - | - | - | - | 1 | - |
| CO5 | - | - | - | - | - | - | - | - | - | - | - | - | - | - | 2 |

---

## 1. Group Task Name: DecayState — AI-Powered Personal Accountability System

---

## 2. Technologies and Software Used:

- **Frontend:** React.js (via Next.js 16 App Router) with TypeScript
- **Backend:** Next.js API Routes (serverless functions) + Supabase (PostgreSQL with Row-Level Security)
- **AI / LLM:** Groq SDK (Llama 3.3 70B) via LangChain + LangGraph agent framework
- **RAG Pipeline:** ChromaDB (vector store) + HuggingFace (embeddings + image generation)
- **Auth:** Supabase Auth (Email/Password + Google OAuth)
- **File Storage:** Supabase Storage (avatars, journal-images, future-self-images buckets)
- **Payments:** Dodo Payments (checkout, webhooks, customer portal)
- **Styling:** Tailwind CSS v4 + Framer Motion animations
- **Visual Studio Code** – Code editor for writing and managing frontend/backend code
- **Supabase Dashboard** – GUI for managing PostgreSQL data, storage, and auth
- **Node.js** – Backend JavaScript runtime

---

## 3. App Structure – Pages & Styling:

The following pages exist in the application:

- **Landing Page** (`/`)
- **Login Page** (`/login`)
- **Sign Up Page** (`/signup`)
- **Onboarding Page** (`/onboarding`)
- **Pricing Page** (`/pricing`)
- **Dashboard Page** (`/dashboard`)
- **Mandates Page** (`/dashboard/mandates`)
- **Journal Page** (`/dashboard/journal`)
- **AI Chat Page** (`/dashboard/chat`)
- **Accounts Page** (`/dashboard/accounts`)

All pages are rendered via **Next.js App Router** (file-based routing — each `page.tsx` file automatically maps to a route). Shared layouts are used:
- `src/app/layout.tsx` — Root layout wrapping `<AuthProvider>`, `<ToastProvider>`, `<GlobalSearch>`
- `src/app/dashboard/layout.tsx` — Dashboard layout with persistent `<Sidebar>` navigation

**Styling:**
- Tailwind CSS v4 with custom design tokens in `globals.css`
- Consistent dark theme (`bg-black text-white`) across all pages
- Google Fonts: Inter (body), Space Grotesk (display headings), Roboto Mono (labels/code)
- Framer Motion for page transitions, hover effects, and loading animations
- Military/cyber HUD aesthetic — uppercase tracking, accent color highlights, scanline overlays, corner decorations

---

## 4. Functional Requirements:

### 1. Display App Name
- Show the app name **"DECAYSTATE"** on the landing page Hero component and footer watermark.
- Show **"DECAYSTATE COMMAND"** in the dashboard header alongside the user's Operative ID.

### 2. Add New Missions (with Image Upload)
- Provide a multi-step onboarding form to input mission details (goal, manifesto/plan, timeframe).
- File input: Upload a profile photo (JPG/JPEG only) to Supabase Storage.
- Submit form data to the backend to store in **Supabase (PostgreSQL)** via `upsertActiveMission()`.
- Users can also create/edit missions inline from the Dashboard via the `<MissionSelector>` component.

### 3. View All Mandates (Daily Tasks)
- Fetch and display a list of all AI-generated mandates from the backend via `getMandates(userId)`.
- Use interactive **task cards** categorized by type: Physical, Intellectual, Spiritual.
- Each card shows: label, category, completion status, and AI-generated rationale.

### 4. View Individual Entry Details
- On clicking a mandate, view its full details: label, category, rationale, completion timestamp.
- On clicking a journal entry, view the full reflection: wins, failures, adjustments, and attached image.
- The AI Chat page provides a detailed, streaming conversation view with the Neural Link agent.

---

## 5. Sample Expected Output

### 1. Landing Page (Entry Point of the App)     *(10 Marks)*

**File:** `src/app/(landing-page)/page.tsx`

It includes:
- A **welcome message / app introduction** via the `<Hero />` component with the tagline: *"Manifest your future or watch it fade. Execute 80% of your daily protocol, or physically watch your ambition decay."*
- Navigation buttons/links with the following functionality:
  - **"Get Started"** – Navigates to the Sign Up page (`/signup`) where users create an account.
  - **"Log In"** – Navigates to the Login page (`/login`) for existing users to resume their session.
  - **Anchor links** – Scroll to `#features`, `#demo`, `#manifesto`, `#pricing` sections on the same page.
- Additional landing page sections rendered from dedicated components:
  - `<DecayDemo />` — Interactive decay mechanics visualization
  - `<AIPrompt />` — Live AI assistant demo
  - `<Manifesto />` — Product philosophy and value proposition
  - `<Methodology />` — How the accountability system works
  - `<Pricing />` — Subscription tiers (Observer free / Operator $7/mo)
  - `<FAQ />` — Frequently asked questions

**Design:**
- Clean layout with centered content (`max-w-6xl mx-auto`)
- Header/banner with the **DECAYSTATE** logo image and brand name
- Buttons clearly styled with hover effects (`hover:bg-accent`, `hover:text-black`, `transition-colors`)
- Footer with large decorative watermark text, social links, and copyright notice

---

### 2. Onboarding Page — Add Mission with Image Upload     *(10 Marks)*

**File:** `src/app/onboarding/page.tsx`

- Allow users to set up their first mission by filling out a **multi-step animated form** (Framer Motion transitions).
- **Step 1 — Identity Verification (Image Upload):**
  - Display a file input for uploading a professional profile photo.
  - File input: Upload image (**JPG/JPEG only** — validated on selection).
  - Shows image preview with clear/re-upload option.
  - Can be skipped if user prefers not to upload.
- **Step 2 — Define Target State (Mission Form):**
  - Display form with input fields for mission details:
    - **Goal** (text input, required — e.g., "Launch SaaS MVP", "Run Marathon")
    - **Manifesto / Plan** (textarea — how they'll achieve the goal)
    - **Timeframe** (text input with preset buttons: 7 Days, 30 Days, 90 Days, 6 Months)
  - On form submission:
    - ✅ Validate input fields (goal is required).
    - ✅ Upload image to Supabase Storage (`avatars` bucket) via `uploadFile("avatars", userId, file)`.
    - ✅ Update user profile with `avatar_url` in both the `profiles` table and Supabase Auth metadata.
    - ✅ Save mission data to Supabase DB via `upsertActiveMission(userId, { goal, timeframe, manifesto })`.
    - ✅ Log activity via `logActivity("mission", "Mission initialized: ...")`.
- **Step 3 — Neural Link Chat:**
  - AI-powered onboarding conversation via `<OnboardingChat />` component.
  - AI generates initial mandates (daily tasks) from the conversation context.
  - Mandates saved to DB via `addOnboardingMandates(userId, mandates, missionId)`.
- **Step 4 — Future Self Projection:**
  - AI generates a "future self" image by calling `POST /api/generate-future-self` with the `missionId`.
  - Generated image uploaded to Supabase Storage (`future-self-images` bucket) and record saved in `future_self_images` table.
  - On completion, user proceeds to `/dashboard`.

**API Used:**
```
POST  /api/generate-future-self    — AI image generation (Groq prompt + HuggingFace image)
```
**DB Operations:**
```
INSERT/UPDATE  missions            — Save mission to database
INSERT         mandates            — Save onboarding mandates
UPLOAD         avatars bucket      — Store profile photo in Supabase Storage
UPDATE         profiles            — Update user avatar_url
```

---

### 3. Dashboard & View Mandates Page     *(5 Marks)*

**Dashboard File:** `src/app/dashboard/page.tsx`  
**Mandates File:** `src/app/dashboard/mandates/page.tsx` + `src/components/dashboard/Mandates.tsx`

- Display all key data for the authenticated user stored in the database.
- On page load, fetch all data in parallel:
  - ✅ Fetch all mandates via `getMandates(userId)` — Supabase `SELECT` from `mandates` table.
  - ✅ Fetch journal entries via `getJournalEntries(userId)` — Supabase `SELECT` from `journal_entries` table.
  - ✅ Fetch active mission via `getActiveMission(userId)` — Supabase `SELECT` from `missions` table.
  - ✅ Fetch subscription via `getSubscription(userId)` — Supabase `SELECT` from `subscriptions` table.
  - ✅ Fetch shield state via `getOrCreateShields(userId)` — Supabase `UPSERT + SELECT` from `shields` table.
- Display each mandate's:
  - **Label** (task description, max 8 words)
  - **Category** (physical / intellectual / spiritual)
  - **AI Rationale** (1-sentence explanation of why this mandate matters)
  - **Completion status** (interactive checkbox toggle)
  - **Profile image** — Future Self AI-generated image displayed centrally with integrity-based decay overlay
- Include navigation:
  - **"Update Mandates"** button → `/dashboard/mandates`
  - **"Log Protocol"** button → `/dashboard/journal`
- The Mandates page allows: marking tasks complete, adding new mandates, deleting mandates, and **AI auto-generating 5 daily mandates** via `POST /api/mandates/generate`.

**API Used:**
```
GET (client DB)  mandates           — Fetch all mandates for the user
GET (client DB)  missions           — Fetch active mission
POST             /api/mandates/generate — AI-generate 5 daily mandates via Groq LLM
POST             /api/shields/evaluate  — Auto-evaluate mandate performance
```

---

### 4. Journal & Entry Details Page     *(5 Marks)*

**File:** `src/app/dashboard/journal/page.tsx` + `src/components/dashboard/Journal.tsx`

- Display full information about journal entries based on the authenticated user's ID.
- When the page is accessed:
  - ✅ Fetch all journal entries from Supabase via `getJournalEntries(userId)`.
- Display the following for each entry:
  - **Date** of the entry
  - **Wins** — what went well
  - **Failures** — what went wrong
  - **Adjustments** — planned corrections
  - **Profile image** (from Supabase Storage `journal-images` bucket using the stored `image_url`)
  - Any additional entry details
- Users can add new entries via a form with: wins, failures, adjustments fields + optional image upload.
- On form submission:
  - ✅ Validate input fields.
  - ✅ Upload image to Supabase Storage via `uploadFile("journal-images", userId, file)`.
  - ✅ Save entry to DB via `addJournalEntry(userId, { wins, failures, adjustments, missionId, imageUrl })`.

**API Used:**
```
GET (client DB)   journal_entries    — Fetch all journal entries
INSERT (client DB) journal_entries   — Add new journal entry
UPLOAD            journal-images     — Store journal image in Supabase Storage
```

---

### 5. API Calls in Browser     *(10 Marks)*

These API endpoints facilitate data exchange between the frontend and backend. All endpoints are Next.js API Routes (`src/app/api/`):

**Authentication:**
```
GET   /api/auth/callback             — OAuth callback (exchanges Google auth code for session)
                                       Testable: triggers via Google OAuth redirect
POST  /api/auth/delete               — Delete user account permanently
```

**AI / Chat (Neural Link):**
```
POST  /api/chat                      — AI chat with streaming (SSE) via LangGraph agent
                                       Returns: Server-Sent Events (type: text, tool_result, done)
POST  /api/chat/onboarding           — Onboarding-specific AI conversation
POST  /api/chat/actions              — AI tool actions (mandate creation, data lookup)
POST  /api/chat/weekly-review        — Weekly performance review AI conversation
```

**Mandates & Shields:**
```
POST  /api/mandates/generate         — AI-generate 5 daily mandates via Groq LLM
                                       Based on: active mission, journal history, weekly reviews
                                       Enforces: 24-hour cooldown between generations
                                       Enforces: Shield penalty (50% harder tasks at 0 shields)
POST  /api/shields/evaluate          — Evaluate yesterday's mandate completion rate
                                       Updates shield count (0–3) and consecutive day streak
```

**Image Generation:**
```
POST  /api/generate-future-self      — Generate AI "future self" image
                                       Pipeline: Groq (visual prompt) → HuggingFace (image gen)
                                       Limit: 3 generations per mission
                                       Stores in: Supabase Storage + future_self_images table
```

**Payments (Dodo Payments):**
```
POST  /api/dodo/create-checkout      — Create payment checkout session for subscription
POST  /api/dodo/portal               — Redirect user to Dodo customer management portal
POST  /api/dodo/webhook              — Handle Dodo payment webhook events (subscription updates)
```

**RAG (Retrieval-Augmented Generation):**
```
POST  /api/rag/embed                 — Embed journal entries into ChromaDB vector store
POST  /api/rag/sync                  — Sync journal entries to vector store for RAG retrieval
```

---

### 6. Files to GitHub – Submission Instructions     *(10 Marks)*

Submit the project by uploading all files to a GitHub repository:
- **Repository name:** `Decay-State`
- Make it **public**
- Ensure all files and folders are properly structured (see file structure below)
- Add a `.gitignore` file to exclude `node_modules/`, `.env`, `.next/`, etc.
- Include a clear `README.md` with:
  - **Project description:**  
    DecayState — an AI-powered personal accountability system. Users set goals (missions), receive AI-generated daily mandates, journal their progress, and watch their "future self" image decay if they fail to execute 80% of their daily protocol. Features include a LangGraph AI agent (Neural Link), RAG-enhanced conversations, shield-based gamification, and AI image generation.
  - **Installation steps:**
    ```bash
    git clone https://github.com/<team>/Decay-State.git
    cd Decay-State
    npm install
    cp .env.example .env   # Fill in API keys (Supabase, Groq, HuggingFace, Dodo, ChromaDB)
    npm run dev
    ```
  - **API endpoints:** (listed in Section 5 above — 14 endpoints total)
  - **How to run the app:**
    ```bash
    npm run dev
    # Opens at http://localhost:3000
    ```

**Environment Variables Required** (see `.env.example`):
```
GROQ_API_KEY, GROQ_MODEL_ID
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY
DODO_API_KEY, DODO_WEBHOOK_SECRET
HUGGINGFACE_API_KEY
CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE
NEXT_PUBLIC_APP_URL
```

**File Structure:**
```
Decay-State/
├── .env.example
├── .gitignore
├── README.md
├── DOCUMENTATION.md
├── package.json
├── tsconfig.json
├── middleware.ts
├── next.config.ts
├── postcss.config.mjs
├── public/
│   └── decaystate.png
├── supabase/
├── src/
│   ├── types.ts
│   ├── app/
│   │   ├── layout.tsx                          # Root layout (AuthProvider, ToastProvider, Fonts)
│   │   ├── globals.css                         # Global styles + Tailwind config
│   │   ├── (landing-page)/
│   │   │   ├── page.tsx                        # Landing page
│   │   │   └── components/
│   │   │       ├── Hero.tsx                    # Hero banner with CTA
│   │   │       ├── DecayDemo.tsx               # Interactive decay visualization
│   │   │       ├── AIPrompt.tsx                # AI chat demo section
│   │   │       ├── Manifesto.tsx               # Philosophy section
│   │   │       ├── Methodology.tsx             # How it works
│   │   │       ├── Pricing.tsx                 # Subscription tiers
│   │   │       ├── FAQ.tsx                     # FAQs
│   │   │       └── Navbar.tsx                  # Navigation bar
│   │   ├── login/page.tsx                      # Login page (Email + Google OAuth)
│   │   ├── signup/page.tsx                     # Sign Up page (Name, Username, Email, Password)
│   │   ├── onboarding/page.tsx                 # Multi-step onboarding (Image + Mission + AI Chat)
│   │   ├── pricing/page.tsx                    # Standalone pricing page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                      # Dashboard layout (Sidebar + main)
│   │   │   ├── page.tsx                        # Main dashboard (Command Center)
│   │   │   ├── mandates/page.tsx               # Mandates management page
│   │   │   ├── journal/page.tsx                # Journal entries page
│   │   │   ├── chat/page.tsx                   # AI Chat (Neural Link) page
│   │   │   └── accounts/page.tsx               # Profile & settings page
│   │   └── api/
│   │       ├── auth/callback/route.ts          # OAuth callback handler
│   │       ├── auth/delete/route.ts            # Account deletion
│   │       ├── chat/route.ts                   # AI chat streaming endpoint
│   │       ├── chat/onboarding/route.ts        # Onboarding chat
│   │       ├── chat/actions/route.ts           # AI tool actions
│   │       ├── chat/weekly-review/route.ts     # Weekly review chat
│   │       ├── mandates/generate/route.ts      # AI mandate generation
│   │       ├── shields/evaluate/route.ts       # Shield evaluation
│   │       ├── generate-future-self/route.ts   # AI image generation
│   │       ├── dodo/create-checkout/route.ts   # Payment checkout
│   │       ├── dodo/portal/route.ts            # Customer portal
│   │       ├── dodo/webhook/route.ts           # Payment webhook
│   │       ├── rag/embed/route.ts              # Vector store embedding
│   │       └── rag/sync/route.ts               # Vector store sync
│   ├── components/
│   │   ├── GlobalSearch.tsx                    # Cmd+K search overlay
│   │   ├── dashboard/
│   │   │   ├── AIChat.tsx                      # AI chat component (streaming SSE)
│   │   │   ├── Mandates.tsx                    # Mandates list + CRUD
│   │   │   ├── Journal.tsx                     # Journal entries + form
│   │   │   ├── FutureSelfImage.tsx             # AI image with decay overlay
│   │   │   ├── FutureSelfGallery.tsx           # Image gallery modal
│   │   │   ├── MissionSelector.tsx             # Inline mission editor
│   │   │   ├── LiveSystemLog.tsx               # Real-time activity feed
│   │   │   ├── OpsSummary.tsx                  # Operational metrics
│   │   │   ├── Sidebar.tsx                     # Dashboard sidebar nav
│   │   │   └── TaskItem.tsx                    # Individual task card
│   │   ├── onboarding/                         # OnboardingChat component
│   │   └── ui/                                 # Button, Input, CyberToast, etc.
│   ├── context/
│   │   └── AuthContext.tsx                     # Auth state provider (session, user, signIn/Out)
│   └── lib/
│       ├── db/
│       │   ├── mandates.ts                     # Mandate CRUD (getMandates, addMandate, completeMandate, deleteMandate)
│       │   ├── journal.ts                      # Journal CRUD (getJournalEntries, addJournalEntry)
│       │   ├── mission.ts                      # Mission CRUD (getActiveMission, createMission, upsertActiveMission)
│       │   ├── shields.ts                      # Shield state (getOrCreateShields, shouldEvaluateShields)
│       │   ├── subscriptions.ts                # Subscription queries (getSubscription, upsertSubscription)
│       │   ├── activity.ts                     # Activity log queries
│       │   ├── ai-chats.ts                     # AI chat message storage
│       │   ├── conversations.ts                # Conversation thread management
│       │   ├── daily-generation.ts             # Daily mandate generation tracking (24h cooldown)
│       │   ├── future-self-images.ts           # Future self image records
│       │   ├── onboarding.ts                   # Onboarding mandate insertion
│       │   └── weekly-review.ts                # Weekly review summaries
│       ├── supabase/
│       │   ├── client.ts                       # Browser Supabase client
│       │   ├── server.ts                       # Server-side Supabase client
│       │   └── proxy.ts                        # Session refresh middleware
│       ├── agent/                              # LangGraph AI agent configuration
│       ├── rag/                                # RAG retrieval utilities (ChromaDB)
│       ├── future-self/                        # Prompt generator + image generator
│       ├── cache/                              # Caching utilities
│       ├── storage.ts                          # Supabase Storage upload/delete helper
│       ├── auth.ts                             # Auth helper utilities
│       ├── activityLog.ts                      # Activity logging function
│       ├── featureGate.ts                      # Feature gating by subscription tier
│       ├── groq-config.ts                      # Groq API key + model config
│       └── dodo.ts                             # Dodo Payments client
```

---

**Note:** Submit your GitHub repository link through the Google Form that was shared before the deadline.

---

### Course Outcome (CO) and Bloom's Level (BL) Coverage in this Assessment:

| Question | CO | BL |
|---|---|---|
| 1. Landing Page | CO1 | L3 (Apply) |
| 2. Onboarding + Image Upload | CO3, CO5 | L3 (Apply), L4 (Analyze) |
| 3. Dashboard + View Mandates | CO2, CO3 | L3 (Apply) |
| 4. Journal Details Page | CO2 | L2 (Understand) |
| 5. API Calls in Browser | CO4 | L3 (Apply) |
| 6. Files to GitHub | CO5 | L3 (Apply) |

---

*Approved by the Audit Professor/Course Coordinator*
