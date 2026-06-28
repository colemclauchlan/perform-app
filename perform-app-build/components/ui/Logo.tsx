"use client";

import { useState } from "react";

/**
 * BodyTracker logo.
 * Place the supplied artwork in /public as:
 *   - /bodytracker-logo.png  (full horizontal wordmark)
 *   - /bodytracker-icon.png  (square app icon)
 * If the PNG is missing the component gracefully falls back to an inline SVG mark
 * so the UI never shows a broken image.
 */

function FallbackMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* split ring */}
      <path d="M14 3 a11 11 0 0 0 0 22" stroke="#189bf5" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M14 3 a11 11 0 0 1 0 22" stroke="#e8edf5" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* torso */}
      <circle cx="14" cy="9" r="2.4" fill="#e8edf5" />
      <path d="M10.5 13 q3.5 -1.6 7 0 l-0.7 7 q-2.8 1.1 -5.6 0 z" fill="#e8edf5" />
      {/* pulse line */}
      <path d="M5 23 h5 l1.5 -3 2 6 1.5 -3 h7" stroke="#3aa6f7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Logo({
  variant = "icon",
  size = 28,
  className = "",
}: {
  variant?: "icon" | "full";
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const src = variant === "full" ? "/bodytracker-logo.png" : "/bodytracker-icon.png";

  if (errored) {
    if (variant === "full") {
      return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
          <FallbackMark size={size} />
          <span className="text-[17px] font-bold tracking-tight">
            Body<span className="text-accent">Tracker</span>
          </span>
        </span>
      );
    }
    return <FallbackMark size={size} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt="BodyTracker"
      onError={() => setErrored(true)}
      className={className}
      style={variant === "full" ? { height: size, width: "auto" } : { height: size, width: size, objectFit: "contain" }}
    />
  );
}
