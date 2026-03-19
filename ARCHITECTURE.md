# Ramadan Prompting Nights — Architecture

## What Is This Project?

A **scenario-based prompting competition** for GIAIC students. Instead of writing code directly, students write structured prompts, an AI generates code from those prompts, and the generated code is tested against challenge test cases. There are 30 daily challenges that unlock one per day at 10 PM PKT.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo + pnpm |
| **Frontend** | Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, React Query |
| **Backend** | Hono (on Bun runtime) |
| **Database** | PostgreSQL (Supabase) via Drizzle ORM |
| **Auth** | Clerk (frontend + backend JWT validation) |
| **AI** | OpenRouter (multi-LLM provider) via Vercel AI SDK |
| **Analytics** | Vercel Analytics, PostHog, Google Analytics |

## Directory Structure

```
ramadan-prompting-nights/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   └── src/
│   │       ├── app/                # Pages & routes (App Router)
│   │       │   ├── (marketing)/    # Landing page (public)
│   │       │   ├── (auth)/         # Sign-in / sign-up (Clerk)
│   │       │   ├── dashboard/      # Dashboard + challenge solver
│   │       │   ├── leaderboard/    # Public leaderboard
│   │       │   ├── chat/           # Chat feature
│   │       │   └── posts/          # Posts feature
│   │       ├── api/                # Client-side API hooks (React Query + Hono RPC)
│   │       ├── components/         # UI components (shadcn/ui, layout, ramadan-specific)
│   │       ├── lib/                # Utilities (test runner, time, analytics)
│   │       └── hooks/              # Custom React hooks
│   └── api/                        # Hono backend
│       └── src/
│           ├── modules/            # Feature modules
│           │   ├── ramadan/        # Core competition logic
│           │   │   ├── ramadan.routes.ts     # API endpoints
│           │   │   ├── ramadan.service.ts    # Business logic & DB queries
│           │   │   ├── prompt-rules.ts       # Prompt validation & scoring
│           │   │   ├── validation.ts         # Code validation against tests
│           │   │   ├── similarity.ts         # Plagiarism detection
│           │   │   └── rate-limit.ts         # Generation rate limiting
│           │   ├── chat/           # Chat feature
│           │   ├── posts/          # Posts feature
│           │   └── webhooks/       # Clerk webhooks
│           ├── config/             # AI model configuration (OpenRouter)
│           └── pkg/                # Shared middleware, errors, utilities
├── packages/
│   ├── db/                         # Database schema (Drizzle), client, types, migrations
│   ├── id/                         # ID generation utilities
│   ├── logs/                       # Structured logging
│   └── typescript-config/          # Shared TypeScript configs
```

## Routes

### Frontend (Next.js App Router)

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/sign-in`, `/sign-up` | Public | Clerk auth pages |
| `/dashboard` | Protected | Shows all 30 challenges with lock/completion status |
| `/dashboard/day/[dayNumber]` | Protected | Challenge solver page |
| `/leaderboard` | Public | Paginated leaderboard with top 3 featured |
| `/chat`, `/posts` | Protected | Secondary social features |

### Backend API (Hono)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/challenges` | GET | No | List all challenges with unlock status |
| `/api/challenges/:dayNumber` | GET | No | Challenge details + test cases |
| `/api/generate` | POST | Yes | Send prompt, get AI-generated code |
| `/api/submissions` | POST | Yes | Submit code for scoring |
| `/api/submissions/me` | GET | Yes | User's best submissions per challenge |
| `/api/leaderboard` | GET | No | Paginated rankings |
| `/api/leaderboard/breakdown` | GET | No | Leaderboard breakdown stats |
| `/api/leaderboard/me` | GET | Yes | User's own rank |

## Core User Flow

