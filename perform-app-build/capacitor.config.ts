import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wraps the deployed Next.js web app in a native iOS (and Android)
 * shell. Because this is a server-rendered Next.js app (middleware, server
 * routes, SSR), the native shell loads the LIVE deployed URL rather than a
 * static export — this guarantees web and iOS always run identical code and
 * stay in sync automatically (same Supabase backend, same auth, same data).
 *
 * Build steps live in docs/IOS_BUILD.md.
 */
const config: CapacitorConfig = {
  appId: "com.bodytracker.app",
  appName: "BodyTracker",
  // webDir is required by the CLI even when using a remote server URL.
  webDir: "public",
  server: {
    // Point at your production web app. Override per-environment with CAP_SERVER_URL.
    url: process.env.CAP_SERVER_URL || "https://YOUR-DEPLOYMENT.vercel.app",
    // Never load over plaintext http in production.
    cleartext: false,
  },
  ios: {
    // Respect the notch / home indicator; pages already use env(safe-area-inset-*).
    contentInset: "always",
    backgroundColor: "#0e1623",
    // Prevent the rubber-band overscroll from revealing a white background.
    scrollEnabled: true,
    // Render at phone width (no desktop user-agent / layout in the WebView).
    preferredContentMode: "mobile",
  },
  backgroundColor: "#0e1623",
  plugins: {
    SplashScreen: {
      // We hide it from CapacitorInit once React paints, so it never flashes
      // a blank frame between the launch image and the app.
      launchAutoHide: false,
      backgroundColor: "#0e1623",
      showSpinner: false,
    },
    Keyboard: {
      // Resize the WebView (not the body) so fixed bottom nav and inputs behave.
      resize: "native",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
