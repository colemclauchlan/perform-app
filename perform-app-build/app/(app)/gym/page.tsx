"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardSwitcher } from "@/components/DashboardSwitcher";
import { useWorkouts, useLiftProgression, useExercises } from "@/hooks/useTraining";
import { useProtocols } from "@/hooks/useCompounds";
import { formatDate, getNextDoseInfo } from "@/lib/utils";
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
    const startISO = start.toISOString().slice(0, 10);
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
    const rows: { name: string; dose: string; freq: string; status: string; label: string }[] = [];
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
          });
        });
      });
    return rows;
  }, [protocols]);

  return (
    <div className="p-6 max-w-[1200px]">
      <DashboardSwitcher />
      <PageHeader
        title="Gym Dashboard"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        action={
          <Link href="/workouts" className="btn btn-primary btn-sm active:scale-95">
            <Dumbbell size={14} /> Log Workout
          </Link>
        }
      />

      {/* Week summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="stat-card animate-fade-in">
          <div className="text-[11px] text-text-3 uppercase tracking-wider">Sessions (7d)</div>
          <div className="text-2xl font-bold mt-1.5 leading-none">{weekStats.sessions}</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="text-[11px] text-text-3 uppercase tracking-wider">Sets (7d)</div>
          <div className="text-2xl font-bold mt-1.5 leading-none">{weekStats.sets}</div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="text-[11px] text-text-3 uppercase tracking-wider">Tonnage (7d)</div>
          <div className="text-2xl font-bold mt-1.5 leading-none">
            {weekStats.tonnage.toLocaleString()}
          </div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="text-[11px] text-text-3 uppercase tracking-wider">Tracked lifts</div>
          <div className="text-2xl font-bold mt-1.5 leading-none">{lifts.length}</div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                  <span
                    className={`badge ${
                      d.status === "overdue"
                        ? "text-status-red"
                        : d.status === "urgent"
                        ? "text-status-amber"
                        : d.status === "none"
                        ? "text-text-3"
                        : "text-status-green"
                    }`}
                  >
                    {d.status === "overdue" ? "Due" : d.status === "none" ? "—" : d.label}
                  </span>
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
      </div>
    </div>
  );
}
