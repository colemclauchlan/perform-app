"use client";

import { MACRO_HEX } from "@/lib/utils";

export function MacroBar({
  protein,
  carbs,
  fat,
  calories,
}: {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}) {
  const total = calories || 1;
  const pPct = Math.min(100, ((protein * 4) / total) * 100);
  const cPct = Math.min(100, ((carbs * 4) / total) * 100);
  const fPct = Math.min(100, ((fat * 9) / total) * 100);

  const legend = [
    { label: "Protein", v: protein, color: MACRO_HEX.protein },
    { label: "Carbs", v: carbs, color: MACRO_HEX.carbs },
    { label: "Fat", v: fat, color: MACRO_HEX.fat },
  ];

  return (
    <div>
      {/* Calorie-weighted composition bar, sunk into a steel track. */}
      <div className="flex h-2 rounded-full overflow-hidden gap-[3px] my-2 bg-bg-4">
        <div className="h-full transition-all duration-500" style={{ width: `${pPct}%`, background: MACRO_HEX.protein }} />
        <div className="h-full transition-all duration-500" style={{ width: `${cPct}%`, background: MACRO_HEX.carbs }} />
        <div className="h-full transition-all duration-500" style={{ width: `${fPct}%`, background: MACRO_HEX.fat }} />
      </div>
      <div className="flex gap-3.5 mt-2.5 flex-wrap">
        {legend.map((m) => (
          <span key={m.label} className="data text-[11.5px] text-text-2 inline-flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: m.color }} />
            {m.label} <span className="text-text-1">{Math.round(m.v)}g</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Circular progress ring
export function MacroRing({
  label,
  value,
  target,
  unit,
  color,
  higherIsBetter,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  // Protein: over-goal is good (green), under is bad (red). Everything else
  // (calories/carbs/fat): over-goal is bad (red), under is neutral.
  higherIsBetter?: boolean;
}) {
  const pct = Math.min(100, Math.round((value / (target || 1)) * 100));
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  const gap = circ * 0.08; // the deliberate gap — the loop never fully closes

  return (
    <div className="card-sm text-center">
      <div className="relative inline-flex items-center justify-center w-[90px] h-[90px] mx-auto mb-2">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle
            cx="45"
            cy="45"
            r={r}
            fill="none"
            stroke="#27344a"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${circ - gap} ${gap}`}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
          <circle
            cx="45"
            cy="45"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              transition: "stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)",
              filter: `drop-shadow(0 0 5px ${color}55)`,
            }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="metric text-[19px]" style={{ color }}>
            {pct}<span className="data text-[10px] ml-0.5" style={{ color }}>%</span>
          </div>
          <div className="data text-[9px] text-text-3 mt-0.5 uppercase tracking-wider">{label}</div>
        </div>
      </div>
      <div className="lab-label">{label}</div>
      <div className="data text-[11px] mt-1">
        <span className="text-text-1">{Math.round(value)}</span>
        <span className="text-text-3">
          /{target}
          {unit}
        </span>
      </div>
      {(() => {
        const v = Math.round(value);
        const over = v > target;
        const hit = v === target;
        const cls = higherIsBetter
          ? v >= target
            ? "text-status-green" // protein at/over goal = good
            : "text-status-red" //  protein under goal = bad
          : over
          ? "text-status-red" //   calories/carbs/fat over goal = bad
          : "text-text-3"; //      under/neutral
        const text = v >= target ? (hit ? "Goal hit" : `+${v - target}${unit} over`) : `${target - v}${unit} to go`;
        return <div className={`data text-[10px] mt-1 ${cls}`}>{text}</div>;
      })()}
    </div>
  );
}
