

# DecayState — AI-Powered Personal Accountability System

> An AI-driven system to enforce personal accountability through missions, mandates, journaling, and adaptive intelligence.

DecayState is a full-stack application where users define goals, receive AI-generated tasks, track progress, and visualize their future self.

---

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open in browser:
[http://localhost:3000](http://localhost:3000)

The application automatically reloads when files inside `src/app` are updated.

---

## Features

* Mission system for defining goals, plans, and timelines
* AI-generated daily mandates (tasks)
* Journal system with image upload support
* Future self AI image generation
* AI chat assistant (Neural Link)
* Authentication using Supabase (Email + Google OAuth)

---

## Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Framer Motion

### Backend

* Next.js API Routes
* Supabase (PostgreSQL, Auth, Storage)

### AI / Machine Learning

* Groq (Llama 3)
* LangChain + LangGraph
* HuggingFace
* ChromaDB

---

## Project Structure

```bash
src/
 ├── app/          # Pages and routing
 ├── components/   # UI components
 ├── context/      # Global state management
 └── lib/          # Database, API, utilities
```

---

## Environment Variables

Create a `.env` file in the root directory and add:

```bash
GROQ_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
HUGGINGFACE_API_KEY=
CHROMA_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## API Routes

* `/api/chat` → AI chat interaction
* `/api/chat/onboarding` → Onboarding AI
* `/api/mandates/generate` → Generate mandates
* `/api/shields/evaluate` → Evaluate performance
* `/api/generate-future-self` → Generate AI image

---

## Application Flow

1. User signs up or logs in
2. Completes onboarding (mission + image)
3. AI generates daily mandates
4. User completes tasks
5. User logs journal entries
6. System adapts using AI

---

## Learn More

* Next.js Documentation: [https://nextjs.org/docs](https://nextjs.org/docs)
* Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
* Groq API Documentation: [https://console.groq.com/docs](https://console.groq.com/docs)

---

## Deployment

* Vercel (recommended)
* Any Node.js hosting platform

### Steps

1. Connect your GitHub repository
2. Add environment variables
3. Deploy

---

## Notes

* Ensure all API keys are configured correctly
* Supabase database and storage must be set up
* AI features depend on external APIs

---

## License

MIT License

Copyright (c) 2025 

Don’t over-edit this now.
Push it and move on — your time is better spent elsewhere.