```
Student opens Dashboard
  → Sees 30 challenges (locked/unlocked based on date)
  → Picks an unlocked challenge
  → Writes a structured prompt with 4 required sections:
      1. Goal
      2. Constraints
      3. Edge Cases
      4. Output Format
  → Clicks "Generate Code"
      → Frontend POSTs to /api/generate
      → Backend validates prompt structure
      → Backend calls OpenRouter LLM
      → Returns generated code + token counts
  → Clicks "Run Tests"
      → Tests run client-side in a sandboxed closure
      → Must pass ≥70% to be allowed to submit
  → Clicks "Submit"
      → Backend scores the submission (see Scoring below)
      → Score saved to leaderboard
```

## Database Schema

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **users** | Synced from Clerk | id, name, email, imageUrl |
| **challenges** | 30 competition challenges | dayNumber, title, description, functionName, testCases (JSONB), difficulty, unlocksAt |
| **submissions** | Every attempt | userId, challengeId, prompt, generatedCode, all score breakdowns, passed |
| **posts** | Social posts | Secondary feature |
| **chats / chatMessages** | Chat conversations | Secondary feature |

## Scoring System

### Components (weighted)

| Component | Weight | How It's Calculated |
|-----------|--------|---------------------|
| **Prompt Quality** | 60% | Structure (15 pts × 4 sections = 60) + Depth (0–20 based on length) + Specificity (0–20 keyword hits) |
| **Correctness** | 20% | Percentage of test cases passed |
| **Efficiency** | 20% | Token count on piecewise-linear scale (80 tokens = 100 pts, 400+ tokens = 0 pts) |

### Formula

```
Final Score = (PromptQuality × 0.6 + Correctness × 0.2 + Efficiency × 0.2) × AttemptMultiplier
```

### Attempt Multipliers

| Attempt | Multiplier |
|---------|-----------|
| 1st | 1.00 (100%) |
| 2nd | 0.90 (90%) |
| 3rd | 0.75 (75%) |

Max 3 attempts per challenge. Best score counts for leaderboard.

## Anti-Cheating Measures

1. **Similarity Detection** — Jaccard similarity compares prompts against the challenge description and other submissions. Blocks if >80% similar.
2. **Attempt Limits** — Max 3 attempts per challenge with score penalties.
3. **Sandboxed Test Execution** — Client-side test runner shadows dangerous globals (`process`, `require`, `Bun`) to prevent code injection.
4. **Rate Limiting** — 20 code generation requests per hour per user (in-memory sliding window).

## Authentication Flow

1. **Frontend**: `ClerkProvider` wraps the app. Middleware protects `/dashboard` routes.
2. **Backend**: Clerk middleware validates JWTs on protected endpoints and provides user context.
3. **User Sync**: Clerk user data synced to the database at most once every 5 minutes (TTL cache).

## Notable Architectural Decisions

- **Type-safe API calls** — Hono RPC client gives the frontend full type safety when calling the backend. No manual type definitions needed.
- **Client-side test execution** — Tests run in the browser, not the server, reducing backend load.
- **Clerk user sync with TTL cache** — Avoids redundant Clerk API calls by caching for 5 minutes.
- **oklch color model** — Tailwind CSS v4 with perceptually uniform colors for the dark/gold Ramadan theme.
- **Dev mode unlock** — All challenges unlocked when `APP_ENV=development` for developer testing.
- **Token estimation** — Custom formula (`words × 1.3 + special_chars × 0.3`) used for efficiency scoring.
- **Singleton Clerk client** — Preserves JWKS key cache across requests for better performance.

## Environment Variables

### Frontend (`apps/web/.env.local`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk public key
- `CLERK_SECRET_KEY` — Clerk secret
- `NEXT_PUBLIC_API_URL` — Backend API URL (e.g., `http://localhost:3004/api`)
- `NEXT_PUBLIC_APP_ENV` — `development` or `production`

### Backend (`apps/api/.env.local`)
- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Auth
- `CLERK_SIGNING_SECRET` — Webhook verification
- `OPENROUTER_API_KEY` — LLM provider key
- `APP_ENV` — `development` or `production`
- `CORS_ORIGINS` — Comma-separated allowed origins

### Database (`packages/db/.env`)
- `DATABASE_URL` — PostgreSQL connection string
