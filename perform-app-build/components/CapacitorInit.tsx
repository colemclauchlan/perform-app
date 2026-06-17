"use client";

import { useEffect } from "react";

/**
 * Native-shell bootstrap. No-op on the web (Capacitor.isNativePlatform() is
 * false in a browser), so the same component is safe to mount everywhere.
 * On iOS it: hides the launch splash once React has painted, styles the status
 * bar to match the dark theme, and switches the keyboard to native resize so
 * inputs are never covered. Imports are dynamic so the web bundle never pulls
 * in native code.
 */
export function CapacitorInit() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (cancelled || !Capacitor.isNativePlatform()) return;

        const [{ StatusBar, Style }, { SplashScreen }, { Keyboard, KeyboardResize }] =
          await Promise.all([
            import("@capacitor/status-bar"),
            import("@capacitor/splash-screen"),
            import("@capacitor/keyboard"),
          ]);

        await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        await Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(
          () => {}
        );
        // Give the WebView a beat to paint before removing the splash.
        setTimeout(() => SplashScreen.hide().catch(() => {}), 250);
      } catch {
        /* native plugins absent on web — ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
