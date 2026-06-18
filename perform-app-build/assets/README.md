# App icon & splash source images

`@capacitor/assets` reads the PNGs in **this folder** and generates every iOS
icon and splash size into the native `ios/` project automatically when you run
`npm run assets:generate` (on the Mac, after `npm install`).

## Files

| File | Size | Status |
| --- | --- | --- |
| `icon.png` | **1024 × 1024** | ✅ **Provided** — the BodyTracker emblem on a solid white background (no alpha, App-Store-safe). Replace it if you want a different icon; keep it 1024×1024 with no transparency. |
| `splash.png` | **2732 × 2732** | ⬜ **Optional.** A launch image. If you don't add one, iOS shows a solid `#080b12` launch screen (configured in `capacitor.config.ts`), which is fine. To brand it, drop a 2732×2732 PNG with the logo centered in the middle ~⅓ (edges get cropped per device). |
| `splash-dark.png` | 2732 × 2732 | ⬜ Optional dark-appearance splash. Falls back to `splash.png`. |

## Steps (Mac)

```bash
npm install
npm run assets:generate   # = capacitor-assets generate --ios
npx cap sync ios
```

That's it — the generated icons/splash are committed into `ios/` and show up in
Xcode's asset catalog.

> The BodyTracker logo used in the web app lives at `public/` (see `components/ui/Logo`).
> You can export a 1024×1024 version of it as `icon.png` here. Make sure it has a
> solid background (no alpha) before generating.
