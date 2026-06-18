# App Store Connect — copy-paste listing

Everything to paste into App Store Connect when creating the app record and the
first version. Replace the two placeholders before submitting:

- `YOUR_DOMAIN` → your production URL (e.g. `https://your-app.vercel.app`)
- `support@bodytracker.app` → your real support email (also update it in
  `app/privacy/page.tsx`, `app/terms/page.tsx`, and `app/support/page.tsx`)

---

## App information

- **Name:** BodyTracker
- **Subtitle (30 chars max):** Physique, nutrition & training
- **Primary category:** Health & Fitness
- **Secondary category (optional):** Lifestyle
- **Bundle ID:** `com.bodytracker.app` (matches `capacitor.config.ts`; change both
  if you use your own)

## URLs

- **Privacy Policy URL:** `YOUR_DOMAIN/privacy`
- **Support URL:** `YOUR_DOMAIN/support`
- **Marketing URL (optional):** `YOUR_DOMAIN`

---

## Promotional text (170 chars max)

> Your whole physique in one dashboard — nutrition, training, body metrics,
> bloodwork, and protocols — with an AI coach that reads your data.

## Description

> BodyTracker brings every metric that moves your physique into a single
> performance dashboard.
>
> NUTRITION & MACROS
> Log food against calorie and macro targets with a searchable catalog, custom
> foods, per-meal breakdowns, and saved meal plans.
>
> TRAINING & PROGRESSION
> Build workouts, track every set, and watch estimated 1RM and weekly tonnage
> trend over time. Pre-saved programs, exercise catalog, and rest timer included.
>
> BODY METRICS
> Bodyweight, measurements, body-fat, sleep, hydration, steps, and check-in
> photos — all charted so you see trends, not just numbers.
>
> BLOODWORK
> Record lab markers with custom panels and spot trends in your hormones,
> lipids, and organ health.
>
> COMPOUND PROTOCOLS
> Plan and log peptide and supplement protocols with dosing schedules, half-life
> math, and a dose calculator.
>
> AI COACH
> An IFBB-level coach that reads your tracked data and gives direct, actionable
> training, nutrition, and recovery guidance.
>
> APPLE HEALTH
> Sync steps, body weight, and sleep automatically. Optional Face ID app lock
> keeps your data private.
>
> Your data is yours — isolated to your account and deletable in-app at any time.
>
> BodyTracker is a tracking tool, not medical advice. Always consult a qualified
> healthcare professional before making health, medication, or supplement
> decisions.

## Keywords (100 chars max, comma-separated, no spaces)

> fitness,macro,nutrition,workout,bodybuilding,gym,bloodwork,physique,tracker,protein,lifting,health

## What's New (version notes for 1.0)

> First release of BodyTracker. Track nutrition, training, body metrics,
> bloodwork, and protocols with an AI coach and Apple Health sync.

---

## App Privacy questionnaire (Data collected)

Declare these data types, all **linked to the user's identity** and used for
**App Functionality** only. **Not** used for tracking/advertising. **Not** sold.

| Data type | Collected | Linked | Purpose |
| --- | --- | --- | --- |
| Email address | Yes | Yes | App Functionality (account) |
| Health & Fitness | Yes | Yes | App Functionality |
| Other user content (notes, photos) | Yes | Yes | App Functionality |
| Sensitive info (the app stores compound/medication logs the user enters) | Yes | Yes | App Functionality |

- **Do you use data to track users?** No.
- **Third parties:** Supabase (storage/auth), Vercel (hosting), Anthropic (AI
  features, only when used). None receive data for advertising.

---

## Age rating

Complete the questionnaire honestly. Because the app lets users log and read
information about compounds / performance-enhancing drugs, expect:

- **Drugs / alcohol / tobacco references:** Infrequent/Mild (informational
  tracking, no encouragement of illegal use).
- **Medical/Treatment information:** Yes.
- **Result:** likely **17+**. That's expected and fine.

---

## Account deletion

- Toggle **"This app offers account deletion": Yes.**
- Location for reviewers: **Settings → Account & Security → Delete account.**
- It calls a server endpoint that removes the auth user; all rows cascade-delete.

---

## App Review notes (paste into "Notes" for the reviewer)

> BodyTracker is a personal health/fitness tracker. An account is required
> because all data is private and synced to the user's account.
>
> Demo account for review:
>   Email: REVIEW_EMAIL_HERE
>   Password: REVIEW_PASSWORD_HERE
>
> The app includes a tracking feature for compounds/supplements (including
> performance-enhancing drugs). This is an informational self-logging tool only;
> the app does not sell, provide, or encourage the illegal use of any substance,
> and shows a medical disclaimer (see Terms and Privacy pages). AI features are
> informational and include the same disclaimer.
>
> Apple Health is used (read-only) to sync steps, body weight, and sleep with
> the user's permission. Face ID is used only to optionally lock the app locally.
>
> Account deletion: Settings → Account & Security → Delete account.

> **Before submitting:** create a real throwaway account on the live web app and
> put its credentials in the demo-account lines above. Reviewers will use it.

---

## Screenshots needed

Capture from a simulator or device (Xcode: Simulator → File → Save Screen, or
⌘S). Required sizes:

- **6.7"** (iPhone 15/16 Pro Max) — required
- **6.5"** (iPhone 11 Pro Max / XS Max) — required if you don't supply 6.9"
- (optional) 5.5" for older devices

Good screens to capture: Health Dashboard, Nutrition, a Workout, Body metrics
charts, the AI Coach chat, and Compounds. Aim for 3–6 per size.
