"use client";

import { useEffect, useState, useCallback } from "react";
import { isNative } from "@/lib/native";
import { isLockEnabled, verifyIdentity } from "@/lib/biometric";
import { Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

// Full-screen biometric gate. When the per-device Face ID lock is on, the app
// is covered on launch and whenever it returns to the foreground until the user
// authenticates. Entirely inert on web (isNative() === false).
export function AppLock() {
  const [active, setActive] = useState(false); // lock feature engaged this session
  const [locked, setLocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const unlock = useCallback(async () => {
    setVerifying(true);
    const ok = await verifyIdentity("Unlock BodyTracker");
    setVerifying(false);
    if (ok) setLocked(false);
  }, []);

  useEffect(() => {
    let removeListener: (() => void) | undefined;
    (async () => {
      if (!(await isNative()) || !isLockEnabled()) return;
      setActive(true);
      setLocked(true); // the effect below fires the prompt once

      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          // Re-lock every time the app is backgrounded.
          if (!isActive && isLockEnabled()) setLocked(true);
        });
        removeListener = () => handle.remove();
      } catch {
        /* @capacitor/app absent — launch-time lock still works */
      }
    })();
    return () => removeListener?.();
  }, [unlock]);

  // Trigger the prompt automatically when we transition into the locked state.
  useEffect(() => {
    if (active && locked && !verifying) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  if (!active || !locked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-0 px-6 text-center">
      <Logo variant="icon" size={72} className="rounded-2xl mb-6 animate-pulse-glow" />
      <Lock size={20} className="text-text-3 mb-2" />
      <p className="text-sm text-text-2 mb-6">BodyTracker is locked</p>
      <button
        className="btn btn-primary"
        onClick={unlock}
        disabled={verifying}
      >
        {verifying ? "Verifying…" : "Unlock"}
      </button>
    </div>
  );
}
