"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  useHydrationLogs,
  useAddHydration,
  useDeleteHydration,
  useWeeklyHydration,
} from "@/hooks/useBodyMetrics";
import { todayISO } from "@/lib/utils";
import { Droplets, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const QUICK_ML = [150, 250, 350, 500, 750, 1000];
const DAILY_TARGET_ML = 2500;

function mlToOz(ml: number) {
  return Math.round(ml * 0.03381 * 10) / 10;
}

export default function HydrationPage() {
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const { data: logs = [] } = useHydrationLogs(date);
  const { data: weekly = [] } = useWeeklyHydration();
  const addHydration = useAddHydration();
  const deleteHydration = useDeleteHydration();

  const todayTotal = logs.reduce((a, l) => a + l.amount_ml, 0);
  const pct = Math.min(100, Math.round((todayTotal / DAILY_TARGET_ML) * 100));

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
            <div className="text-3xl font-bold">{todayTotal}<span className="text-base font-normal text-text-2 ml-1">ml</span></div>
            <div className="text-sm text-text-3 mt-0.5">{mlToOz(todayTotal)} fl oz · goal: {DAILY_TARGET_ML}ml</div>

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-bg-3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full progress-bar"
                style={{ width: `${pct}%`, background: pct >= 100 ? "#22d3a5" : "#2563eb" }}
              />
            </div>
            <div className="text-[11px] text-text-3 mt-1">{DAILY_TARGET_ML - todayTotal > 0 ? `${DAILY_TARGET_ML - todayTotal}ml remaining` : "Goal reached!"}</div>
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
