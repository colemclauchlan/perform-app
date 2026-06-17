# BodyTracker

A cross-platform performance-tracking platform — **one codebase, one backend, web + iOS**. Track nutrition & macros, workouts & lift progression, body metrics, bloodwork, steps/hydration/sleep, and compound protocols with dose tracking. Secure accounts, cloud sync, and per-user data isolation.

> New here? `SETUP_GUIDE.md` is the plain-English walkthrough. This README is the technical reference.

## Architecture

```
┌──────────────┐        ┌──────────────┐
│   Web app    │        │   iOS app    │
│ Next.js 14   │        │  Capacitor   │
│ (Vercel)     │        │  WebView     │
└──────┬───────┘        └──────┬───────┘
       │   same code, same URL │
       └───────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │      Supabase        │
        │  Postgres + Auth +   │
        │  Row Level Security  │
        │  + Storage           │
        └──────────────────────┘
```

**Why Capacitor instead of a React Native rewrite?** This is already a polished, server-rendered Next.js app. Capacitor wraps the *exact* deployed web app in a native iOS shell, so:

- Web and iOS run **identical code** → zero UI divergence, one place to ship features.
- Both talk to the **same Supabase backend** → accounts and data sync automatically.
- It's genuinely **App Store-submittable** (signed native binary via Xcode).

A React Native/Expo rewrite would duplicate every screen and split the codebase in two — the opposite of the "consistent UI / shared data" goal.

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 14 (App Router) + TypeScript + Tailwind |
| iOS | Capacitor 6 (native shell over the deployed web app) |
| Backend / DB | Supabase — Postgres, Auth, Row Level Security, Storage |
| Data layer | TanStack Query (cache + optimistic invalidation) |
| Charts | Chart.js + react-chartjs-2 |
| Hosting | Vercel (web) · App Store (iOS) |

## Quick start (web)

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase URL + anon key
npm run dev                         # http://localhost:3000
```

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, plus `ios:add` / `ios:sync` / `ios:open` (see `docs/IOS_BUILD.md`).

## Environment variables

See `.env.local.example` for the full annotated list. Summary:

| Var | Scope | Required | Purpose |
|-----|-------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | yes | Public anon key (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | for account deletion | Admin key — never exposed to client |
| `ANTHROPIC_API_KEY` | server only | optional | AI Coach / reviews (else graceful 503) |
| `COACH_MODEL` | server only | optional | Override default model |
| `NEXT_PUBLIC_SITE_URL` | client | recommended | Canonical URL for SEO + auth redirects |
| `CAP_SERVER_URL` | build | iOS only | URL the native shell loads |

## Security model

- **Auth:** Supabase Auth (email/password, email verification, password reset). Sessions are cookie-backed via `@supabase/ssr` and persist across reloads on web and in the iOS WebView.
- **Route protection:** `middleware.ts` redirects unauthenticated users to `/auth/login` and gates every non-public route.
- **Data isolation:** every user-owned table has Row Level Security `auth.uid() = user_id`. A user can only read/write their own rows — enforced in the database, not just the UI.
- **Server-side validation:** API routes (`app/api/*`) re-check `auth.getUser()` and validate inputs before acting.
- **Secrets:** the service-role key and Anthropic key are server-only and never shipped to the client.
- **Account deletion:** `/api/account/delete` (required by Apple) removes the auth user; `ON DELETE CASCADE` clears all their data.

## Project structure

```
app/
  (app)/            authenticated pages (dashboard, nutrition, workouts, compounds, settings, ...)
  auth/             login, signup, forgot-password, reset-password, verify-email, callback
  api/              server routes (coach, nutrition-review, compound-info, account/delete)
  layout.tsx        root metadata / SEO
components/          UI primitives, charts, nav (Sidebar, MobileNav), feature widgets
hooks/              all Supabase queries (useNutrition, useCompounds, useTraining, ...)
lib/                supabase clients (server/browser) + shared utils
types/              TypeScript types mirroring the DB schema
supabase/migrations/ SQL schema + seeds
capacitor.config.ts iOS shell config
docs/               MIGRATION_PLAN.md, IOS_BUILD.md
```

## Deploy (web)

1. Push to GitHub; import the repo in Vercel.
2. Set all env vars (above) in Vercel → Settings → Environment Variables.
3. In Supabase → Auth → URL Configuration, add your Vercel domain + `…/auth/callback` to the allowed redirect URLs.
4. Deploy. Vercel runs `next build` automatically on every push to `main`.

## Build for iOS

See **`docs/IOS_BUILD.md`** for the full Xcode / TestFlight / App Store workflow.

## Data model

Users (`auth.users`) → `profiles` (1:1, preferences JSONB) → owned logs: `food_log`, `food_catalog`, `workout_sessions` / `workout_sets`, `compound_protocols` / `protocol_compounds` / `dose_logs`, `body_weight_logs`, `body_measurements`, `bloodwork`, `step_logs`, `hydration_logs`, `sleep_logs`, meal plans, check-ins. Every table carries `user_id`, timestamps, and an RLS ownership policy. See `supabase/migrations/`.
