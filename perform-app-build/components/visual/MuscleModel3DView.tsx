"use client";

import dynamic from "next/dynamic";

// three.js is client-only and code-split; never enters SSR or the app bundle.
const MuscleModel3D = dynamic(() => import("./MuscleModel3D"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-text-3 text-xs">
      Loading 3D model…
    </div>
  ),
});

/**
 * Framed, interactive 3D muscle-anatomy viewer with a legend. Targeted muscles
 * glow red. Use anywhere a muscle map is needed (exercise detail, measurements).
 */
export function MuscleModel3DView({
  primary,
  secondary = [],
  height = 300,
  className = "",
}: {
  primary: string;
  secondary?: string[];
  height?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className="relative rounded-xl border border-border bg-bg-2/40 overflow-hidden"
        style={{ height }}
      >
        <MuscleModel3D primary={primary} secondary={secondary} />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-text-3 pointer-events-none select-none">
          drag to rotate · front ↔ back
        </div>
      </div>
      <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-text-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff2e2e", boxShadow: "0 0 8px #ff2e2e88" }} /> Primary
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#dd5a52" }} /> Secondary
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#444e5e" }} /> Not targeted
        </span>
      </div>
    </div>
  );
}
