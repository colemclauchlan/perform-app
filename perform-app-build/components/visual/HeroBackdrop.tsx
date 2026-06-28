"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// three.js is code-split and client-only; it never touches SSR or the app bundle.
const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false });

/**
 * Decorative hero backdrop for public surfaces (landing / auth). Always paints a
 * CSS aurora; layers the WebGL scene on top only when the device can afford it
 * and the user hasn't asked for reduced motion. Purely decorative + inert.
 */
export function HeroBackdrop({ className = "" }: { className?: string }) {
  const [enable3D, setEnable3D] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Skip the WebGL layer when reduced motion is requested; the aurora alone
    // still looks intentional. (Mobile keeps it — dpr is capped in Hero3D.)
    if (!reduce) setEnable3D(true);
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* CSS aurora base — always present */}
      <div
        className="absolute inset-0 animate-aurora"
        style={{
          background:
            "radial-gradient(38% 50% at 18% 12%, rgba(24,155,245,0.26), transparent 60%)," +
            "radial-gradient(42% 52% at 84% 14%, rgba(24,155,245,0.22), transparent 60%)," +
            "radial-gradient(54% 60% at 50% 110%, rgba(47,227,168,0.14), transparent 60%)",
          filter: "blur(16px)",
        }}
      />
      {enable3D && (
        <div className="absolute inset-0 opacity-80">
          <Hero3D />
        </div>
      )}
      {/* Fade the backdrop into the page so it never has a hard edge */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(14,22,35,0.55) 78%, #0e1623 100%)",
        }}
      />
    </div>
  );
}
