"use client";

import { DashboardSwitcher } from "@/components/DashboardSwitcher";
import { SignalHero } from "@/components/dashboard/SignalHero";
import {
  BarChart,
  Sparkline,
  BarRow,
  DashProgress,
  QuickActions,
  StatTile,
  C,
} from "@/components/dashboard/DashboardPrimitives";
import { Ring } from "@/components/ui/Ring";
import { MacroBar } from "@/components/nutrition/MacroBar";
import { useProfile, useFoodLog, useWeeklyCalories } from "@/hooks/useNutrition";
import { useBodyWeights, useSteps } from "@/hooks/useTraining";
import { useSleepLogs, useHydrationLogs } from "@/hooks/useBodyMetrics";
import { todayISO, formatDate, round } from "@/lib/utils";
import {
  Apple, Activity, Scale, Moon, Utensils, ClipboardList, Droplets,
  Footprints, TestTube, Flame, Trophy, Check,
} from "lucide-react";

// ── Card shell + action link (the kit's Card + LinkButton) ───────────────────
function Panel({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card">
      {(title || action) && (
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="card-title !mb-0">{title}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="data text-[11.5px] font-semibold text-text-2 px-2.5 py-1 rounded-lg border border-border whitespace-nowrap transition-all hover:border-accent/40 hover:text-accent-bright hover:bg-accent-dim"
    >
      {children}
    </a>
  );
}

const QUALITY: Record<number, string> = { 5: "Excellent", 4: "Great", 3: "Good", 2: "Fair", 1: "Poor" };

export default function DashboardPage() {
  const today = todayISO();
  const { data: profile } = useProfile();
  const { data: todayLog = [] } = useFoodLog(today);
  const { data: weekly = [] } = useWeeklyCalories();
  const { data: weights = [] } = useBodyWeights();
  const { data: sleepLogs = [] } = useSleepLogs();
  const { data: todayHydration = [] } = useHydrationLogs(today);
  const { data: steps = [] } = useSteps();

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
  const targetCarbs = profile?.target_carbs || 300;
  const targetFat = profile?.target_fat || 80;
  const calPct = Math.round((totals.cal / targetCal) * 100) || 0;
  const protPct = Math.round((totals.p / targetP) * 100) || 0;

  // Weights are ascending (oldest→newest).
  const latestWeight = weights[weights.length - 1];
  const prevWeight = weights[weights.length - 2];
  const bwDelta = latestWeight && prevWeight ? round(latestWeight.weight - prevWeight.weight) : null;
  const wUnit = latestWeight?.unit || profile?.weight_unit || "lbs";
  const trendVals = weights.slice(-10).map((w) => w.weight);
  const weight30dRef = weights.length > 1 ? weights[Math.max(0, weights.length - 30)].weight : null;
  const delta30 = latestWeight && weight30dRef != null ? round(latestWeight.weight - weight30dRef) : null;

  // Today's vitals.
  const sleepToday = sleepLogs[0];
  const sleepHours = sleepToday?.duration_hours ?? null;
  const sleepQuality = sleepToday?.quality != null ? QUALITY[sleepToday.quality] || "—" : "—";
  const hydrationMl = todayHydration.reduce((s, h) => s + Number(h.amount_ml), 0);
  const hydrationTarget = 3500;
  const stepsToday = steps[0]?.step_count ?? 0;
  const stepsTarget = 10000;

  // Weekly calories → bars + streak. weekly is oldest→newest (7 entries).
  const calBars = weekly.map((d, i) => {
    const diff = d.calories - targetCal;
    const color = diff > 100 ? C.high : diff < -100 ? C.accent : C.mint;
    const glow = diff > 100 ? "rgba(245,101,101,0.35)" : diff < -100 ? "rgba(24,155,245,0.35)" : "rgba(47,227,168,0.35)";
    const label = new Date(d.date + "T00:00").toLocaleDateString("en", { weekday: "short" });
    return { label, value: d.calories, color, glow, bright: i === weekly.length - 1 };
  });
  const statusOf = (cal: number): "met" | "over" | "under" | "none" => {
    if (!cal) return "none";
    const diff = cal - targetCal;
    return diff > 100 ? "over" : diff < -100 ? "under" : "met";
  };
  const weekStatuses = weekly.map((d) => ({ s: statusOf(d.calories), label: new Date(d.date + "T00:00").toLocaleDateString("en", { weekday: "narrow" }) }));
  let currentStreak = 0;
  for (let i = weekStatuses.length - 1; i >= 0; i--) {
    if (weekStatuses[i].s === "met") currentStreak++;
    else break;
  }
  let recordStreak = 0,
    run = 0;
  for (const w of weekStatuses) {
    if (w.s === "met") {
      run++;
      recordStreak = Math.max(recordStreak, run);
    } else run = 0;
  }

  // Hero headline reacts to today's intake.
  const heroTitle =
    totals.cal === 0
      ? "Log your first meal to start the signal"
      : Math.abs(totals.cal - targetCal) <= 100
      ? "Your signal is on-track today"
      : totals.cal < targetCal
      ? "You're under target today"
      : "You're over your target today";

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="p-6 max-w-[1200px]">
      <DashboardSwitcher />

      <SignalHero
        eyebrow={`Health · ${dateLabel}`}
        title={heroTitle}
        stat={calPct}
        statUnit="% of calorie goal"
        statSub={currentStreak > 0 ? `▲ ${currentStreak}d streak` : undefined}
        accentVar="#2fe3a8"
        ringColor={0x189bf5}
        nodeColor={0x2fe3a8}
        caption="Macros, weight, sleep and hydration — read as one continuous signal."
      />

      {/* Top stat cards */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <StatTile label="Calories Today" value={Math.round(totals.cal)} unit={`/ ${targetCal}`} sub={`${calPct}% of goal`} trend={calPct > 110 ? "down" : calPct >= 80 ? "up" : "neutral"} tone={calPct > 110 ? "high" : "blue"} icon={<Apple size={18} />} href="/nutrition" />
        <StatTile label="Protein Today" value={`${Math.round(totals.p)}g`} unit={`/ ${targetP}g`} sub={`${protPct}% of goal`} trend={totals.p >= targetP ? "up" : "neutral"} tone="mint" icon={<Activity size={18} />} href="/nutrition" />
        <StatTile label="Body Weight" value={latestWeight ? latestWeight.weight : "—"} unit={latestWeight ? wUnit : ""} sub={bwDelta != null ? `${bwDelta >= 0 ? "+" : ""}${bwDelta} vs prev` : "No entries yet"} trend={bwDelta != null && bwDelta > 0 ? "up" : bwDelta != null && bwDelta < 0 ? "down" : "neutral"} tone="blue" icon={<Scale size={18} />} href="/weight" />
        <StatTile label="Sleep" value={sleepHours != null ? sleepHours : "—"} unit={sleepHours != null ? "h" : ""} sub={sleepQuality} trend="neutral" tone="blue" icon={<Moon size={18} />} href="/sleep" />
      </div>

      <QuickActions
        actions={[
          { label: "Log Food", icon: <Utensils size={15} />, href: "/nutrition" },
          { label: "Meal Plans", icon: <ClipboardList size={15} />, href: "/meal-plans" },
          { label: "Hydration", icon: <Droplets size={15} />, href: "/hydration" },
          { label: "Body Weight", icon: <Scale size={15} />, href: "/weight" },
          { label: "Sleep", icon: <Moon size={15} />, href: "/sleep" },
          { label: "Steps", icon: <Footprints size={15} />, href: "/steps" },
          { label: "Blood Panels", icon: <TestTube size={15} />, href: "/bloodwork" },
        ]}
      />

      {/* Main grid: 2fr / 1fr */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
        <div className="flex flex-col gap-4 min-w-0">
          <Panel title="Calorie Intake — Last 7 Days" action={<ActionLink href="/nutrition">Log food →</ActionLink>}>
            {calBars.length === 0 ? (
              <div className="text-text-3 text-sm py-8 text-center">No calories logged this week.</div>
            ) : (
              <>
                <BarChart height={140} target={targetCal} targetLabel="Goal" valueFormat={(v) => (v / 1000).toFixed(2) + "k"} data={calBars} />
                <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
                  <span className="data text-[10.5px] text-text-3 tracking-wide">TARGET · {targetCal} KCAL/DAY</span>
                  <span className="flex gap-3 data text-[10px] text-text-3">
                    <span className="inline-flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-sm" style={{ background: C.mint }} />±100</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-sm" style={{ background: C.accent }} />Under</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-[7px] h-[7px] rounded-sm" style={{ background: C.high }} />Over</span>
                  </span>
                </div>
              </>
            )}
          </Panel>

          <Panel title="Today's Macros" action={<ActionLink href="/nutrition">Edit →</ActionLink>}>
            <div className="flex gap-6 items-center flex-wrap">
              <Ring value={totals.p} target={targetP} unit="g protein" size={96} overIsGood color={C.accent} />
              <div className="flex-1 min-w-[200px]">
                <MacroBar protein={totals.p} carbs={totals.c} fat={totals.f} calories={totals.cal} />
                <div className="grid grid-cols-3 gap-2.5 mt-4">
                  <DashProgress label="Protein" value={totals.p} max={targetP} color={C.sProtein} />
                  <DashProgress label="Carbs" value={totals.c} max={targetCarbs} color={C.sCarbs} />
                  <DashProgress label="Fat" value={totals.f} max={targetFat} color={C.sFat} />
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Weight Trend" action={<ActionLink href="/weight">View all →</ActionLink>}>
            {!latestWeight ? (
              <div className="text-text-3 text-sm py-6">Log your weight to see the trend.</div>
            ) : (
              <div className="flex items-center gap-5">
                <div className="flex-none">
                  <div className="metric text-[40px] leading-none">
                    {latestWeight.weight}
                    <span className="data text-[16px] text-text-2 ml-1">{wUnit}</span>
                  </div>
                  {delta30 != null && (
                    <div className="data text-[11px] mt-1.5" style={{ color: delta30 > 0 ? C.mint : delta30 < 0 ? C.warn : C.t3 }}>
                      {delta30 > 0 ? "▲ +" : delta30 < 0 ? "▼ " : ""}
                      {delta30} / 30d
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Sparkline data={trendVals} />
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <Panel title="Goal Streak">
            <div className="flex items-stretch gap-3">
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-border py-3 px-2" style={{ background: C.s1 }}>
                <Flame size={20} style={{ color: C.mint }} />
                <div className="metric text-[32px] mt-1" style={{ color: C.mint }}>{currentStreak}</div>
                <div className="lab-label mt-1">Current · days</div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-border py-3 px-2" style={{ background: C.s1 }}>
                <Trophy size={20} style={{ color: C.steel }} />
                <div className="metric text-[32px] mt-1">{recordStreak}</div>
                <div className="lab-label mt-1">Record · days</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3.5">
              <span className="lab-label">This week</span>
              <div className="flex gap-1.5">
                {weekStatuses.map((w, i) => {
                  const c = w.s === "met" ? C.mint : w.s === "over" ? C.high : C.accent;
                  return (
                    <span key={i} title={w.s} className="flex flex-col items-center gap-1">
                      <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: w.s === "met" ? c : "transparent", border: "1.5px solid " + (w.s === "none" ? C.line2 : c) }}>
                        {w.s === "met" && <Check size={11} style={{ color: C.ink }} />}
                      </span>
                      <span className="data text-[9px] text-text-3">{w.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="text-[11.5px] text-text-3 mt-3 leading-[1.45]">
              Hit calories within ±100 to keep the streak. Going over or under by more than 100 resets it.
            </div>
          </Panel>

          <Panel title="Vitals">
            <BarRow label="Sleep" value={sleepHours != null ? sleepHours : 0} target={8} unit=" / 8h" color={C.sleep} />
            <BarRow label="Hydration" value={(hydrationMl / 1000).toFixed(1)} target={hydrationTarget / 1000} unit=" / 3.5L" color={C.sCarbs} />
            <BarRow label="Steps" value={(stepsToday / 1000).toFixed(1) + "k"} target={stepsTarget / 1000} unit=" / 10k" color={C.sProtein} />
          </Panel>

          <Panel title="Recent Weight" action={<ActionLink href="/weight">All →</ActionLink>}>
            {weights.length === 0 ? (
              <div className="text-text-3 text-sm py-2">No entries yet.</div>
            ) : (
              <div className="flex flex-col">
                {[...weights].reverse().slice(0, 5).map((w, i, arr) => {
                  const prev = arr[i + 1];
                  const delta = prev ? round(w.weight - prev.weight) : null;
                  return (
                    <div key={w.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="data text-[11.5px] text-text-3">{formatDate(w.logged_date)}</span>
                      <div className="flex items-baseline gap-2">
                        {delta != null && (
                          <span className="data text-[10.5px]" style={{ color: delta > 0 ? C.warn : delta < 0 ? C.mint : C.t3 }}>
                            {delta > 0 ? "+" : ""}
                            {delta}
                          </span>
                        )}
                        <span className="data text-[13.5px]" style={{ color: i === 0 ? C.accentBright : C.t1 }}>
                          {w.weight} {w.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
