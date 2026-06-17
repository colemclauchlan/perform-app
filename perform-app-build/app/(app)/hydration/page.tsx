"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  useHydrationLogs,
  useAddHydration,
  useDeleteHydration,
  useWeeklyHydration,
} from "@/hooks/useBodyMetrics";
import { useProfile, useUpdateProfile } from "@/hooks/useNutrition";
import { todayISO } from "@/lib/utils";
import { Droplets, Plus, Trash2, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

const QUICK_ML = [150, 250, 350, 500, 750, 1000];
const DEFAULT_TARGET_ML = 2500;

function mlToOz(ml: number) {
  return Math.round(ml * 0.03381 * 10) / 10;
}

// Bottle "drains" as the user drinks toward their goal: water shown = remaining intake.
function WaterBottle({ pct, onAdd }: { pct: number; onAdd: () => void }) {
  const remaining = Math.max(0, 100 - pct); // fill level = how much is left to drink
  const fillY = 18 + (84 * (100 - remaining)) / 100; // y where water surface sits (more drunk = lower water)
  const done = pct >= 100;
  return (
    <button
      onClick={onAdd}
      title="Tap to add 250ml"
      className="relative group focus:outline-none"
      aria-label="Add water"
    >
      <svg width="92" height="150" viewBox="0 0 92 150" className="overflow-visible">
        <defs>
          <clipPath id="bottleClip">
            <path d="M30 18 q0 -8 8 -8 h16 q8 0 8 8 v6 q0 4 4 8 q12 12 12 30 v54 q0 14 -14 14 h-36 q-14 0 -14 -14 v-54 q0 -18 12 -30 q4 -4 4 -8 z" />
          </clipPath>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={done ? "#22d3a5" : "#38bdf8"} />
            <stop offset="100%" stopColor={done ? "#10b981" : "#2563eb"} />
          </linearGradient>
        </defs>
        {/* water (clipped to bottle) */}
        <g clipPath="url(#bottleClip)">
          <rect x="18" y="0" width="60" height="120" fill="#0e1626" />
          <rect
            x="18"
            y={fillY}
            width="60"
            height={120 - fillY + 10}
            fill="url(#waterGrad)"
            style={{ transition: "y 0.7s cubic-bezier(0.4,0,0.2,1)" }}
          />
          {/* surface highlight */}
          <rect
            x="18"
            y={fillY}
            width="60"
            height="3"
            fill="#ffffff"
            opacity="0.35"
            style={{ transition: "y 0.7s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </g>
        {/* bottle outline */}
        <path
          d="M30 18 q0 -8 8 -8 h16 q8 0 8 8 v6 q0 4 4 8 q12 12 12 30 v54 q0 14 -14 14 h-36 q-14 0 -14 -14 v-54 q0 -18 12 -30 q4 -4 4 -8 z"
          fill="none"
          stroke="#2a3f5e"
          strokeWidth="2.5"
          className="group-hover:stroke-accent transition-colors"
        />
        {/* cap */}
        <rect x="36" y="2" width="20" height="9" rx="2" fill="#2a3f5e" className="group-hover:fill-accent transition-colors" />
      </svg>
      <span className="block text-center text-[10px] text-text-3 mt-1 group-hover:text-accent transition-colors">
        {done ? "Goal reached" : "Tap to add 250ml"}
      </span>
    </button>
  );
}

export default function HydrationPage() {
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const { data: logs = [] } = useHydrationLogs(date);
  const { data: weekly = [] } = useWeeklyHydration();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const addHydration = useAddHydration();
  const deleteHydration = useDeleteHydration();

  const DAILY_TARGET_ML = profile?.preferences?.hydration_goal_ml || DEFAULT_TARGET_ML;
  const todayTotal = logs.reduce((a, l) => a + l.amount_ml, 0);
  const pct = Math.min(100, Math.round((todayTotal / DAILY_TARGET_ML) * 100));

  function saveGoal() {
    const ml = parseInt(goalInput);
    if (!ml || ml < 250) { toast.error("Enter a goal of at least 250ml"); return; }
    updateProfile.mutate(
      { preferences: { ...(profile?.preferences || {}), hydration_goal_ml: ml } },
      {
        onSuccess: () => { toast.success("Goal updated"); setGoalOpen(false); },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function handleAdd(ml: number) {
    addHydration.mutate(
      { logged_date: date, amount_ml: ml, source: "manual" },
      {
        onSuccess: () => toast.success(`+${ml}ml logged`),
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function handleCustomAdd() {
    const ml = parseInt(amount);
    if (!ml || ml <= 0) { toast.error("Enter a valid amount"); return; }
    handleAdd(ml);
    setAmount("");
  }

  const maxBar = Math.max(DAILY_TARGET_ML, ...weekly.map((w) => w.total_ml), 1);

  return (
    <div className="p-6 max-w-[900px]">
      <PageHeader title="Hydration" subtitle="Track your daily water intake" />

      {/* Big ring/progress */}
      <div className="card mb-5">
        <div className="flex items-center gap-6">
          {/* Circular progress */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a2235" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#2563eb" strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-accent">{pct}%</span>
              <span className="text-[10px] text-text-3">of goal</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">{todayTotal}<span className="text-base font-normal text-text-2 ml-1">ml</span></div>
              <button
                className="btn btn-ghost btn-sm ml-auto"
                onClick={() => { setGoalInput(String(DAILY_TARGET_ML)); setGoalOpen((v) => !v); }}
              >
                <Settings2 size={13} /> Goal
              </button>
            </div>
            <div className="text-sm text-text-3 mt-0.5">{mlToOz(todayTotal)} fl oz · goal: {DAILY_TARGET_ML}ml</div>

            {goalOpen && (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Daily goal (ml)"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && saveGoal()}
                />
                <button className="btn btn-primary btn-sm" onClick={saveGoal}>Save</button>
              </div>
            )}

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-bg-3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full progress-bar"
                style={{ width: `${pct}%`, background: pct >= 100 ? "#22d3a5" : "#2563eb" }}
              />
            </div>
            <div className="text-[11px] text-text-3 mt-1">{DAILY_TARGET_ML - todayTotal > 0 ? `${DAILY_TARGET_ML - todayTotal}ml remaining` : "Goal reached!"}</div>
          </div>

          {/* Draining water bottle */}
          <div className="hidden sm:block flex-shrink-0">
            <WaterBottle pct={pct} onAdd={() => handleAdd(250)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Quick add */}
          <div className="card">
            <div className="card-title">Quick Add</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {QUICK_ML.map((ml) => (
                <button
                  key={ml}
                  onClick={() => handleAdd(ml)}
                  className="bg-bg-2 border border-border hover:border-accent hover:bg-accent-dim text-text-1 rounded-xl py-3 text-sm font-medium transition-all"
                >
                  <Droplets className="mx-auto mb-1 text-accent" size={16} />
                  {ml}ml
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom ml..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleCustomAdd()}
              />
              <button className="btn btn-primary" onClick={handleCustomAdd}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Today's log */}
          <div className="card">
            <div className="card-title">Today&apos;s Log</div>
            {logs.length === 0 ? (
              <div className="text-text-3 text-sm py-3">No entries for today.</div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {[...logs].reverse().map((l) => (
                  <div key={l.id} className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2 border border-border">
                    <div className="flex items-center gap-2">
                      <Droplets size={14} className="text-accent" />
                      <span className="text-sm font-medium">{l.amount_ml}ml</span>
                      <span className="text-[11px] text-text-3">{mlToOz(l.amount_ml)} fl oz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-3">
                        {new Date(l.created_at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => { deleteHydration.mutate(l.id); toast.success("Removed"); }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly chart */}
        <div className="card">
          <div className="card-title">Weekly Intake</div>
          <div className="flex items-end gap-1.5 h-40 pb-6 relative mt-2">
            {weekly.map((d, i) => {
              const pct = Math.max(4, Math.round((100 * d.total_ml) / maxBar));
              const label = new Date(d.date + "T00:00").toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
              const isToday = d.date === date;
              const over = d.total_ml >= DAILY_TARGET_ML;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-bg-3 text-text-1 text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
                    {d.total_ml}ml
                  </div>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${pct}%`,
                      background: isToday
                        ? over ? "#22d3a5" : "#2563eb"
                        : over ? "rgba(34,211,165,0.25)" : "rgba(37,99,235,0.2)",
                    }}
                  />
                  <span className="absolute -bottom-5 text-[9px] text-text-3">{label}</span>
                </div>
              );
            })}
            {/* Target line */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-text-3/40 pointer-events-none"
              style={{ bottom: `${Math.round((100 * DAILY_TARGET_ML) / maxBar) + 24}px` }}
            />
          </div>
          <div className="text-[11px] text-text-3 mt-1">Daily goal: {DAILY_TARGET_ML}ml</div>

          {/* Date picker */}
          <div className="mt-4">
            <label className="label">View / log for date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
