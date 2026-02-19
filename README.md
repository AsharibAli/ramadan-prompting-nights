# Ramadan Prompting Nights

Ramadan Prompting Nights is a scenario-based prompting competition for GIAIC students.
Students do not write the final code directly. They write a structured prompt, AI generates code, tests run, and a weighted score is calculated.

Created by Sir Asharib Ali.

## How it works

1. Write a structured prompt (`Goal`, `Constraints`, `Edge Cases`, `Output Format`)
2. Generate code and run tests
3. Submit and get a weighted score

## Scoring Model (Current)

Score is out of 100 and higher is better:

- Prompt Quality: 60 points
- Correctness: 20 points
- Efficiency: 20 points

Correctness is also a submission gate:

- Server requires at least 70% test pass rate to accept a submission.

Notes:

- Prompt and code token counts are still measured and shown.
- Efficiency uses token totals as input.

## Core Product Rules

- 30 daily scenario challenges
- Challenge unlocks are time-based (PKT display in UI)
- Users can retry as many times as they want
- Best score per challenge is used for leaderboard
- Public leaderboard is visible without login

## Anti-Copy Protection

Backend enforces:

- Structured prompt format (required sections)
- Similarity check against scenario text and recent prompts
- Submissions too similar to scenario/other prompts are rejected

## Tech Stack

Monorepo: Turborepo

Frontend (`apps/web`):

- Next.js (App Router)
- Tailwind CSS
- shadcn/ui
- Clerk

Backend (`apps/api`):

- Hono
- Bun
- Drizzle ORM

Database (`packages/db`):

- Postgres (Supabase)

## Project Structure

```txt
apps/
  api/   # Hono + Bun API
  web/   # Next.js frontend
packages/
  db/    # Drizzle schema, types, seed, shared token utility
```

## Main API Endpoints

Public:

- `GET /api/challenges`
- `GET /api/challenges/:dayNumber`
- `GET /api/leaderboard`

Protected:

- `POST /api/generate`
- `POST /api/submissions`
- `GET /api/submissions/me`

## Environment Variables

API (`apps/api/.env.local`):

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SIGNING_SECRET`
- `OPENROUTER_API_KEY`
- `APP_ENV` (`development` or `production`)

Web (`apps/web/.env.local`):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_ENV`

DB (`packages/db/.env` or `.env.local`):

- `DATABASE_URL`

## Setup

1. Install dependencies

```bash
pnpm install
```

1. Install Bun (if missing): [Bun installation guide](https://bun.sh/docs/installation)

1. Push schema and seed challenges

```bash
pnpm db:push
pnpm db:seed
```

## Run Locally

```bash
pnpm dev
```

Default ports:

- Web: `http://localhost:3000`
- API: `http://localhost:3004`

## Useful Scripts

- `pnpm typecheck` - run type checks for all packages
- `pnpm db:push` - sync schema to DB
- `pnpm db:seed` - seed 30 scenario challenges

## Deployment

Frontend:

- Vercel

Backend:

- Railway / Render (or any Bun-supported host)

## Contributing

1. Create a branch
2. Make changes
3. Open a pull request
