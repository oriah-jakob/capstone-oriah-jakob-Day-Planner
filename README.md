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

### Windows: "ports are not available"

After a reboot, Windows can reserve the port range that holds the Supabase defaults
(54320 to 54329) and `npm run db:start` fails to bind them. Either restart the NAT service
in an administrator terminal:

```powershell
net stop winnat
net start winnat
```

or move the local stack for that session and point the app at it:

```bash
export SUPABASE_API_PORT=44321 SUPABASE_DB_PORT=44322 SUPABASE_DB_SHADOW_PORT=44320
export SUPABASE_LOCAL_SMTP_PORT=44324 SUPABASE_DB_POOLER_PORT=44329
export VITE_SUPABASE_URL=http://127.0.0.1:44321
npm run db:start
```

### Environment variables

| Variable                    | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | Supabase API URL                                                    |
| `VITE_SUPABASE_ANON_KEY`    | Publishable key; only grants what row level security allows         |
| `VITE_APP_URL`              | Base URL for password reset links; not needed on Vercel             |
| `SUPABASE_SERVICE_ROLE_KEY` | Server side only. Writes the audit log; bypasses row level security |

Anything prefixed `VITE_` is compiled into the browser bundle, so the service role key
deliberately has no prefix and is read only by the `api/` handlers.

## Scripts

| Command                 | Does                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Dev server on port 5173                                           |
| `npm run build`         | Typecheck and build to `dist/`                                    |
| `npm run preview`       | Serve the production build on port 4173                           |
| `npm run lint`          | ESLint (includes `jsx-a11y` accessibility rules)                  |
| `npm run format`        | Prettier write                                                    |
| `npm run typecheck`     | `tsc -b` across app, node, and e2e projects                       |
| `npm test`              | Vitest once                                                       |
| `npm run test:watch`    | Vitest in watch mode                                              |
| `npm run test:coverage` | Vitest with coverage                                              |
| `npm run test:e2e`      | Playwright end-to-end and API specs against the production build  |
| `npm run test:e2e:ui`   | Playwright interactive runner                                     |
| `npm run test:api`      | Playwright API specs only                                         |
| `npm run test:smoke`    | Read-only smoke specs; set `PLAYWRIGHT_BASE_URL` for a deployment |
| `npm run db:start`      | Start the local Supabase stack                                    |
| `npm run db:reset`      | Reapply all migrations from scratch                               |
| `npm run db:push`       | Apply the migrations to the linked hosted project                 |
| `npm run db:types`      | Regenerate `src/types/database.ts` from the schema                |

## Layout

```
.github/workflows/   CI, E2E (Playwright, axe), and deployment smoke and ZAP scans
api/                 Vercel serverless functions
  _lib/              shared request, cookie, Supabase, and audit helpers
  auth/              register, login, refresh, logout, password reset, change password
plugins/             Vite plugin that serves api/ in dev and preview
src/
  app/               router, providers, navigation config
  components/        layout, shared components, ui/ (shadcn primitives)
  features/auth/     auth context, provider, route guards, change password form
  features/profile/  profile query and update hooks, profile and settings forms
  features/family/   family queries, member list, add and remove member forms
  features/tasks/    task queries, create and edit form, timeline, task list
  hooks/             shared React hooks
  lib/               framework-agnostic helpers, validation schemas
  routes/            one file per page
  types/             database.ts, generated by npm run db:types
supabase/
  migrations/        versioned schema; the source of truth
tests/
  unit/              Vitest
  e2e/               Playwright, one spec per functional requirement
  api/               Playwright request specs (API-01 to API-03, family permissions) and the
                     Postman collection
  smoke/             read-only checks that run against a deployed URL
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

Changing a password from Settings posts to `api/auth/change-password`, which confirms the
current password and then updates it on the session that made the request. That session
stays signed in while Supabase revokes every other one.

### How the timeline reads tasks

Tasks are read and written straight from the browser through PostgREST; row level
security limits every statement to the caller's own rows, and the table's `CHECK`
constraints repeat the form's rules (end after start, title length, known status) so a
direct API call cannot store what the form would refuse. The dashboard keeps the day in
a `?date=YYYY-MM-DD` parameter, so a refresh or a shared link opens the same day. Dates
and times are wall-clock values with no timezone conversion, matching the ERD.

Each task on the timeline can be marked done, edited at `/tasks/:id/edit`, or deleted after a
confirmation. The done box updates the cached timeline straight away and puts the old value
back if the save fails, so the screen never shows a status the database does not have
(NFR-12). Row level security turns a delete the caller is not allowed to make into "0 rows"
rather than an error, so the client treats an empty result as a failed delete.

### How family sharing works

A family is one owner and the accounts they link by email. The `families` and
`family_members` tables accept no writes from the API at all; creating a family, adding and
removing members go through `create_family`, `add_family_member` and `remove_family_member`,
which check who is calling before they change anything. Adding someone gives the same message
whether the email has no account or the person is already in a family, so the form cannot be
used to find out who is registered. A trigger keeps `profiles.account_type` in step with the
membership.

Sharing is read-only by construction: new select policies let family members read each
other's profiles and tasks, while the insert, update and delete policies on `tasks` still
match only the owner. Tasks marked "Hide from family view" are left out of the family policy.
Policies on `family_members` cannot query `family_members` without recursing, so membership
is read through two `security definer` helpers, `current_family_id()` and
`shares_family_with()`. The permission tests in `tests/api/api-family.spec.ts` send the
forbidden requests directly, because a hidden button is not an access control.

### How My Tasks searches

Search, date, status and type filters run in the database through PostgREST, so only the
matching rows come back. The search looks in the title and the note, case-insensitively;
`%`, `_` and backslashes are escaped so they match literally, and the text is quoted because
commas and parentheses are part of PostgREST's `or` syntax. Sorting by title, type, date or
status happens on the returned rows, with ties falling back to date and time. The filters
live in the URL, so a reload or a shared link shows the same list, and typing is debounced
by 300 ms so a word becomes one request rather than one per letter.

### Serving the API locally

Because Vite does not run Vercel functions, `plugins/api-routes.ts` mounts the same
handlers during `npm run dev` and `npm run preview`. The handlers are imported
directly and Node strips the types, so every import inside `api/` is relative and
carries an explicit `.ts` extension.

## Testing

`npm test` runs unit tests; `npm run test:e2e` builds the app and drives it in Chromium.
Every end-to-end spec is named after the test case IDs in the project proposal so results
map straight onto the test plan. Accessibility checks run inside the Playwright suite via
axe-core, covering WCAG 2.1 A/AA.

The API test cases (API-01 to API-03) and the family permission checks live in `tests/api/` and run in the same Playwright
command, using its request API against the `/api` endpoints and Supabase PostgREST. The
same requests are kept as a Postman collection, `tests/api/remmi.postman_collection.json`,
with `tests/api/local.postman_environment.json` for the local stack; import both into
Postman to run them by hand for the milestone evidence.

The design tokens in `src/index.css` are contrast-checked by
`tests/unit/theme-contrast.test.ts`; changing a colour to something that fails WCAG 1.4.3
breaks the build rather than slipping through to an audit later. The check also covers the
90% hover state of primary buttons.

## Deployment

The app runs on Vercel and talks to a hosted Supabase project. Both fit the free tiers.

### 1. Supabase project

1. Create a project at supabase.com. The migrations are the only way the schema changes:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npm run db:push
   ```

