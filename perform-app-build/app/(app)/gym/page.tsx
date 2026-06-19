"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DashboardSwitcher } from "@/components/DashboardSwitcher";
import { Reveal, Stagger, StaggerItem } from "@/components/visual/Motion";
import { useWorkouts, useLiftProgression, useExercises } from "@/hooks/useTraining";
import { useProtocols } from "@/hooks/useCompounds";
import { formatDate, getNextDoseInfo, localISO } from "@/lib/utils";
import { Frequency } from "@/types/database";
import { WorkoutVolumeChart, MuscleSplitChart } from "@/components/charts/WorkoutAnalytics";
import {
  Dumbbell,
  Trophy,
  FlaskConical,
  Activity,
  CalendarClock,
  ArrowRight,
  Syringe,
  BarChart3,
  PieChart,
} from "lucide-react";

function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  // Epley formula
  return Math.round(weight * (1 + reps / 30));
}

export default function GymDashboardPage() {
  const { data: workouts = [], isLoading: loadingW } = useWorkouts();
  const { data: lifts = [] } = useLiftProgression();
  const { data: protocols = [] } = useProtocols();
  const { data: exercises = [] } = useExercises();

  // exercise name → muscle group for the split chart
  const muscleMap = useMemo(() => {
    const m: Record<string, string> = {};
    exercises.forEach((e) => {
      if (e.muscle_group) m[e.name.toLowerCase()] = e.muscle_group;
    });
    return m;
  }, [exercises]);

  const sessionUnit = workouts.find((w) => w.sets?.length)?.sets?.[0]?.weight_unit || "";

  // Recent sessions (latest 5)
  const recent = workouts.slice(0, 5);

  // Volume + set tallies for the last 7 days
  const weekStats = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const startISO = localISO(start);
    let sets = 0;
    let tonnage = 0;
    let sessions = 0;
    workouts.forEach((w) => {
      if (w.session_date < startISO) return;
      sessions += 1;
      (w.sets || []).forEach((s) => {
        sets += 1;
        const reps = parseInt(s.reps || "0", 10) || 0;
        tonnage += (s.weight || 0) * reps;
      });
    });
    return { sets, tonnage: Math.round(tonnage), sessions };
  }, [workouts]);

  // Top PRs by estimated 1RM
  const topPRs = useMemo(() => {
    return [...lifts]
      .map((l) => {
        const best = l.history.reduce(
          (acc, e) => {
            const reps = parseInt(e.reps || "0", 10) || 1;
            const e1rm = estimate1RM(e.weight, reps);
            return e1rm > acc.e1rm ? { e1rm, weight: e.weight, reps } : acc;
          },
          { e1rm: 0, weight: 0, reps: 0 }
        );
        return { name: l.name, unit: l.unit, ...best };
      })
      .sort((a, b) => b.e1rm - a.e1rm)
      .slice(0, 5);
  }, [lifts]);

  // Compounds due today across active protocols
  const dueToday = useMemo(() => {
    const rows: { name: string; dose: string; freq: string; status: string; label: string; dueToday: boolean }[] = [];
    protocols
      .filter((p) => p.is_active)
      .forEach((p) => {
        (p.compounds || []).forEach((c) => {
          const info = getNextDoseInfo(c.last_dose?.logged_at ?? null, c.frequency as Frequency);
          rows.push({
            name: c.compound_name,
            dose: `${c.dose} ${c.compound_unit}`,
            freq: c.frequency,
            status: info.status,
            label: info.label,
            dueToday: info.dueToday,
          });
        });
      });
    // Surface the injections that need taking today at the top of the list.
    rows.sort((a, b) => Number(b.dueToday) - Number(a.dueToday));
    return rows;
  }, [protocols]);

  return (
    <div className="p-6 max-w-[1200px]">
      <DashboardSwitcher />

      {/* Hero spotlight — weekly tonnage headline */}
      <div className="panel hairline-top px-5 py-5 sm:px-6 sm:py-6 mb-5 animate-fade-in">
        <div className="absolute -top-24 -right-12 w-72 h-72 bg-brand-gradient opacity-20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-text-3 font-semibold">
              Gym Dashboard · Last 7 days
            </div>
            <h1 className="mt-1.5 text-3xl sm:text-4xl font-display font-bold leading-none tabular-nums">
              <span className="text-brand">{weekStats.tonnage.toLocaleString()}</span>
              {sessionUnit && <span className="text-base text-text-2 font-normal ml-2">{sessionUnit} moved</span>}
            </h1>
            <p className="text-sm text-text-2 mt-2">
              {weekStats.sessions} session{weekStats.sessions !== 1 ? "s" : ""} · {weekStats.sets} sets
              <span className="text-text-3"> · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
            </p>
          </div>
          <Link href="/workouts" className="btn btn-primary btn-sm group active:scale-95">
            <span className="shine-overlay" />
            <Dumbbell size={14} /> Log Workout
          </Link>
        </div>
      </div>

      {/* Week summary */}
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StaggerItem>
          <div className="stat-card group h-full">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] text-text-3 uppercase tracking-[0.12em] font-semibold">Sessions (7d)</div>
                <div className="text-2xl font-display font-bold mt-1.5 leading-none tabular-nums">{weekStats.sessions}</div>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ background: "#3b82f61a", color: "#3b82f6", boxShadow: "inset 0 0 0 1px #3b82f633" }}>
                <Activity size={18} />
              </div>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="stat-card group h-full">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] text-text-3 uppercase tracking-[0.12em] font-semibold">Sets (7d)</div>
                <div className="text-2xl font-display font-bold mt-1.5 leading-none tabular-nums">{weekStats.sets}</div>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ background: "#2dd4bf1a", color: "#2dd4bf", boxShadow: "inset 0 0 0 1px #2dd4bf33" }}>
                <BarChart3 size={18} />
              </div>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="stat-card group h-full">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] text-text-3 uppercase tracking-[0.12em] font-semibold">Tonnage (7d)</div>
                <div className="text-2xl font-display font-bold mt-1.5 leading-none tabular-nums">
                  {weekStats.tonnage.toLocaleString()}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ background: "#7c5cff1a", color: "#9d7bff", boxShadow: "inset 0 0 0 1px #7c5cff33" }}>
                <Dumbbell size={18} />
              </div>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="stat-card group h-full">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] text-text-3 uppercase tracking-[0.12em] font-semibold">Tracked lifts</div>
                <div className="text-2xl font-display font-bold mt-1.5 leading-none tabular-nums">{lifts.length}</div>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ background: "#f6ad551a", color: "#f6ad55", boxShadow: "inset 0 0 0 1px #f6ad5533" }}>
                <Trophy size={18} />
              </div>
            </div>
          </div>
        </StaggerItem>
      </Stagger>

      {/* Analytics */}
      <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <div className="card-title flex items-center gap-2 mb-3">
            <BarChart3 size={13} className="text-accent" /> Training Volume — Last 8 Weeks
          </div>
          <WorkoutVolumeChart workouts={workouts} unit={sessionUnit} />
        </div>
        <div className="card">
          <div className="card-title flex items-center gap-2 mb-3">
            <PieChart size={13} className="text-accent" /> Set Split by Muscle — Last 30 Days
          </div>
          <MuscleSplitChart workouts={workouts} muscleMap={muscleMap} />
        </div>
      </Reveal>

      <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent sessions */}
        <div className="card">
          <div className="card-title flex items-center gap-2 mb-3">
            <Activity size={13} className="text-accent" /> Recent Sessions
          </div>
          {loadingW ? (
            <div className="text-text-3 text-sm">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="text-text-3 text-sm py-6 text-center">
              No sessions yet.{" "}
              <Link href="/workouts" className="text-accent hover:underline">
                Log your first workout
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((w) => (
                <Link
                  key={w.id}
                  href="/workouts"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-2 border border-border hover:border-accent/40 transition-colors group"
                >
                  <div>
                    <div className="text-sm font-medium">{w.name}</div>
                    <div className="text-[11px] text-text-3">
                      {formatDate(w.session_date)} · {w.sets?.length || 0} sets
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-text-3 group-hover:text-accent transition-colors"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Compounds due today */}
        <div className="card">
          <div className="card-title flex items-center gap-2 mb-3">
            <Syringe size={13} className="text-accent" /> Protocol — Today
          </div>
          {dueToday.length === 0 ? (
            <div className="text-text-3 text-sm py-6 text-center">
              No active protocols.{" "}
              <Link href="/compounds" className="text-accent hover:underline">
                Set one up
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {dueToday.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-2 border border-border"
                >
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      <FlaskConical size={12} className="text-text-3" />
                      {d.name}
                    </div>
                    <div className="text-[11px] text-text-3">
                      {d.dose} · {d.freq}
                    </div>
                  </div>
                  {d.dueToday ? (
                    <span className="badge bg-status-red text-white font-semibold shadow-soft">
                      Due Now
                    </span>
                  ) : (
                    <span
                      className={`badge ${
                        d.status === "urgent"
                          ? "text-status-amber"
                          : d.status === "none"
                          ? "text-text-3"
                          : "text-status-green"
                      }`}
                    >
                      {d.status === "none" ? "—" : d.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal records */}
        <div className="card lg:col-span-2">
          <div className="card-title flex items-center gap-2 mb-3">
            <Trophy size={13} className="text-status-amber" /> Top Estimated 1RMs
          </div>
          {topPRs.length === 0 ? (
            <div className="text-text-3 text-sm py-6 text-center">
              Log weighted sets to start tracking PRs.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topPRs.map((p) => (
                <div key={p.name} className="card-sm animate-fade-in">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-2xl font-bold mt-1 leading-none text-accent">
                    {p.e1rm}
                    <span className="text-xs text-text-2 ml-1 font-normal">{p.unit}</span>
                  </div>
                  <div className="text-[11px] text-text-3 mt-1.5 flex items-center gap-1">
                    <CalendarClock size={10} />
                    Best set: {p.weight}
                    {p.unit} × {p.reps}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
