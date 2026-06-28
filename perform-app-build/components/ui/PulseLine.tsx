"use client";

/**
 * The pulse waveform — Vital Signal's connective tissue. A single ECG line that
 * threads beneath headers and footers, tying the system together like a vein.
 * Traces once on mount (see `.pulse-line` in globals), then sits still.
 */
export function PulseLine({
  className = "",
  color = "var(--tw-pulse, #189bf5)",
  width = 240,
  height = 20,
  opacity = 0.5,
}: {
  className?: string;
  color?: string;
  width?: number;
  height?: number;
  opacity?: number;
}) {
  // One clinical heartbeat (P–QRS–T) over ~120px, repeated twice across 240.
  const beat = "h14 l3 -3 l3 3 h10 l3 0 l2 -11 l3 22 l3 -11 h12 l3 3 l3 -3 h17";
  return (
    <svg
      className={`pulse-line ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      style={{ opacity }}
    >
      <path
        d={`M0 ${height / 2} ${beat} ${beat}`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
