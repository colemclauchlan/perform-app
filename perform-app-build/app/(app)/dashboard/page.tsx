"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { MacroBar } from "@/components/nutrition/MacroBar";
import { DashboardSwitcher } from "@/components/DashboardSwitcher";
import { Reveal, Stagger, StaggerItem } from "@/components/visual/Motion";
import { WeightChart } from "@/components/charts/WeightChart";
import { useProfile, useFoodLog, useWeeklyCalories, useUpdateProfile } from "@/hooks/useNutrition";
import { useProtocols, useLogDose } from "@/hooks/useCompounds";
import { useBodyWeights, useWorkouts, useAddBodyWeight } from "@/hooks/useTraining";
import { useAddHydration } from "@/hooks/useBodyMetrics";
import { todayISO, formatDate, round, getNextDoseInfo, MACRO_HEX } from "@/lib/utils";
import { UserPreferences } from "@/types/database";
import {
  TrendingUp, TrendingDown, Minus, Dumbbell, FlaskConical, Apple, Activity,
  Settings2, Droplets, Scale, Utensils, Eye, EyeOff, ChevronUp, ChevronDown, Maximize2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type WidgetCfg = { id: string; w: number; h: number; order: number; hidden?: boolean };

const WIDGET_LABELS: Record<string, string> = {
  calories: "Calorie Intake (7d)",
  macros: "Today's Macros",
  "weight-trend": "Weight Trend",
  "last-workout": "Last Workout",
  "weight-history": "Weight History",
};

const DEFAULT_WIDGETS: WidgetCfg[] = [
  { id: "calories", w: 2, h: 1, order: 0 },
  { id: "macros", w: 2, h: 1, order: 1 },
  { id: "weight-trend", w: 2, h: 1, order: 2 },
  { id: "last-workout", w: 1, h: 1, order: 4 },
  { id: "weight-history", w: 1, h: 1, order: 5 },
];

function mergeWidgets(saved?: WidgetCfg[]): WidgetCfg[] {
  if (!saved || saved.length === 0) return DEFAULT_WIDGETS;
  const byId = new Map(saved.map((w) => [w.id, w]));
  // Keep all known widgets; use saved config when present, else default. Append any unknown saved ids last.
  const merged = DEFAULT_WIDGETS.map((d) => byId.get(d.id) ?? d);
  return merged.sort((a, b) => a.order - b.order);
}

// Static tinted-chip styles (kept literal so Tailwind/inline hex never get purged).
const STAT_CHIP: Record<"blue" | "green" | "red" | "amber", { bg: string; color: string; ring: string }> = {
  blue: { bg: "#3b82f61a", color: "#3b82f6", ring: "#3b82f633" },
  green: { bg: "#22d3a51a", color: "#22d3a5", ring: "#22d3a533" },
  red: { bg: "#f565651a", color: "#f56565", ring: "#f5656533" },
  amber: { bg: "#f6ad551a", color: "#f6ad55", ring: "#f6ad5533" },
};

function StatCard({
  label, value, unit, sub, trend, icon, color = "blue",
}: {
  label: string; value: string | number; unit?: string; sub?: string;
  trend?: "up" | "down" | "neutral"; icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "amber";
}) {
  const c = STAT_CHIP[color] ?? STAT_CHIP.blue;
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-text-3 uppercase tracking-[0.12em] font-semibold">{label}</div>
          <div className="text-2xl font-display font-bold mt-1.5 leading-none tabular-nums">
            {value}
            {unit && <span className="text-sm text-text-2 ml-1 font-normal">{unit}</span>}
          </div>
          {sub && (
            <div className={`text-[11px] mt-1.5 flex items-center gap-1 ${
              trend === "up" ? "text-status-green" : trend === "down" ? "text-status-red" : "text-text-3"
            }`}>
              {trend === "up" && <TrendingUp size={10} />}
              {trend === "down" && <TrendingDown size={10} />}
              {trend === "neutral" && <Minus size={10} />}
              {sub}
            </div>
          )}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
            style={{ background: c.bg, color: c.color, boxShadow: `inset 0 0 0 1px ${c.ring}` }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Instrument readout cell for the Clinical Readout dashboard.
function Readout({
  label, value, unit, sub, tone, small,
}: {
  label: string; value: string | number; unit?: string; sub?: string; tone?: string; small?: boolean;
}) {
  return (
    <div className="cell p-3">
      <div className="eyebrow truncate">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1 min-w-0">
        <span className={`fig text-text-1 ${small ? "text-sm truncate" : "text-xl"}`}>{value}</span>
        {unit && <span className="eyebrow">{unit}</span>}
      </div>
      {sub && <div className={`fig text-[10px] mt-1 truncate ${tone || "text-text-3"}`}>{sub}</div>}
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

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [weightModal, setWeightModal] = useState(false);

  const widgets = mergeWidgets(profile?.preferences?.dashboard_widgets);
  const visible = widgets.filter((w) => !w.hidden);

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
  // useWorkouts returns sessions newest-first (session_date desc), so the most
  // recent workout is index 0.
  const recentWorkout = workouts[0];

  const overdueDoses = activeProtocols.flatMap((p) =>
    (p.compounds ?? []).filter(
      (c) => getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency).status === "overdue"
    )
  );

  function renderWidget(cfg: WidgetCfg) {
    switch (cfg.id) {
      case "calories":
        return (
          <div className="card h-full">
            <div className="card-title">Calorie Intake — Last 7 Days</div>
            <div className="flex items-end gap-1.5 h-28 pb-6 relative">
              {weekly.map((d, i) => {
                const isToday = i === weekly.length - 1;
                const pct = Math.max(4, Math.round((100 * d.calories) / maxBar));
                const label = new Date(d.date + "T00:00").toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
                const over = d.calories > targetCal;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-bg-3 text-text-1 text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
                      {d.calories} kcal
                    </div>
                    <div className="w-full rounded-t-lg transition-all" style={{
                      height: `${pct}%`,
                      background: isToday ? (over ? "#f56565" : "#2563eb") : over ? "rgba(245,101,101,0.25)" : "rgba(37,99,235,0.2)",
                    }} />
                    <span className="absolute -bottom-5 text-[9px] text-text-3">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-text-3 mt-1">Target: {targetCal} kcal/day</div>
          </div>
        );
      case "macros":
        return (
          <div className="card h-full">
            <div className="card-title">Today&apos;s Macros</div>
            <MacroBar protein={totals.p} carbs={totals.c} fat={totals.f} calories={totals.cal} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Protein", value: Math.round(totals.p), target: targetP, unit: "g", color: MACRO_HEX.protein, higherIsBetter: true },
                { label: "Carbs", value: Math.round(totals.c), target: profile?.target_carbs || 300, unit: "g", color: MACRO_HEX.carbs, higherIsBetter: false },
                { label: "Fat", value: Math.round(totals.f), target: profile?.target_fat || 80, unit: "g", color: MACRO_HEX.fat, higherIsBetter: false },
              ].map((m) => {
                const pct = Math.min(100, Math.round((m.value / m.target) * 100)) || 0;
                return (
                  <div key={m.label} className="card-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] text-text-2">{m.label}</span>
                      <span className="text-[11px] font-semibold tabular-nums">
                        {m.value}
                        <span className="text-text-3 font-normal">/{m.target}{m.unit}</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full progress-bar" style={{ width: `${pct}%`, background: m.color }} />
                    </div>
                    <div
                      className={`text-[10px] mt-1 tabular-nums ${
                        m.higherIsBetter
                          ? m.value >= m.target
                            ? "text-status-green"
                            : "text-status-red"
                          : m.value > m.target
                          ? "text-status-red"
                          : "text-text-3"
                      }`}
                    >
                      {m.value >= m.target
                        ? m.value === m.target
                          ? "Goal hit"
                          : `+${m.value - m.target}${m.unit} over`
                        : `${m.target - m.value}${m.unit} to go`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case "weight-trend":
        return (
          <div className="card h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="card-title !mb-0">Weight Trend</div>
              <Link href="/weight" className="text-[11px] text-accent hover:underline">View all →</Link>
            </div>
            <WeightChart data={weights} height={180} />
          </div>
        );
      case "compounds":
        return (
          <div className="card h-full">
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
        );
      case "last-workout":
        return (
          <div className="card h-full">
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
        );
      case "weight-history":
        return (
          <div className="card h-full">
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
                          <span className={`text-[10px] ${delta > 0 ? "text-status-green" : delta < 0 ? "text-status-red" : "text-text-3"}`}>
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
        );
      default:
        return null;
    }
  }

  return (
    <div className="clinical p-6 max-w-[1200px]">
      <DashboardSwitcher />

      {/* Hero spotlight — today's headline metric */}
      <div className="cell px-5 py-5 sm:px-6 sm:py-6 mb-4 animate-fade-in">
        {/* status strip */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="eyebrow sig">Health Dashboard</span>
            <span className="w-px h-3" style={{ background: "var(--grid)" }} />
            <span className="eyebrow truncate">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm flex items-center gap-1.5" onClick={() => setCustomizeOpen(true)}>
            <Settings2 size={14} /> Customize
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
          {/* primary energy readout — the thesis */}
          <div>
            <div className="eyebrow mb-2">Energy intake · today</div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="fig text-5xl sm:text-6xl font-semibold leading-none"
                style={{ color: calPct > 110 ? "var(--warn)" : "var(--sig)" }}
              >
                {Math.round(totals.cal).toLocaleString()}
              </span>
              <span className="fig text-text-3 text-xl">/ {targetCal.toLocaleString()}</span>
              <span className="eyebrow ml-0.5">kcal</span>
            </div>
            <div className={`track mt-4 ${calPct > 100 ? "over" : ""}`}>
              <span style={{ width: `${Math.min(100, calPct)}%` }} />
            </div>
            <div className="ticks mt-1" />
            <div className="flex items-center justify-between mt-2">
              <span className="eyebrow">{calPct}% of target</span>
              <span className="fig text-[11px] text-text-2">
                {targetCal - Math.round(totals.cal) >= 0
                  ? `${(targetCal - Math.round(totals.cal)).toLocaleString()} remaining`
                  : `${(Math.round(totals.cal) - targetCal).toLocaleString()} over`}
              </span>
            </div>
          </div>

          {/* macro instrument cells */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Protein", value: Math.round(totals.p), target: targetP, color: MACRO_HEX.protein, hib: true },
              { label: "Carbs", value: Math.round(totals.c), target: profile?.target_carbs || 300, color: MACRO_HEX.carbs, hib: false },
              { label: "Fat", value: Math.round(totals.f), target: profile?.target_fat || 80, color: MACRO_HEX.fat, hib: false },
            ].map((m) => {
              const pct = Math.min(100, Math.round((m.value / m.target) * 100)) || 0;
              const good = m.hib ? m.value >= m.target : m.value <= m.target;
              return (
                <div key={m.label} className="cell p-2.5">
                  <div className="eyebrow">{m.label}</div>
                  <div className="mt-1.5">
                    <span className="fig text-lg text-text-1">{m.value}</span>
                    <span className="eyebrow ml-0.5">g</span>
                  </div>
                  <div className="track mt-2">
                    <span style={{ width: `${pct}%`, background: m.color }} />
                  </div>
                  <div className="fig text-[10px] mt-1.5" style={{ color: good ? "#22d3a5" : "var(--warn)" }}>
                    {m.value >= m.target ? `+${m.value - m.target}` : `−${m.target - m.value}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* vitals row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-5" style={{ borderTop: "1px solid var(--grid)" }}>
          <Readout
            label="Body weight"
            value={latestWeight ? latestWeight.weight : "—"}
            unit={latestWeight ? latestWeight.unit : ""}
            sub={bwDelta != null ? `${bwDelta >= 0 ? "+" : ""}${bwDelta} vs prev` : "no entries"}
            tone={bwDelta != null && bwDelta > 0 ? "text-status-green" : bwDelta != null && bwDelta < 0 ? "text-text-1" : "text-text-3"}
          />
          <Readout
            label="Active protocols"
            value={activeProtocols.length}
            sub={activeProtocols.length ? activeProtocols[0].name : "none active"}
          />
          <Readout
            label="Doses due"
            value={overdueDoses.length}
            sub={overdueDoses.length ? "needs logging" : "all current"}
            tone={overdueDoses.length ? "text-status-red" : "text-status-green"}
          />
          <Readout
            label="Last session"
            value={recentWorkout ? recentWorkout.name : "—"}
            sub={recentWorkout ? formatDate(recentWorkout.session_date) : "no sessions"}
            small
          />
        </div>
      </div>

      {/* Quick-log shortcuts */}
      <QuickLog
        today={today}
        weightUnit={latestWeight?.unit || profile?.weight_unit || "lbs"}
        activeProtocols={activeProtocols}
        onLogWeight={() => setWeightModal(true)}
      />

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

      {/* Configurable widgets */}
      {visible.length === 0 ? (
        <div className="card text-center text-text-3 text-sm py-10">
          All widgets are hidden.{" "}
          <button className="text-accent hover:underline" onClick={() => setCustomizeOpen(true)}>
            Customize your dashboard
          </button>
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((cfg) => (
            <StaggerItem key={cfg.id} className={cfg.w === 2 ? "lg:col-span-2" : ""}>
              {renderWidget(cfg)}
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <CustomizeModal open={customizeOpen} onClose={() => setCustomizeOpen(false)} widgets={widgets} />
      <LogWeightModal open={weightModal} onClose={() => setWeightModal(false)} date={today} unit={latestWeight?.unit || profile?.weight_unit || "lbs"} />
    </div>
  );
}

// ─── Quick-log shortcuts bar ─────────────────────────────────────────────────
function QuickLog({
  today, weightUnit, activeProtocols, onLogWeight,
}: {
  today: string;
  weightUnit: string;
  activeProtocols: ReturnType<typeof useProtocols>["data"];
  onLogWeight: () => void;
}) {
  const addHydration = useAddHydration();
  const logDose = useLogDose();

  // Find the most-urgent due compound across active protocols to one-tap log.
  const dueCompound = (activeProtocols ?? [])
    .flatMap((p) =>
      (p.compounds ?? []).map((c) => ({
        protocol_id: p.id,
        compound_name: c.compound_name,
        compound_unit: c.compound_unit,
        dose: c.dose,
        info: getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency),
      }))
    )
    .filter((c) => c.info.status === "overdue" || c.info.status === "urgent")
    .sort((a, b) => (a.info.status === "overdue" ? -1 : 1) - (b.info.status === "overdue" ? -1 : 1))[0];

  function quickWater() {
    addHydration.mutate(
      { logged_date: today, amount_ml: 250, source: "manual" },
      { onSuccess: () => toast.success("+250ml water"), onError: (e) => toast.error(e.message) }
    );
  }

  function quickDose() {
    if (!dueCompound) {
      toast("No doses due. Open Compounds to log.", { icon: "💊" });
      return;
    }
    logDose.mutate(
      {
        protocol_id: dueCompound.protocol_id,
        compound_name: dueCompound.compound_name,
        dose_amount: dueCompound.dose,
        compound_unit: dueCompound.compound_unit,
        logged_at: new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success(`Logged ${dueCompound.compound_name}`),
        onError: (e) => toast.error(e.message),
      }
    );
  }

  const Btn = ({ icon, label, onClick, href }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string }) => {
    const cls = "flex items-center gap-2 rounded-xl border border-border bg-bg-2/80 hover:border-accent/40 hover:bg-bg-3 hover:shadow-card px-3.5 py-2.5 text-sm text-text-2 hover:text-text-1 transition-all duration-200 active:scale-[0.97]";
    const inner = <>{icon}<span className="font-medium">{label}</span></>;
    return href ? <Link href={href} className={cls}>{inner}</Link> : <button onClick={onClick} className={cls}>{inner}</button>;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <Btn icon={<Utensils size={15} className="text-accent" />} label="Log Food" href="/nutrition" />
      <Btn icon={<Scale size={15} className="text-status-teal" />} label="Log Weight" onClick={onLogWeight} />
      <Btn icon={<Droplets size={15} className="text-status-teal" />} label="+250ml Water" onClick={quickWater} />
      <Btn
        icon={<FlaskConical size={15} className={dueCompound ? "text-status-red" : "text-accent"} />}
        label={dueCompound ? `Log ${dueCompound.compound_name}` : "Log Dose"}
        onClick={quickDose}
      />
      <Btn icon={<Dumbbell size={15} className="text-accent" />} label="Log Workout" href="/workouts" />
    </div>
  );
}

// ─── Quick body-weight modal ─────────────────────────────────────────────────
function LogWeightModal({ open, onClose, date, unit }: { open: boolean; onClose: () => void; date: string; unit: string }) {
  const addWeight = useAddBodyWeight();
  const [value, setValue] = useState("");

  function save() {
    const w = parseFloat(value);
    if (!w || w <= 0) { toast.error("Enter a valid weight"); return; }
    addWeight.mutate(
      { logged_date: date, weight: w, unit },
      {
        onSuccess: () => { toast.success("Weight logged"); setValue(""); onClose(); },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Body Weight">
      <div className="space-y-3">
        <div>
          <label className="label">Weight ({unit})</label>
          <input
            type="number" autoFocus value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder={`e.g. 185`}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn btn-primary" onClick={save}>Save</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Dashboard customize modal ───────────────────────────────────────────────
function CustomizeModal({ open, onClose, widgets }: { open: boolean; onClose: () => void; widgets: WidgetCfg[] }) {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [draft, setDraft] = useState<WidgetCfg[]>(widgets);
  const [initKey, setInitKey] = useState<string | null>(null);

  // Init draft when the modal opens.
  const sig = open ? widgets.map((w) => `${w.id}:${w.order}:${w.w}:${w.hidden ? 1 : 0}`).join("|") : "closed";
  if (open && initKey !== sig) {
    setInitKey(sig);
    setDraft(widgets);
  }
  if (!open && initKey !== null) setInitKey(null);

  function move(idx: number, dir: -1 | 1) {
    const arr = [...draft];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setDraft(arr.map((w, i) => ({ ...w, order: i })));
  }
  function toggleHidden(id: string) {
    setDraft((d) => d.map((w) => (w.id === id ? { ...w, hidden: !w.hidden } : w)));
  }
  function toggleWidth(id: string) {
    setDraft((d) => d.map((w) => (w.id === id ? { ...w, w: w.w === 2 ? 1 : 2 } : w)));
  }
  function reset() {
    setDraft(DEFAULT_WIDGETS.map((w) => ({ ...w })));
  }

  function save() {
    const prefs: UserPreferences = { ...(profile?.preferences || {}), dashboard_widgets: draft.map((w, i) => ({ ...w, order: i })) };
    updateProfile.mutate(
      { preferences: prefs },
      {
        onSuccess: () => { toast.success("Dashboard saved"); onClose(); },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Customize Dashboard">
      <div className="space-y-2">
        <p className="text-xs text-text-3">Show, hide, resize and reorder your dashboard widgets.</p>
        {draft.map((w, i) => (
          <div key={w.id} className={`flex items-center gap-2 rounded-xl border border-border px-3 py-2 ${w.hidden ? "opacity-50 bg-bg-2" : "bg-bg-2"}`}>
            <div className="flex flex-col">
              <button className="text-text-3 hover:text-text-1 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>
                <ChevronUp size={14} />
              </button>
              <button className="text-text-3 hover:text-text-1 disabled:opacity-30" disabled={i === draft.length - 1} onClick={() => move(i, 1)}>
                <ChevronDown size={14} />
              </button>
            </div>
            <span className="flex-1 text-sm font-medium">{WIDGET_LABELS[w.id] || w.id}</span>
            <button
              className={`btn btn-ghost btn-sm !px-1.5 ${w.w === 2 ? "text-accent" : "text-text-3"}`}
              title={w.w === 2 ? "Full width" : "Half width"}
              onClick={() => toggleWidth(w.id)}
            >
              <Maximize2 size={13} />
            </button>
            <button
              className="btn btn-ghost btn-sm !px-1.5"
              title={w.hidden ? "Show" : "Hide"}
              onClick={() => toggleHidden(w.id)}
            >
              {w.hidden ? <EyeOff size={14} className="text-text-3" /> : <Eye size={14} className="text-accent" />}
            </button>
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <button className="btn btn-primary" onClick={save} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving…" : "Save layout"}
          </button>
          <button className="btn btn-ghost" onClick={reset}>Reset</button>
          <button className="btn btn-ghost ml-auto" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
