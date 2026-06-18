"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { onNetworkChange } from "@/lib/native";

// Slim banner shown when connectivity drops. Works in the iOS shell (Capacitor
// Network) and on the web (online/offline events).
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    // onNetworkChange is async; if we unmount before it resolves, run the
    // unsubscribe as soon as it arrives so the listener never leaks.
    onNetworkChange(setOnline).then((fn) => {
      if (cancelled) fn();
      else cleanup = fn;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[90] flex items-center justify-center gap-2 bg-status-amber/15 text-status-amber text-xs font-medium py-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] backdrop-blur-sm border-b border-status-amber/20">
      <WifiOff size={13} /> You&apos;re offline — changes will sync when you reconnect.
    </div>
  );
}
