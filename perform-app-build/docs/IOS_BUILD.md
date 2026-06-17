# Building & shipping the iOS app

The iOS app is the Next.js web app wrapped in a **Capacitor** native shell. You build it on a **Mac with Xcode**. Web and iOS share one codebase and one Supabase backend, so accounts and data sync automatically.

## Prerequisites

- macOS + **Xcode** (latest) and Command Line Tools
- **CocoaPods**: `sudo gem install cocoapods`
- **Node 18+**
- An **Apple Developer account** ($99/yr) for TestFlight / App Store
- The web app deployed (e.g. on Vercel) — the shell loads that URL

## One-time setup

```bash
# 1. Install deps (adds Capacitor)
npm install

# 2. Point the native shell at your deployed web app
#    Edit capacitor.config.ts -> server.url, or set:
export CAP_SERVER_URL="https://your-app.vercel.app"

# 3. Add the iOS platform (creates the /ios Xcode project)
npm run ios:add

# 4. Sync config + plugins into the native project
npm run ios:sync
```

## Open & run

```bash
npm run ios:open        # opens ios/App/App.xcworkspace in Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities** → choose your Team (enables automatic signing).
2. Set the **Bundle Identifier** to your own (e.g. `com.yourname.bodytracker`) and mirror it in `capacitor.config.ts` (`appId`).
3. Pick a simulator or a connected device → **Run** (▶).

## App icon & splash screen

- **Icon:** drop a 1024×1024 PNG (no alpha) into `ios/App/App/Assets.xcassets/AppIcon.appiconset` (use Xcode's single-size slot, or a generator like `@capacitor/assets`). Source art lives in `public/icon-512.png` / `public/bodytracker-icon.png`.
- **Splash:** background color is set to `#080b12` in `capacitor.config.ts`. For a logo splash, add `@capacitor/splash-screen` assets via `npx capacitor-assets generate --ios`.
- **Status bar:** the app already uses `black-translucent` + `env(safe-area-inset-*)` padding so content respects the notch and home indicator.

## App Store metadata (placeholders to fill in App Store Connect)

| Field | Placeholder |
|-------|-------------|
| App name | BodyTracker |
| Subtitle | Nutrition, training & body metrics |
| Bundle ID | com.yourname.bodytracker |
| Category | Health & Fitness |
| Privacy policy URL | https://your-app.vercel.app/privacy *(add a page)* |
| Support URL | https://your-app.vercel.app |
| Age rating | Complete the questionnaire (this app discusses PED/compound dosing → likely 17+) |

> **Account deletion (required):** Apple requires apps with account creation to offer in-app deletion. It's implemented at **Settings → Account & Security → Delete account** (`/api/account/delete`). Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in production or deletion returns a 503.

> **Health data:** if/when you add HealthKit (e.g. step sync), add the `NSHealthShareUsageDescription` key to `Info.plist` and the HealthKit capability, and complete the Health-data disclosures.

## TestFlight & submission

```bash
# In Xcode: Product → Archive → Distribute App → App Store Connect → Upload
```

1. Create the app record in **App Store Connect** (matching bundle ID).
2. Upload the archive; wait for processing.
3. Add testers in **TestFlight**, install via the TestFlight app, verify login/sync on device.
4. Fill in metadata, screenshots, privacy questionnaire → **Submit for Review**.

## Updating the app

Because the shell loads your live URL, **most updates ship instantly via a Vercel deploy** — no new binary needed. You only re-submit to the App Store when you change native config (icons, plugins, capabilities, bundle ID) or Capacitor itself.

## Testing checklist (device)

- [ ] Sign up → receive verification email → confirm → log in
- [ ] Forgot password → reset link → set new password → log in
- [ ] Data entered on web appears on device after refresh (and vice-versa)
- [ ] Logged-out users cannot reach protected pages
- [ ] Safe areas: nothing hidden behind notch / home indicator
- [ ] Touch targets and forms feel native; keyboard doesn't cover inputs
- [ ] Delete account removes data and logs out