2. Match the local `supabase/config.toml` in the dashboard:
   - **Authentication → Sign In / Providers → Email:** turn **Confirm email** off, since
     registration signs the user straight in. Set the minimum password length to **8**
     and require **lowercase, uppercase, digits, symbols**. This is the server-side
     enforcement of FR-1.3; the client-side check only gives a friendlier message.
   - **Authentication → URL Configuration:** set the Site URL to the production URL and
     add `https://<app>.vercel.app/reset-password` to the redirect URLs. Add
     `https://*-<team>.vercel.app/reset-password` as well so reset links work on previews.
3. Copy the project URL, the publishable key and the secret key from **Project Settings →
   API Keys**.

The built-in email sender only delivers to members of the Supabase organisation and is
rate limited. That is enough for a demo; real users need custom SMTP.

### 2. Vercel project

1. Import the GitHub repository. `vercel.json` sets the framework, the single page app
   rewrite and the security headers, and `package.json` pins Node 24.
2. Add the environment variables to Production and Preview:

   | Variable                    | Value                                                    |
   | --------------------------- | -------------------------------------------------------- |
   | `VITE_SUPABASE_URL`         | project URL                                              |
   | `VITE_SUPABASE_ANON_KEY`    | publishable key                                          |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret key, marked Sensitive                             |
   | `APP_URL`                   | only for a custom domain; otherwise Vercel's URL is used |

3. Deploy. Merging to `main` deploys production and every pull request gets a preview.

### 3. Verify

```bash
PLAYWRIGHT_BASE_URL=https://<app>.vercel.app npm run test:smoke
```

The smoke specs are read-only: app shell, deep links, the auth functions, the security
headers and the HTTPS redirect. The sign-in check also needs `SMOKE_EMAIL` and
`SMOKE_PASSWORD`; see the smoke account below.

After each production deployment, GitHub Actions runs the same smoke test (`smoke.yml`)
and an OWASP ZAP baseline scan (`zap.yml`, SEC-01). The ZAP report is attached to the run
as an artifact. Both can also be started from the Actions tab against any URL.

The automatic runs test the `PRODUCTION_URL` repository variable rather than the URL in the
deployment event, because Vercel puts every per-deployment URL behind its login and only the
production domain is public. They also need the Vercel project to report deployments to
GitHub, which is the GitHub Deployments option under the project's Git settings.

### Smoke account

Locally the sign-in check registers a throwaway account, so it runs in the E2E job on every
pull request without secrets. A deployment needs a real account:

1. Register an account on the deployed site that is used for nothing else, with a long
   random password.
2. Save it as repository secrets. `gh secret set` prompts for each value, so neither ends
   up in shell history:

   ```bash
   gh secret set SMOKE_EMAIL
   gh secret set SMOKE_PASSWORD
   ```

The repository is public, so the uploaded report must never contain the password.
Playwright puts typed values in its step titles and request bodies in its traces, which is
why the check signs in through `/api/auth/login` and `tests/smoke/sign-in.spec.ts` turns
traces off. GitHub masks secrets in logs and never passes them to workflows from forks. If
the password still leaks, the account holds no data and row level security keeps it out of
everyone else's; register a new one and replace both secrets.

Free Supabase projects pause after a week without traffic, so open the dashboard before
a demo.

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
