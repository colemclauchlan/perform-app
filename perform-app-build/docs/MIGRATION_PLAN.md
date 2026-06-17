# Migration & production-readiness plan

This documents the path from the current app to a production-ready, cross-platform (web + iOS) launch, and the state of each item. The app was **already cloud-backed** (Supabase Postgres + Auth + RLS), so the work is completion and hardening, not a rebuild.

## 1. Current-state audit

| Concern | Finding |
|---------|---------|
| Data storage | All user data already lives in Supabase Postgres (not localStorage/hardcoded). |
| Per-user isolation | Row Level Security `auth.uid() = user_id` on every owned table. |
| Auth | Supabase Auth, cookie sessions via `@supabase/ssr`, middleware route-gating. |
| Server validation | API routes re-check `auth.getUser()` and validate inputs. |
| Hosting | Web deployed on Vercel; CI build on push. |
| Local/hardcoded state | Only UI preferences (tab order, dashboard layout, custom categories) — and those are already persisted to `profiles.preferences` (JSONB), not the device. |

**Conclusion:** no data migration off the device is required; the model is already cloud-first. Remaining gaps were auth completeness, account management, iOS packaging, and docs/config.

## 2. What was completed in this pass

- **Auth flows:** added forgot-password, reset-password, and verify-email pages; callback now handles recovery links and errors; middleware exempts the reset route so recovery sessions can set a password.
- **Account management:** Settings → Account & Security (change password, sign out, **delete account**). Delete uses a server-only admin route (`/api/account/delete`) — required by Apple.
- **iOS packaging:** `capacitor.config.ts` + scripts (`ios:add/sync/open`) + `docs/IOS_BUILD.md`. Native shell loads the deployed web app for guaranteed parity.
- **Production hardening:** security headers (`next.config.mjs`), SEO/OpenGraph metadata, `.env.local.example`, `typecheck` script.
- **Docs:** rewritten README (architecture, security model, deploy), this plan, and the iOS guide.

## 3. Data model (cloud, per-user)

```
auth.users (Supabase-managed)
└─ profiles (1:1, preferences JSONB: targets, units, tab_order,
              dashboard_widgets, custom_food_categories, favorite_compounds, ...)
   ├─ food_log, food_catalog
   ├─ workout_sessions ─ workout_sets
   ├─ compound_protocols ─ protocol_compounds ─ dose_logs
   ├─ body_weight_logs, body_measurements
   ├─ bloodwork (+ custom markers in preferences)
   ├─ step_logs (source: manual | apple_health)
   ├─ hydration_logs, sleep_logs
   ├─ meal_plans (+ items)
   └─ check-ins (photos in private Storage bucket, per-user folder RLS)
```

Every table: `id`, `user_id` (FK → auth.users, **ON DELETE CASCADE**), `created_at`, and an RLS policy `auth.uid() = user_id`.

## 4. Verification checklist

- [ ] **RLS:** run Supabase Advisors (Security) — confirm no tables with RLS disabled. As a spot check, a second account must see zero rows from the first.
- [ ] **Auth round-trips:** signup→verify→login, forgot→reset, logout, delete account.
- [ ] **Sync:** create a row on web → appears in the iOS shell after refresh (same backend).
- [ ] **Protected routes:** logged-out access to `/dashboard` redirects to `/auth/login`.
- [ ] **Secrets:** confirm `SUPABASE_SERVICE_ROLE_KEY` / `ANTHROPIC_API_KEY` are NOT `NEXT_PUBLIC_` and never appear in the client bundle.
- [ ] **Build:** `npm run build` and `npm run typecheck` pass (Vercel runs build on push).

## 5. Known follow-ups (owner action)

- Add a **/privacy** page (required URL for the App Store) and a short privacy policy.
- Set `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` in Vercel; add the Vercel domain + `/auth/callback` to Supabase Auth redirect allow-list.
- Optional: HealthKit step sync for the iOS app (requires Info.plist usage strings + capability).
- Optional offline resilience: TanStack Query already caches; for stricter offline, add a persisted query cache.
