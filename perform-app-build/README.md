# PERFORM

A personal performance-tracking dashboard. Dark, sleek, mobile-friendly. Tracks nutrition & macros, compound protocols with dose countdowns, workouts & lift progression, body weight, and steps.

**→ New here? Open [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) for plain-English, step-by-step setup.**

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** (Postgres, Auth, Row Level Security)
- **Tailwind CSS** for the dark theme
- **TanStack Query** for data fetching/caching
- **Chart.js** for the weight trend chart
- Deployed on **Vercel**

## Features

| Module | What it does |
|--------|--------------|
| Dashboard | Today's macros, 7-day calorie chart, active protocols with urgent-dose alerts, recent weight |
| Nutrition | Search a food catalog or enter macros manually, log per meal, daily macro rings |
| Compounds | Build multi-compound protocols/cycles, live "next dose" countdowns color-coded by urgency, dose logging with injection site |
| Workouts | Log sessions, auto-tracks lift progression & PRs per exercise |
| Body Weight | Log + trend chart + stats |
| Steps | Manual entry now; auto Apple Health sync arrives with the iOS app |
| Catalogs | Manage your food, compound, and exercise libraries (pre-seeded with starters) |

## Local development (optional — not required to use the app)

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Then open http://localhost:3000

## Project structure

```
app/
  (app)/            authenticated pages (dashboard, nutrition, compounds, ...)
  auth/             login + email callback
components/         UI, charts, nutrition widgets, nav
hooks/              all Supabase queries (useNutrition, useCompounds, useTraining)
lib/                supabase clients + helpers
types/              TypeScript types matching the DB
supabase/
  migrations/       001_initial_schema.sql  ← run this in Supabase
```

## The iOS phase

The database is already built for it (`step_logs.source` distinguishes `apple_health` vs `manual`). The native app will be Expo/React Native sharing this same Supabase backend + HealthKit for steps. See the end of `SETUP_GUIDE.md`.
