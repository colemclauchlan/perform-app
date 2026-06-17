"use client";

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

  return (
    <div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 my-2">
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{ width: `${pPct}%`, background: "#7c6af7" }}
        />
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{ width: `${cPct}%`, background: "#2dd4bf" }}
        />
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{ width: `${fPct}%`, background: "#fbbf24" }}
        />
      </div>
      <div className="flex gap-3 text-xs text-text-2 mt-1.5 flex-wrap">
        <span>
          <span style={{ color: "#7c6af7" }}>●</span> Protein{" "}
          {Math.round(protein)}g
        </span>
        <span>
          <span style={{ color: "#2dd4bf" }}>●</span> Carbs {Math.round(carbs)}g
        </span>
        <span>
          <span style={{ color: "#fbbf24" }}>●</span> Fat {Math.round(fat)}g
        </span>
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
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / (target || 1)) * 100));
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <div className="card-sm text-center">
      <div className="relative inline-flex items-center justify-center w-[90px] h-[90px] mx-auto mb-2">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle
            cx="45"
            cy="45"
            r={r}
            fill="none"
            stroke={`${color}22`}
            strokeWidth="7"
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
              transition: "stroke-dasharray 0.4s",
            }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-base font-semibold" style={{ color }}>
            {Math.round(value)}
          </div>
          <div className="text-[10px] text-text-3">{unit}</div>
        </div>
      </div>
      <div className="text-xs text-text-2">{label}</div>
      <div className="text-[11px] text-text-3">
        {pct}% of {target}
        {unit}
      </div>
    </div>
  );
}
