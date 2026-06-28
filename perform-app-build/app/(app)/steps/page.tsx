"use client";

import { useMemo, useState } from "react";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { useSteps, useUpsertSteps, useDeleteSteps } from "@/hooks/useTraining";
import { todayISO, localISO, formatDate, cn } from "@/lib/utils";
import { Footprints, Smartphone, Trash2, ChevronDown, Plus, Check } from "lucide-react";
import toast from "react-hot-toast";

const STEP_GOAL = 10000;

export default function StepsPage() {
  const { data: steps = [] } = useSteps();
  const upsert = useUpsertSteps();
  const deleteSteps = useDeleteSteps();
  const [date, setDate] = useState(todayISO());
  const [count, setCount] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  function handleLog() {
    const n = parseInt(count);
    if (!n && n !== 0) {
      toast.error("Enter a step count");
      return;
    }
    // Adds to the day's running total rather than overwriting it.
    upsert.mutate(
      { logged_date: date, step_count: n, source: "manual", mode: "add" },
      {
        onSuccess: () => {
          toast.success("Steps added to total");
          setCount("");
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function toggleEntry(id: string, d: string, c: number) {
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
      setDate(d);
      setEditVal(String(c));
    }
  }

  function saveEdit(d: string) {
    const n = parseInt(editVal);
    if (isNaN(n)) {
      toast.error("Enter a step count");
      return;
    }
    upsert.mutate(
      { logged_date: d, step_count: n, source: "manual", mode: "set" },
      {
        onSuccess: () => {
          toast.success("Entry updated");
          setOpenId(null);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function removeEntry(id: string) {
    deleteSteps.mutate(id, {
      onSuccess: () => {
        toast.success("Entry deleted");
        setOpenId(null);
      },
      onError: (e) => toast.error(e.message),
    });
  }

  const today = steps.find((s) => s.logged_date === todayISO());
  const weekAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return localISO(d);
  })();
  const weekTotal = steps
    .filter((s) => s.logged_date >= weekAgo)
    .reduce((a, s) => a + s.step_count, 0);
  const avg = steps.length
    ? Math.round(steps.reduce((a, s) => a + s.step_count, 0) / steps.length)
    : 0;

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yr = String(now.getFullYear());
  const monthTotal = steps.filter((s) => s.logged_date.startsWith(ym)).reduce((a, s) => a + s.step_count, 0);
  const yearTotal = steps.filter((s) => s.logged_date.startsWith(yr)).reduce((a, s) => a + s.step_count, 0);
  const avgPct = Math.min(100, Math.round((avg / STEP_GOAL) * 100));

  // last 30 days trend (sorted ascending)
  const trend = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 29);
    const cut = localISO(cutoff);
    return [...steps]
      .filter((s) => s.logged_date >= cut)
      .sort((a, b) => a.logged_date.localeCompare(b.logged_date));
  }, [steps]);
  const trendMax = Math.max(STEP_GOAL, ...trend.map((s) => s.step_count), 1);

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader eyebrow="VITALS · STEPS" title="Steps" subtitle="Track daily step count" />

      {/* Apple Health notice */}
      <div className="card mb-4 border-accent/30">
        <div className="flex items-start gap-3">
          <Smartphone className="text-accent flex-shrink-0 mt-0.5" size={18} />
          <div>
            <div className="text-sm font-medium mb-1">
              Apple Health sync coming with the iOS app
            </div>
            <div className="text-[13px] text-text-2">
              Once the iPhone app is live, your daily steps will sync
              automatically from Apple Health&apos;s pedometer. For now, you can
              log steps manually below and they&apos;ll appear here and in the
              app.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <StatCard
          label="Today"
          value={today ? today.step_count.toLocaleString() : "0"}
          sub={today?.source === "apple_health" ? "From Apple Health" : "Manual"}
        />
        <StatCard
          label="Last 7 Days"
          value={weekTotal.toLocaleString()}
          sub="total steps"
        />
        <StatCard
          label="Days Tracked"
          value={steps.length.toLocaleString()}
          sub="entries logged"
        />
      </div>

      {/* Monthly / Yearly / Daily-average line with circle graph */}
      <div className="card mb-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a2235" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={avgPct >= 100 ? "#2fe3a8" : "#189bf5"} strokeWidth="3"
                strokeDasharray={`${avgPct} ${100 - avgPct}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-accent">{avg.toLocaleString()}</span>
              <span className="text-[9px] text-text-3">daily avg</span>
            </div>
          </div>
          <div className="flex-1 flex gap-8 flex-wrap">
            <div>
              <div className="text-[11px] text-text-3 uppercase tracking-wide">This Month</div>
              <div className="text-2xl font-bold">{monthTotal.toLocaleString()}</div>
              <div className="text-[11px] text-text-3">steps in {now.toLocaleDateString("en", { month: "long" })}</div>
            </div>
            <div>
              <div className="text-[11px] text-text-3 uppercase tracking-wide">This Year</div>
              <div className="text-2xl font-bold">{yearTotal.toLocaleString()}</div>
              <div className="text-[11px] text-text-3">steps in {yr}</div>
            </div>
            <div>
              <div className="text-[11px] text-text-3 uppercase tracking-wide">Daily Average</div>
              <div className="text-2xl font-bold">{avg.toLocaleString()}</div>
              <div className="text-[11px] text-text-3">{avgPct}% of {STEP_GOAL.toLocaleString()} goal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="card mb-4">
        <div className="card-title">30-Day Trend</div>
        {trend.length === 0 ? (
          <div className="text-text-3 text-sm py-3">No step data in the last 30 days.</div>
        ) : (
          <div className="flex items-end gap-0.5 h-40 pb-6 relative mt-1">
            {trend.map((s) => {
              const h = Math.max(3, Math.round((100 * s.step_count) / trendMax));
              const hit = s.step_count >= STEP_GOAL;
              return (
                <div key={s.id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-bg-3 text-text-1 text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
                    {formatDate(s.logged_date)}: {s.step_count.toLocaleString()}
                  </div>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{ height: `${h}%`, background: hit ? "#2fe3a8" : "rgba(24,155,245,0.5)" }}
                  />
                </div>
              );
            })}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-text-3/40 pointer-events-none"
              style={{ bottom: `${Math.round((100 * STEP_GOAL) / trendMax) + 24}px` }}
            />
          </div>
        )}
        <div className="text-[11px] text-text-3 mt-1">Goal line: {STEP_GOAL.toLocaleString()} steps/day</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card">
          <div className="card-title">Log Steps Manually</div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="label">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="label">Steps to add</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="2500"
              />
            </div>
          </div>
          <button className="btn btn-primary group mt-3" onClick={handleLog}>
            <span className="shine-overlay" />
            <Plus size={15} /> Add to Total
          </button>
          <div className="text-[11px] text-text-3 mt-2">
            Adds to the selected day&apos;s running total. To set an exact value, edit the entry below.
          </div>
        </div>

        <div className="card">
          <div className="card-title">Recent History</div>
          {steps.length === 0 ? (
            <div className="text-text-3 text-sm py-3">
              No step data yet.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {steps.map((s) => {
                const open = openId === s.id;
                return (
                  <div
                    key={s.id}
                    className="bg-bg-2 rounded-lg border border-border overflow-hidden"
                  >
                    <button
                      onClick={() => toggleEntry(s.id, s.logged_date, s.step_count)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-bg-3 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Footprints size={15} className="text-text-3" />
                        <span className="text-sm text-text-2">
                          {formatDate(s.logged_date)}
                        </span>
                      </div>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-accent">
                          {s.step_count.toLocaleString()}
                        </span>
                        <ChevronDown
                          size={14}
                          className={cn("text-text-3 transition-transform", open && "rotate-180")}
                        />
                      </span>
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 border-t border-border flex items-end gap-2">
                        <div className="flex-1">
                          <label className="label">Exact step count</label>
                          <input
                            type="number"
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                          />
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => saveEdit(s.logged_date)}
                          title="Save exact value"
                        >
                          <Check size={14} /> Save
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removeEntry(s.id)}
                          title="Delete entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
