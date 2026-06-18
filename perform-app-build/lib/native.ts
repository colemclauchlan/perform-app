"use client";

// Thin, web-safe wrappers around Capacitor. Every function checks the native
// platform first and dynamically imports the plugin, so importing this module
// in a browser/SSR context pulls in nothing native and never throws.

let _isNative: boolean | null = null;

export async function isNative(): Promise<boolean> {
  if (_isNative !== null) return _isNative;
  try {
    const { Capacitor } = await import("@capacitor/core");
    _isNative = Capacitor.isNativePlatform();
  } catch {
    _isNative = false;
  }
  return _isNative;
}

// ── Haptics ────────────────────────────────────────────────────────────────
type Impact = "light" | "medium" | "heavy";

export async function haptic(style: Impact = "light"): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch {
    /* no-op */
  }
}

export async function hapticSuccess(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* no-op */
  }
}

// ── Network ──────────────────────────────────────────────────────────────────
// Subscribe to connectivity changes. Returns an unsubscribe function. On web it
// falls back to the browser online/offline events.
export async function onNetworkChange(
  cb: (online: boolean) => void
): Promise<() => void> {
  if (await isNative()) {
    try {
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();
      cb(status.connected);
      const handle = await Network.addListener("networkStatusChange", (s) =>
        cb(s.connected)
      );
      return () => handle.remove();
    } catch {
      return () => {};
    }
  }
  // Web fallback
  const on = () => cb(true);
  const off = () => cb(false);
  cb(typeof navigator === "undefined" ? true : navigator.onLine);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  return () => {
    window.removeEventListener("online", on);
    window.removeEventListener("offline", off);
  };
}
