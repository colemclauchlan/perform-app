"use client";

/**
 * The gapped gauge ring — Vital Signal's spine, at component scale. A value
 * against a target with a centered readout: the monumental display figure over
 * a microscopic mono unit. The closed loop that's never quite closed.
 *
 * Over-target strokes red (out of range) unless `overIsGood` (e.g. protein),
 * where it strokes mint (on-track). The track is a sunken steel arc.
 */
export function Ring({
  value = 0,
  target = 100,
  size = 96,
  stroke = 8,
  color = "#189bf5",
  unit = "",
  label,
  centerValue,
  overIsGood = false,
  className = "",
}: {
  value?: number;
  target?: number;
  size?: number;
  stroke?: number;
  color?: string;
  unit?: string;
  label?: string;
  centerValue?: string | number;
  overIsGood?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / (target || 1)) * 100));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // Hold a deliberate ~8% gap so the loop never fully closes — the brand motif.
  const gap = circ * 0.08;
  const dash = (circ * pct) / 100;
  const over = value > target;
  const stroked = over ? (overIsGood ? "#2fe3a8" : "#f56565") : color;

  return (
    <div className={`text-center ${className}`}>
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#27344a"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circ - gap} ${gap}`}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={stroked}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              transition: "stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1), stroke 0.3s",
              filter: `drop-shadow(0 0 5px ${stroked}55)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="metric"
            style={{ fontSize: size * 0.27, color: stroked }}
          >
            {centerValue != null ? centerValue : Math.round(value)}
          </span>
          {unit && <span className="data text-text-3 mt-0.5" style={{ fontSize: 10 }}>{unit}</span>}
        </div>
      </div>
      {label && <div className="lab-label mt-2">{label}</div>}
    </div>
  );
}
