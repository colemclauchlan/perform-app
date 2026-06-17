"use client";

import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { MacroBar } from "@/components/nutrition/MacroBar";
import { useProfile, useFoodLog, useWeeklyCalories } from "@/hooks/useNutrition";
import { useProtocols } from "@/hooks/useCompounds";
import { useBodyWeights } from "@/hooks/useTraining";
import { todayISO, formatDate, round, getNextDoseInfo } from "@/lib/utils";

export default function DashboardPage() {
  const today = todayISO();
  const { data: profile } = useProfile();
  const { data: todayLog = [] } = useFoodLog(today);
  const { data: weekly = [] } = useWeeklyCalories();
  const { data: protocols = [] } = useProtocols();
  const { data: weights = [] } = useBodyWeights();

  const totals = todayLog.reduce(
    (acc, e) => ({
      cal: acc.cal + Number(e.calories),
      p: acc.p + Number(e.protein),
      c: acc.c + Number(e.carbs),
      f: acc.f + Number(e.fat),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const targetCal = profile?.target_calories || 2500;
  const targetP = profile?.target_protein || 200;

  const activeProtocols = protocols.filter((p) => p.is_active);
  const latestWeight = weights[weights.length - 1];
  const prevWeight = weights[weights.length - 2];
  const bwDelta =
    latestWeight && prevWeight
      ? round(latestWeight.weight - prevWeight.weight)
      : null;

  const maxBar = Math.max(targetCal, ...weekly.map((w) => w.calories), 1);

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Calories Today"
          value={Math.round(totals.cal)}
          unit={`/ ${targetCal}`}
          sub={`${Math.round((100 * totals.cal) / targetCal) || 0}% of goal`}
          trend={totals.cal > targetCal ? "down" : "up"}
        />
        <StatCard
          label="Protein Today"
          value={`${Math.round(totals.p)}g`}
          unit={`/ ${targetP}g`}
          sub={`${Math.round((100 * totals.p) / targetP) || 0}% of goal`}
          trend={totals.p >= targetP ? "up" : "down"}
        />
        <StatCard
          label="Active Protocols"
          value={activeProtocols.length}
          sub={
            activeProtocols.length
              ? activeProtocols[0].name
              : "No active cycles"
          }
        />
        <StatCard
          label="Body Weight"
          value={latestWeight ? latestWeight.weight : "—"}
          unit={latestWeight ? latestWeight.unit : ""}
          sub={
            bwDelta != null
              ? `${bwDelta >= 0 ? "+" : ""}${bwDelta} vs prev`
              : "No entries yet"
          }
          trend={bwDelta != null && bwDelta > 0 ? "up" : bwDelta != null && bwDelta < 0 ? "down" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-3">
          <div className="card">
            <div className="card-title">Today&apos;s Macros</div>
            <MacroBar
              protein={totals.p}
              carbs={totals.c}
              fat={totals.f}
              calories={totals.cal}
            />
            <div className="text-[11px] text-text-3 mt-2">
              {Math.round(totals.cal)} / {targetCal} kcal logged today
            </div>
          </div>

          <div className="card">
            <div className="card-title">Calorie Intake — Last 7 Days</div>
            <div className="flex items-end gap-1 h-24 pb-5 relative">
              {weekly.map((d, i) => {
                const isToday = i === weekly.length - 1;
                const h = Math.max(4, Math.round((80 * d.calories) / maxBar));
                const label = new Date(d.date + "T00:00").toLocaleDateString(
                  "en",
                  { weekday: "short" }
                ).slice(0, 2);
                return (
                  <div
                    key={d.date}
                    className="flex-1 rounded-t-sm relative transition-all min-w-[8px]"
                    style={{
                      height: `${h}px`,
                      background: isToday ? "#7c6af7" : "rgba(124,106,247,0.2)",
                    }}
                    title={`${label}: ${d.calories} kcal`}
                  >
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-text-3 whitespace-nowrap">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-text-3 mt-1">
              Target: {targetCal} kcal
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <div className="card">
            <div className="card-title">Active Compounds</div>
            {activeProtocols.length === 0 ? (
              <div className="text-text-3 text-sm">
                No active protocols. Start one in Compounds.
              </div>
            ) : (
              <div className="space-y-2">
                {activeProtocols.slice(0, 3).map((p) => {
                  // Find most urgent next dose
                  let urgentLabel = "";
                  let urgentStatus: string = "ok";
                  p.compounds?.forEach((c) => {
                    const info = getNextDoseInfo(
                      c.last_dose?.logged_at || null,
                      c.frequency
                    );
                    if (info.status === "overdue") {
                      urgentLabel = `${c.compound_name}: ${info.label}`;
                      urgentStatus = "overdue";
                    }
                  });
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2.5 border border-border"
                    >
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-[11px] text-text-2">
                          {p.compounds?.length || 0} compound
                          {(p.compounds?.length || 0) !== 1 ? "s" : ""} · ends{" "}
                          {p.end_date ? formatDate(p.end_date) : "—"}
                        </div>
                        {urgentLabel && (
                          <div className="text-[11px] text-status-red mt-0.5">
                            {urgentLabel}
                          </div>
                        )}
                      </div>
                      <Badge variant="purple">Active</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Body Weight</div>
            {weights.length === 0 ? (
              <div className="text-text-3 text-sm">No weight entries yet.</div>
            ) : (
              <div className="space-y-1">
                {[...weights]
                  .slice(-5)
                  .reverse()
                  .map((w, i) => (
                    <div
                      key={w.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-text-2">{formatDate(w.logged_date)}</span>
                      <span
                        className={
                          i === 0
                            ? "text-accent font-semibold"
                            : "text-text-1"
                        }
                      >
                        {w.weight} {w.unit}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
