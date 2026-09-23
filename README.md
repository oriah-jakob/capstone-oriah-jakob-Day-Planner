# Remmi — Shared Day Planner

A timeline-based day planner and to-do organizer. Users schedule tasks on a personal
daily timeline, mark them complete, receive email reminders before a task starts, and
optionally link into a family group where members can view — but not edit — each
other's timelines.

Capstone project · Ori Jakob · 000862211 · Mohawk College

## Stack

| Layer         | Choice                                                |
| ------------- | ----------------------------------------------------- |
| Frontend      | TypeScript, Vite, React, React Router, TanStack Query |
| Styling       | Tailwind CSS, shadcn/ui                               |
| Backend       | Supabase (PostgreSQL, Auth, Row Level Security)       |
| Unit tests    | Vitest, Testing Library                               |
| E2E tests     | Playwright                                            |
| Accessibility | axe-core (via Playwright)                             |
| Hosting       | Vercel (frontend), Supabase (backend)                 |

## Prerequisites

- **Node 24** — the version is pinned in `.nvmrc`. With nvm: `nvm use`.
- **Docker Desktop** — required only for the local Supabase stack (`npm run db:start`).

## Getting started

```bash
npm ci
cp .env.example .env.local
npm run db:start     # starts local Postgres + Auth, prints the API URL and keys
```

Copy the printed **API URL** and **anon key** into `.env.local`, then:

```bash
npm run dev          # http://localhost:5173
```

`npm run db:stop` shuts the local stack down. `npm run db:reset` rebuilds the database
from `supabase/migrations/` — the migrations are the source of truth, so never change
the schema by clicking around a dashboard.

### Environment variables

| Variable                    | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | Supabase API URL                                                    |
| `VITE_SUPABASE_ANON_KEY`    | Publishable key; only grants what row level security allows         |
| `VITE_APP_URL`              | Base URL used to build password reset links                         |
| `SUPABASE_SERVICE_ROLE_KEY` | Server side only. Writes the audit log; bypasses row level security |

Anything prefixed `VITE_` is compiled into the browser bundle, so the service role key
deliberately has no prefix and is read only by the `api/` handlers.

## Scripts

| Command                 | Does                                               |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Dev server on port 5173                            |
| `npm run build`         | Typecheck and build to `dist/`                     |
| `npm run preview`       | Serve the production build on port 4173            |
| `npm run lint`          | ESLint (includes `jsx-a11y` accessibility rules)   |
| `npm run format`        | Prettier write                                     |
| `npm run typecheck`     | `tsc -b` across app, node, and e2e projects        |
| `npm test`              | Vitest once                                        |
| `npm run test:watch`    | Vitest in watch mode                               |
| `npm run test:coverage` | Vitest with coverage                               |
| `npm run test:e2e`      | Playwright against the production build            |
| `npm run test:e2e:ui`   | Playwright interactive runner                      |
| `npm run db:start`      | Start the local Supabase stack                     |
| `npm run db:reset`      | Reapply all migrations from scratch                |
| `npm run db:types`      | Regenerate `src/types/database.ts` from the schema |

## Layout

```
.github/workflows/   CI (lint, typecheck, unit) and E2E (Playwright, axe)
api/                 Vercel serverless functions
  _lib/              shared request, cookie, Supabase, and audit helpers
  auth/              register, login, refresh, logout, password reset
plugins/             Vite plugin that serves api/ in dev and preview
src/
  app/               router, providers, navigation config
  components/        layout, shared components, ui/ (shadcn primitives)
  features/auth/     auth context, provider, route guards
  hooks/             shared React hooks
  lib/               framework-agnostic helpers, validation schemas
  routes/            one file per page
supabase/
  migrations/        versioned schema; the source of truth
tests/
  unit/              Vitest
  e2e/               Playwright, one spec per functional requirement
```

### How authentication is wired

Sessions use a split-token design so NFR-3 can be met literally. The refresh token
is set by the `api/auth/*` functions into a cookie marked `HttpOnly`, `Secure`,
`SameSite=Lax` and scoped to `/api/auth`; script cannot read it. The access token is
returned in the response body and held only in a module variable, never in
`localStorage` or a readable cookie, so a closed tab ends the session and an injected
script finds no persisted credential. `src/lib/supabase.ts` hands that in-memory token
to Supabase through the `accessToken` callback, which is why `supabase.auth.*` must
not be called on that client.

Because Vite does not run Vercel functions, `plugins/api-routes.ts` mounts the same
handlers during `npm run dev` and `npm run preview`. The handlers are imported
directly and Node strips the types, so every import inside `api/` is relative and
carries an explicit `.ts` extension.

## Testing

`npm test` runs unit tests; `npm run test:e2e` builds the app and drives it in Chromium.
Every end-to-end spec is named after the test case IDs in the project proposal so results
map straight onto the test plan. Accessibility checks run inside the Playwright suite via
axe-core, covering WCAG 2.1 A/AA.

The design tokens in `src/index.css` are contrast-checked by
`tests/unit/theme-contrast.test.ts`; changing a colour to something that fails WCAG 1.4.3
breaks the build rather than slipping through to an audit later.

## Hosted project configuration

Local Supabase settings live in `supabase/config.toml` and are applied automatically. The
hosted project must be configured to match by hand — in particular the password policy
under **Authentication → Sign In / Providers → Email**:

- Minimum length **8**
- Required characters: **lowercase, uppercase, digits, symbols**

This is the server-side enforcement of the password rule. Client-side validation exists
only to produce a friendlier error message and must never be the only check.

## Conventions

**Branches** — `<type>/<kebab-case-description>`, e.g. `feat/frontend-login`,
`fix/truncated-values`, `chore/update-dependencies`. One branch per feature; open a pull
request into `main`.

**Commits** — Conventional Commits, imperative, subject under 50 characters:

```
feat: add login form validation
fix: correct timeline sort for midnight tasks
chore: add playwright config
```

One logical change per commit. If the subject needs an "and", split it.
