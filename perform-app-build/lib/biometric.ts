"use client";

import { isNative } from "@/lib/native";

// Face ID / Touch ID wrapper. All calls are native-guarded and import the
// plugin dynamically, so this is inert (and import-safe) on the web.

export type BiometryInfo = {
  available: boolean;
  // "faceId" | "touchId" | "none"
  type: "faceId" | "touchId" | "biometric" | "none";
};

export async function getBiometryInfo(): Promise<BiometryInfo> {
  if (!(await isNative())) return { available: false, type: "none" };
  try {
    const { BiometricAuth, BiometryType } = await import(
      "@aparajita/capacitor-biometric-auth"
    );
    const res = await BiometricAuth.checkBiometry();
    if (!res.isAvailable) return { available: false, type: "none" };
    const t =
      res.biometryType === BiometryType.faceId
        ? "faceId"
        : res.biometryType === BiometryType.touchId
        ? "touchId"
        : "biometric";
    return { available: true, type: t };
  } catch {
    return { available: false, type: "none" };
  }
}

// Returns true if the user successfully authenticated (or biometrics aren't
// applicable, e.g. on web — so callers don't get locked out off-device).
export async function verifyIdentity(
  reason = "Unlock BodyTracker"
): Promise<boolean> {
  if (!(await isNative())) return true;
  try {
    const { BiometricAuth } = await import(
      "@aparajita/capacitor-biometric-auth"
    );
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: "Cancel",
      allowDeviceCredential: true,
      iosFallbackTitle: "Use passcode",
    });
    return true;
  } catch {
    return false;
  }
}

// ── Per-device preference (a device lock belongs on the device, not the cloud)
const KEY = "bt_biometric_lock";

export function isLockEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function setLockEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(KEY, "1");
  else window.localStorage.removeItem(KEY);
}
