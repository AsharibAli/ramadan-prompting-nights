# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Ramadan Prompting Nights is a Turborepo monorepo (pnpm workspace) with two apps and four packages:

| Service | Path | Runtime | Port |
|---------|------|---------|------|
| **API** (Hono) | `apps/api` | Bun | 3004 |
| **Web** (Next.js 15) | `apps/web` | Node.js >=22 | 3000 |
| **DB** (Drizzle ORM) | `packages/db` | — | — |

### Running services

- **API server**: `cd apps/api && bun run --hot src/index.ts` (requires `~/.bun/bin` on PATH)
- **Web frontend**: `cd apps/web && npx next dev --turbopack --port 3000`
- Both via Turborepo: `pnpm dev` from the repo root

### Key caveats

- **Bun is required** for the API server — it is NOT pre-installed on standard VMs. Install via `curl -fsSL https://bun.sh/install | bash` then add `~/.bun/bin` to PATH.
- **Clerk credentials are mandatory** for the Next.js frontend to render any page. The Clerk middleware validates the publishable key on every request. Without valid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, the frontend returns HTTP 500 ("Publishable key not valid"). The API server works without valid Clerk keys for public endpoints.
- **PostgreSQL** is needed locally. Schema push: `pnpm db:push`. The seed file (`packages/db/src/seed.ts`) is gitignored and not in the repo.
- **Environment files** required: `apps/api/.env.local`, `apps/web/.env.local`, `packages/db/.env` — see `README.md` for variable names.
- ESLint is not a declared dependency but `next lint` (used in `apps/web`) requires it. Install with `pnpm add -D eslint@"^9" eslint-config-next@"^15"` in the web app, and create `apps/web/.eslintrc.json` with `{"extends": "next/core-web-vitals"}`.

### Lint / Typecheck / Test

- **Biome** (primary linter/formatter): `npx biome check .` or `pnpm format`
- **Next lint**: `pnpm lint` (runs `turbo run lint` → only `apps/web` has a lint script)
- **Typecheck**: `pnpm typecheck`
- **Tests**: `cd packages/id && npx vitest run` (only test file in repo: `packages/id/src/generate.test.ts`)
- Pre-existing lint warnings/errors exist in the repo; the `--max-warnings 0` flag in web's lint causes failures.

### Database

- Uses PostgreSQL via Drizzle ORM. Connection string goes in `DATABASE_URL`.
- `pnpm db:push` syncs schema. `pnpm db:studio` opens Drizzle Studio.
