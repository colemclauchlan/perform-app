"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { MacroBar } from "@/components/nutrition/MacroBar";
import { WeightChart } from "@/components/charts/WeightChart";
import { useProfile, useFoodLog, useWeeklyCalories } from "@/hooks/useNutrition";
import { useProtocols } from "@/hooks/useCompounds";
import { useBodyWeights, useWorkouts } from "@/hooks/useTraining";
import { todayISO, formatDate, round, getNextDoseInfo } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Dumbbell, FlaskConical, Apple, Activity } from "lucide-react";
import Link from "next/link";

function StatCard({
  label,
  value,
  unit,
  sub,
  trend,
  icon,
  color = "blue",
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "amber";
}) {
  const colorMap = {
    blue: { bg: "bg-accent-dim", text: "text-accent" },
    green: { bg: "bg-status-green/10", text: "text-status-green" },
    red: { bg: "bg-status-red/10", text: "text-status-red" },
    amber: { bg: "bg-status-amber/10", text: "text-status-amber" },
  };
  const c = colorMap[color];
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-text-3 uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-bold mt-1.5 leading-none">
            {value}
            {unit && <span className="text-sm text-text-2 ml-1 font-normal">{unit}</span>}
          </div>
          {sub && (
            <div
              className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                trend === "up" ? "text-status-green" :
                trend === "down" ? "text-status-red" :
                "text-text-3"
              }`}
            >
              {trend === "up" && <TrendingUp size={10} />}
              {trend === "down" && <TrendingDown size={10} />}
              {trend === "neutral" && <Minus size={10} />}
              {sub}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
            <div className={c.text}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const today = todayISO();
  const { data: profile } = useProfile();
  const { data: todayLog = [] } = useFoodLog(today);
  const { data: weekly = [] } = useWeeklyCalories();
  const { data: protocols = [] } = useProtocols();
  const { data: weights = [] } = useBodyWeights();
  const { data: workouts = [] } = useWorkouts();

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
  const bwDelta = latestWeight && prevWeight ? round(latestWeight.weight - prevWeight.weight) : null;
  const maxBar = Math.max(targetCal, ...weekly.map((w) => w.calories), 1);
  const calPct = Math.round((totals.cal / targetCal) * 100) || 0;
  const protPct = Math.round((totals.p / targetP) * 100) || 0;
  const recentWorkout = workouts[workouts.length - 1];

  const overdueDoses = activeProtocols.flatMap((p) =>
    (p.compounds ?? []).filter(
      (c) => getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency).status === "overdue"
    )
  );

  return (
    <div className="p-6 max-w-[1200px]">
      <PageHeader
        title="Health Dashboard"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Calories Today"
          value={Math.round(totals.cal)}
          unit={`/ ${targetCal}`}
          sub={`${calPct}% of goal`}
          trend={calPct > 110 ? "down" : calPct >= 80 ? "up" : "neutral"}
          icon={<Apple size={18} />}
          color={calPct > 110 ? "red" : "blue"}
        />
        <StatCard
          label="Protein Today"
          value={`${Math.round(totals.p)}g`}
          unit={`/ ${targetP}g`}
          sub={`${protPct}% of goal`}
          trend={totals.p >= targetP ? "up" : "neutral"}
          icon={<Activity size={18} />}
          color={totals.p >= targetP ? "green" : "blue"}
        />
        <StatCard
          label="Active Protocols"
          value={activeProtocols.length}
          sub={activeProtocols.length ? activeProtocols[0].name : "No active cycles"}
          icon={<FlaskConical size={18} />}
          color={overdueDoses.length > 0 ? "red" : "blue"}
        />
        <StatCard
          label="Body Weight"
          value={latestWeight ? latestWeight.weight : "—"}
          unit={latestWeight ? latestWeight.unit : ""}
          sub={bwDelta != null ? `${bwDelta >= 0 ? "+" : ""}${bwDelta} vs prev` : "No entries yet"}
          trend={bwDelta != null && bwDelta > 0 ? "up" : bwDelta != null && bwDelta < 0 ? "down" : "neutral"}
          icon={<TrendingUp size={18} />}
          color="blue"
        />
      </div>

      {/* Overdue dose alert */}
      {overdueDoses.length > 0 && (
        <div className="mb-4 bg-status-red/10 border border-status-red/30 rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in">
          <FlaskConical className="text-status-red flex-shrink-0" size={16} />
          <span className="text-sm text-status-red font-medium">
            {overdueDoses.length} overdue dose{overdueDoses.length !== 1 ? "s" : ""}:{" "}
            {overdueDoses.map((c) => c.compound_name).join(", ")}
          </span>
          <Link href="/compounds" className="ml-auto text-[11px] text-status-red underline underline-offset-2">
            Log now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Calorie bar chart */}
          <div className="card">
            <div className="card-title">Calorie Intake — Last 7 Days</div>
            <div className="flex items-end gap-1.5 h-28 pb-6 relative">
              {weekly.map((d, i) => {
                const isToday = i === weekly.length - 1;
                const pct = Math.max(4, Math.round((100 * d.calories) / maxBar));
                const label = new Date(d.date + "T00:00")
                  .toLocaleDateString("en", { weekday: "short" })
                  .slice(0, 2);
                const over = d.calories > targetCal;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-bg-3 text-text-1 text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
                      {d.calories} kcal
                    </div>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${pct}%`,
                        background: isToday
                          ? over ? "#f56565" : "#2563eb"
                          : over
                          ? "rgba(245,101,101,0.25)"
                          : "rgba(37,99,235,0.2)",
                      }}
                    />
                    <span className="absolute -bottom-5 text-[9px] text-text-3">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-text-3 mt-1">Target: {targetCal} kcal/day</div>
          </div>

          {/* Macros */}
          <div className="card">
            <div className="card-title">Today&apos;s Macros</div>
            <MacroBar protein={totals.p} carbs={totals.c} fat={totals.f} calories={totals.cal} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Protein", value: Math.round(totals.p), target: targetP, unit: "g", color: "#2563eb" },
                { label: "Carbs", value: Math.round(totals.c), target: profile?.target_carbs || 300, unit: "g", color: "#22d3a5" },
                { label: "Fat", value: Math.round(totals.f), target: profile?.target_fat || 80, unit: "g", color: "#f6ad55" },
              ].map((m) => {
                const pct = Math.min(100, Math.round((m.value / m.target) * 100)) || 0;
                return (
                  <div key={m.label} className="card-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] text-text-2">{m.label}</span>
                      <span className="text-[11px] font-semibold">{m.value}{m.unit}</span>
                    </div>
                    <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full progress-bar" style={{ width: `${pct}%`, background: m.color }} />
                    </div>
                    <div className="text-[10px] text-text-3 mt-1">{pct}% of goal</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weight trend */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="card-title !mb-0">Weight Trend</div>
              <Link href="/weight" className="text-[11px] text-accent hover:underline">View all →</Link>
            </div>
            <WeightChart data={weights} height={180} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Active compounds */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="card-title !mb-0">Active Compounds</div>
              <Link href="/compounds" className="text-[11px] text-accent hover:underline">Manage →</Link>
            </div>
            {activeProtocols.length === 0 ? (
              <div className="text-text-3 text-sm py-2">No active protocols.</div>
            ) : (
              <div className="space-y-2">
                {activeProtocols.slice(0, 3).map((p) => {
                  const urgentCompounds = (p.compounds ?? []).filter((c) => {
                    const info = getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency);
                    return info.status === "overdue" || info.status === "urgent";
                  });
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-bg-2 rounded-xl px-3 py-2.5 border border-border">
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="text-[11px] text-text-2 mt-0.5">
                          {p.compounds?.length || 0} compound{(p.compounds?.length || 0) !== 1 ? "s" : ""}
                          {p.end_date ? ` · ends ${formatDate(p.end_date)}` : ""}
                        </div>
                        {urgentCompounds.length > 0 && (
                          <div className="text-[11px] text-status-red mt-0.5">
                            {urgentCompounds.length} dose{urgentCompounds.length !== 1 ? "s" : ""} overdue
                          </div>
                        )}
                      </div>
                      <Badge variant="accent">Active</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Last workout */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="card-title !mb-0">Last Workout</div>
              <Link href="/workouts" className="text-[11px] text-accent hover:underline">All →</Link>
            </div>
            {!recentWorkout ? (
              <div className="text-text-3 text-sm py-2">No workouts logged yet.</div>
            ) : (
              <div className="bg-bg-2 rounded-xl px-3 py-3 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center">
                    <Dumbbell className="text-accent" size={15} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{recentWorkout.name}</div>
                    <div className="text-[11px] text-text-2">{formatDate(recentWorkout.session_date)}</div>
                  </div>
                </div>
                <div className="text-[11px] text-text-3">
                  {recentWorkout.sets?.length || 0} sets
                  {recentWorkout.sets && recentWorkout.sets.length > 0 && (
                    <> · {[...new Set(recentWorkout.sets.map((s) => s.exercise_name))].slice(0, 3).join(", ")}</>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Weight history */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="card-title !mb-0">Weight History</div>
              <Link href="/weight" className="text-[11px] text-accent hover:underline">All →</Link>
            </div>
            {weights.length === 0 ? (
              <div className="text-text-3 text-sm py-2">No entries yet.</div>
            ) : (
              <div className="space-y-1">
                {[...weights].slice(-5).reverse().map((w, i) => {
                  const prevW = weights[weights.length - 1 - i - 1];
                  const delta = prevW ? round(w.weight - prevW.weight) : null;
                  return (
                    <div key={w.id} className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0">
                      <span className="text-[11px] text-text-2">{formatDate(w.logged_date)}</span>
                      <div className="flex items-center gap-2">
                        {delta != null && (
                          <span className={`text-[10px] ${delta > 0 ? "text-status-red" : delta < 0 ? "text-status-green" : "text-text-3"}`}>
                            {delta > 0 ? "+" : ""}{delta}
                          </span>
                        )}
                        <span className={`text-sm font-semibold ${i === 0 ? "text-accent" : "text-text-1"}`}>
                          {w.weight} {w.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
