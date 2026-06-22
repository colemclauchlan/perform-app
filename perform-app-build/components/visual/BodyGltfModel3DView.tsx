"use client";

import dynamic from "next/dynamic";
import type { MeasurePoint } from "./BodyGltfModel3D";

// three.js + the GLB loader are client-only and code-split.
const BodyGltfModel3D = dynamic(() => import("./BodyGltfModel3D"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-text-3 text-xs">Loading body model…</div>
  ),
});

/**
 * Framed, interactive 3D body viewer (loads a real human GLB) with measurement
 * callouts plotted onto the matching anatomy. Drag to rotate.
 */
export function BodyGltfModel3DView({
  points = [],
  height = 460,
  autoRotate = false,
  className = "",
  caption,
}: {
  points?: MeasurePoint[];
  height?: number;
  autoRotate?: boolean;
  className?: string;
  caption?: string;
}) {
  return (
    <div className={className}>
      <div
        className="relative rounded-xl border border-border bg-[radial-gradient(120%_90%_at_50%_0%,rgba(37,99,235,0.10),transparent_60%)] overflow-hidden"
        style={{ height }}
      >
        <BodyGltfModel3D points={points} autoRotate={autoRotate} />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-text-3 pointer-events-none select-none">
          drag to rotate · scroll to zoom · right-drag to pan
        </div>
      </div>
      {caption && <div className="text-center text-[11px] text-text-3 mt-2">{caption}</div>}
    </div>
  );
}
