"use client";

import dynamic from "next/dynamic";

// three.js + the GLB loader are client-only and code-split.
const MuscleBodyModel3D = dynamic(() => import("./MuscleBodyModel3D"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-text-3 text-xs">Loading model…</div>
  ),
});

/**
 * Interactive 3D body that highlights the targeted muscle zones (primary brighter
 * than secondary) on a real human mesh. Drop-in replacement for the old
 * MuscleModel3DView — same props.
 */
export function MuscleBodyModel3DView({
  primary,
  secondary = [],
  height = 320,
  className = "",
  showLegend = true,
  autoRotate = true,
  caption,
}: {
  primary: string;
  secondary?: string[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  autoRotate?: boolean;
  caption?: string;
}) {
  return (
    <div className={className}>
      <div
        className="relative rounded-xl border border-border bg-[radial-gradient(120%_90%_at_50%_0%,rgba(255,59,59,0.08),transparent_60%)] overflow-hidden"
        style={{ height }}
      >
        <MuscleBodyModel3D primary={primary} secondary={secondary} autoRotate={autoRotate} />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-text-3 pointer-events-none select-none">
          drag to rotate · scroll to zoom
        </div>
      </div>
      {caption && <div className="text-center text-[11px] text-text-3 mt-2">{caption}</div>}
      {showLegend && (
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-text-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff3b3b", boxShadow: "0 0 8px #ff3b3b88" }} /> Primary
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#cf5b54" }} /> Secondary
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#b9c2d4" }} /> Not targeted
          </span>
        </div>
      )}
    </div>
  );
}
