# Launch checklist — everything YOU do manually

This is the single, ordered list of every manual step to take BodyTracker from
the current code to live on the web and submitted to the App Store. The code
side is done; these are the steps that need your accounts, a Mac, and Apple.

Work top to bottom. Check each box as you go. Anything marked **(one-time)** you
never repeat; **(per release)** repeats on each App Store submission.

---

## Phase 0 — Accounts you need (one-time)

- [ ] **Supabase** account + the existing "BodyTrack" project (already set up).
- [ ] **Vercel** account with this repo imported (already deploying on push).
- [ ] **Anthropic** account for the AI Coach — https://console.anthropic.com
- [ ] **Apple Developer Program** — https://developer.apple.com/programs ($99/yr).
      Enrollment can take 24–48h, so start it now.
- [ ] A **Mac with Xcode** (latest) installed from the Mac App Store. iOS apps
      can ONLY be built/submitted from a Mac. (Windows can't do this step.)

---

## Phase 1 — Web app environment (Vercel)

Set these in **Vercel → your project → Settings → Environment Variables**
(Production + Preview). Values come from **Supabase → Project Settings → API**.

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = your project URL (e.g. `https://zttpnkxcaddhtbugahuh.supabase.co`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the **anon / public** key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = the **service_role** key — *secret*. Required
      for **account deletion** (Apple requires in-app deletion). Without it the
      delete endpoint returns 503.
- [ ] `NEXT_PUBLIC_SITE_URL` = your production URL (e.g. `https://your-app.vercel.app`).
      Used for SEO + auth redirect links.
- [ ] (AI Coach — see Phase 4) `ANTHROPIC_API_KEY`
- [ ] (optional) `COACH_MODEL` = override the default model
- [ ] Click **Redeploy** after adding/changing any variable (env changes don't
      apply until the next deploy).

> Never prefix secrets with `NEXT_PUBLIC_`. The service-role and Anthropic keys
> must stay server-only — they already are in the code; just don't rename them.

---

## Phase 2 — Supabase Auth configuration

In **Supabase → Authentication**:

- [ ] **URL Configuration → Site URL**: set to your production URL.
- [ ] **URL Configuration → Redirect URLs**: add BOTH:
  - `https://your-app.vercel.app/auth/callback`
  - `https://your-app.vercel.app/auth/reset-password`
- [ ] **Providers → Email**: keep **Confirm email** ON (so signup verification
      works) and **Secure email change** ON (so changing email confirms on both
      old and new addresses — the Settings → Account flow relies on this).
- [ ] (optional) **Email Templates**: rebrand the confirmation / recovery /
      email-change templates with your app name and logo.
- [ ] **Sanity test on the live web app:**
  - [ ] Sign up → receive verification email → confirm → land on dashboard
  - [ ] Log out → log back in
  - [ ] Forgot password → reset link → set new password → log in
  - [ ] Settings → change email → confirm via both inboxes
  - [ ] Settings → change password
  - [ ] Settings → delete account (use a throwaway account) → data is gone

---

## Phase 3 — Legal pages (App Store requirement) — DONE in code

Apple **rejects** apps with accounts but no privacy policy URL. These pages are
already built and public (no login required):

- `YOUR_DOMAIN/privacy` — Privacy Policy (data collected, Supabase storage,
  in-app account deletion, AI data use, medical disclaimer, contact)
- `YOUR_DOMAIN/terms` — Terms of Service (medical/PED disclaimer, 17+)
- `YOUR_DOMAIN/support` — Support page + FAQ (use as your App Store Support URL)

The only thing left for you:

- [ ] **Set your real support email.** It's currently `support@bodytracker.app`
      in three files — replace it in `app/privacy/page.tsx`,
      `app/terms/page.tsx`, and `app/support/page.tsx`, then push.
- [ ] Note the URLs above — you paste `/privacy` and `/support` into App Store
      Connect (Phase 7). The exact copy-paste fields are in
      `docs/APP_STORE_LISTING.md`.

---

## Phase 4 — Turn on the AI Coach

- [ ] Go to https://console.anthropic.com → **API Keys** → **Create Key**.
- [ ] Copy the key (starts with `sk-ant-...`). You only see it once.
- [ ] Vercel → Settings → Environment Variables → add `ANTHROPIC_API_KEY` = that key.
- [ ] (optional) Add `COACH_MODEL` to pin a model; otherwise the app uses its
      sensible default.
- [ ] **Redeploy.**
- [ ] Verify: open **Coach** in the live app and send a message — you should get
      a data-aware reply. Also check the **Sparkles** AI buttons on Compounds
      and Meal Plans. (Without the key these features return a graceful 503,
      not a crash.)

---

## Phase 5 — Point the iOS shell at your live web app

On the Mac, in the project folder:

- [ ] Either edit `capacitor.config.ts` → `server.url` to your production URL,
      **or** export it before syncing:
      ```bash
      export CAP_SERVER_URL="https://your-app.vercel.app"
      ```
  The native app loads your live site, so future web deploys ship instantly to
  iPhone with no new binary (you only re-submit when native config changes).

---

## Phase 6 — Build the iOS app (Mac + Xcode)

```bash
# in the project folder on your Mac
npm install                        # installs Capacitor + plugins (incl. @capacitor/assets)
sudo gem install cocoapods         # one-time, if not installed
npx cap add ios                    # creates the ios/ Xcode project (one-time)

# App icon is already provided at assets/icon.png (1024x1024 BodyTracker emblem).
# Splash is optional — see assets/README.md to add assets/splash.png if you want
# a branded launch image (otherwise a solid #080b12 screen is used).
npm run assets:generate            # = capacitor-assets generate --ios

npx cap sync ios                   # copies config + plugins into the native project
npx cap open ios                   # opens ios/App/App.xcworkspace in Xcode
```

In **Xcode**:

- [ ] Select the **App** target → **Signing & Capabilities** → choose your Team
      (enables automatic signing).
- [ ] Set the **Bundle Identifier** to your own, e.g. `com.yourname.bodytracker`,
      and mirror it in `capacitor.config.ts` (`appId`) if you change it.
- [ ] Confirm the **app icon** shows in the asset catalog (from the generate step).

#### Enable native capabilities (required for Apple Health + Face ID)

These features are already coded; they just need the iOS capability and the
usage strings Apple requires, which live in the native project.

- [ ] **Signing & Capabilities → + Capability → HealthKit.** (Leave "Clinical
      Health Records" off.)
- [ ] Open `ios/App/App/Info.plist` and add these keys (Xcode: right-click →
      Open As → Source Code, or use the property list editor):
  - `NSHealthShareUsageDescription` → "BodyTracker reads your steps, body weight, and sleep from Apple Health so your dashboard stays in sync."
  - `NSHealthUpdateUsageDescription` → "BodyTracker can write workouts and metrics you log back to Apple Health." *(safe to include even though the app currently only reads)*
  - `NSFaceIDUsageDescription` → "BodyTracker uses Face ID to lock the app so only you can open it."
- [ ] Re-run `npx cap sync ios` after `npm install` so the Health, biometric,
      haptics, app, and network plugins are linked.

- [ ] Pick an iPhone simulator or a connected device → **Run (▶)**.
      *(Apple Health + Face ID need a real device or a simulator with biometrics
      enrolled — Simulator → Features → Face ID → Enrolled.)*
- [ ] **On-device smoke test:**
  - [ ] Sign up / log in / log out work
  - [ ] Forgot + reset password work
  - [ ] Change email + change password work
  - [ ] Nothing is hidden behind the notch or home indicator (safe areas)
  - [ ] Tapping an input does NOT zoom the screen; keyboard doesn't cover the field
  - [ ] Data entered on web shows up in the app after refresh (same backend)
  - [ ] **Settings → Apple Health → Sync** imports steps/weight/sleep (grant the
        Health permission prompt first)
  - [ ] **Settings → App Lock → Enable Face ID** — background the app and reopen;
        it should require Face ID
  - [ ] Delete account logs out and removes data

---

## Phase 7 — App Store Connect (per release)

In **https://appstoreconnect.apple.com**: all the text fields below (name,
subtitle, description, keywords, privacy answers, age-rating guidance, reviewer
notes) are pre-written for copy-paste in **`docs/APP_STORE_LISTING.md`**.

- [ ] **My Apps → +** → create the app record (matching Bundle ID, name
      "BodyTracker", primary language, Health & Fitness category).
- [ ] **Privacy Policy URL**: paste the URL from Phase 3.
- [ ] **App Privacy questionnaire**: declare data collected — at minimum
      **Email Address** (account) and the **Health & Fitness** data users log.
      Mark it linked to the user's identity, used for app functionality.
- [ ] **Age rating**: complete the questionnaire. This app discusses
      PED/compound dosing → expect a **17+** rating.
- [ ] **Account deletion**: confirm "offers account deletion" — it's built in at
      Settings → Account & Security → Delete account.
- [ ] **Screenshots**: capture required iPhone sizes (6.7" and 6.5" at least)
      from the simulator/device.
- [ ] **Description, keywords, support URL, marketing fields**: fill in.

### Upload the build

```bash
# In Xcode: Product → Archive → Distribute App → App Store Connect → Upload
```

- [ ] Archive uploads and finishes processing (a few minutes).
- [ ] **TestFlight**: add yourself/testers, install via the TestFlight app, and
      do the on-device test list again on the real binary.
- [ ] Attach the build to the app version → **Submit for Review**.

---

## Phase 8 — After approval / ongoing

- [ ] **Web changes ship instantly**: push to `main` → Vercel deploys → the iOS
      app (which loads your URL) updates on next launch. No resubmission needed.
- [ ] **Resubmit to the App Store only** when you change native config: app icon,
      splash, bundle ID, Capacitor/plugins, or add a capability (e.g. HealthKit).

---

## Optional later

- [ ] **Write back to Apple Health**: the app currently reads from Health. To
      also push logged workouts/weight into Health, extend `lib/health.ts` with
      the plugin's write API (the `NSHealthUpdateUsageDescription` string is
      already in place from Phase 6).
- [ ] **Local notifications / reminders** (dose reminders, "log your day"): add
      `@capacitor/local-notifications`, request permission, and schedule from a
      reminders settings screen.
- [ ] **Stricter offline mode**: TanStack Query already caches in memory; add a
      persisted query cache if you want full offline reads.

---

### Quick reference — what's already done in code

Auth (signup/verify/login/logout/forgot/reset, **change email**, **change
password**), in-app **account deletion**, Supabase + RLS per-user isolation,
server-validated API routes, security headers + SEO metadata, Capacitor iOS
shell with status-bar / splash / keyboard handling, safe-area padding,
no-zoom 16px inputs, native tap feel, self-hosted fonts, **Apple Health sync
(steps / weight / sleep)**, **Face ID / Touch ID app lock**, **haptics**, and an
**offline banner**. You only need the account/config/Apple steps above (incl.
the HealthKit capability + Info.plist usage strings in Phase 6).
