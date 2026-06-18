"use client";

import { Check } from "lucide-react";

type Day = { date: string; cal: number; p: number; c: number; f: number };

// Color a calorie attainment %: green when on-target, amber when moderately
// off, red when far off, muted when nothing logged.
function calTone(pct: number, logged: boolean): string {
  if (!logged) return "#1a2235";
  if (pct >= 90 && pct <= 110) return "#22d3a5";
  if (pct >= 75 && pct <= 125) return "#fbbf24";
  return "#f56565";
}

export function WeeklyMacroGoals({
  data,
  calGoal,
  proteinGoal,
}: {
  data: Day[];
  calGoal: number;
  proteinGoal: number;
}) {
  const hitDays = data.filter((d) => d.cal > 0 && d.cal >= calGoal * 0.9 && d.cal <= calGoal * 1.1).length;
  const proteinHits = data.filter((d) => d.p >= proteinGoal).length;

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="card-title mb-0">Weekly Macro Goals</div>
        <div className="text-[11px] text-text-3">
          <span className="text-status-green font-semibold">{hitDays}/7</span> calorie ·{" "}
          <span className="text-accent font-semibold">{proteinHits}/7</span> protein
        </div>
      </div>
      <div className="flex items-end justify-between gap-2 h-40 pb-6 relative">
        {/* goal line at 100% */}
        <div className="absolute left-0 right-0 border-t border-dashed border-text-3/40 pointer-events-none" style={{ bottom: "calc(24px + 60%)" }} />
        {data.map((d) => {
          const logged = d.cal > 0;
          const pct = calGoal > 0 ? (d.cal / calGoal) * 100 : 0;
          // 100% of goal renders at 60% column height, so over-goal still fits.
          const h = Math.max(3, Math.min(100, pct * 0.6));
          const proteinHit = d.p >= proteinGoal;
          const day = new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-bg-3 text-text-1 text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
                {d.cal} / {calGoal} kcal · {d.p}g P
              </div>
              <div className="w-full rounded-t transition-all relative" style={{ height: `${h}%`, background: calTone(pct, logged) }}>
                {proteinHit && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </span>
                )}
              </div>
              <div className="absolute -bottom-6 text-[10px] text-text-3">{day}</div>
            </div>
          );
        })}
      </div>
      <div className="text-[11px] text-text-3 mt-1 flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#22d3a5" }} /> on target</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#fbbf24" }} /> close</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#f56565" }} /> off</span>
        <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center"><Check size={9} className="text-white" /></span> protein goal met</span>
      </div>
    </div>
  );
}
