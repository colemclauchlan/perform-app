"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  useSleepLogs,
  useAddSleepLog,
  useDeleteSleepLog,
} from "@/hooks/useBodyMetrics";
import { useProfile, useUpdateProfile } from "@/hooks/useNutrition";
import { todayISO, formatDate, round } from "@/lib/utils";
import { Moon, Star, Trash2, Clock, Target, Apple } from "lucide-react";
import toast from "react-hot-toast";

const SLEEP_TARGET = 8;
const DEFAULT_WEEKLY_GOAL = 56;

export default function SleepPage() {
  const { data: logs = [] } = useSleepLogs();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const addSleep = useAddSleepLog();
  const deleteSleep = useDeleteSleepLog();

  const [goalOpen, setGoalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const weeklyGoal = profile?.preferences?.sleep_weekly_goal_hours || DEFAULT_WEEKLY_GOAL;

  // sum sleep hours over the trailing 7 days
  const weekCutoff = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); })();
  const weekTotal = round(
    logs.filter((l) => l.logged_date >= weekCutoff).reduce((a, l) => a + (l.duration_hours || 0), 0),
    1
  );
  const weekPct = Math.min(100, Math.round((weekTotal / weeklyGoal) * 100));

  function saveGoal() {
    const h = parseFloat(goalInput);
    if (!h || h < 7) { toast.error("Enter a weekly goal of at least 7 hours"); return; }
    updateProfile.mutate(
      { preferences: { ...(profile?.preferences || {}), sleep_weekly_goal_hours: h } },
      { onSuccess: () => { toast.success("Weekly goal updated"); setGoalOpen(false); }, onError: (e) => toast.error(e.message) }
    );
  }

  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("23:00");
  const [end, setEnd] = useState("07:00");
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");

  function computeDuration(): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60; // crossed midnight
    return round(mins / 60, 2);
  }

  function handleSave() {
    const duration = computeDuration();
    const startDt = new Date(`${date}T${start}:00`);
    const endDt = new Date(`${date}T${end}:00`);
    if (endDt <= startDt) endDt.setDate(endDt.getDate() + 1);

    addSleep.mutate(
      {
        logged_date: date,
        sleep_start: startDt.toISOString(),
        sleep_end: endDt.toISOString(),
        duration_hours: duration,
        quality,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Sleep logged");
          setNotes("");
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  const recent = logs.slice(0, 14);
  const avgDuration = recent.length
    ? round(recent.reduce((a, l) => a + (l.duration_hours || 0), 0) / recent.length, 1)
    : 0;
  const rated = recent.filter((l) => l.quality);
  const avgQuality = rated.length
    ? round(rated.reduce((a, l) => a + (l.quality || 0), 0) / rated.length, 1)
    : 0;

  const maxBar = Math.max(10, ...recent.map((l) => l.duration_hours || 0));
  const previewDuration = computeDuration();

  return (
    <div className="p-6 max-w-[1000px]">
      <PageHeader title="Sleep" subtitle="Track sleep duration and quality" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-dim flex items-center justify-center">
            <Clock size={18} className="text-accent" />
          </div>
          <div>
            <div className="text-[11px] text-text-3">Avg Duration</div>
            <div className="text-xl font-bold">{avgDuration}<span className="text-sm font-normal text-text-2">h</span></div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-amber/10 flex items-center justify-center">
            <Star size={18} className="text-status-amber" />
          </div>
          <div>
            <div className="text-[11px] text-text-3">Avg Quality</div>
            <div className="text-xl font-bold">{avgQuality || "—"}<span className="text-sm font-normal text-text-2">/5</span></div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-green/10 flex items-center justify-center">
            <Moon size={18} className="text-status-green" />
          </div>
          <div>
            <div className="text-[11px] text-text-3">Nights Logged</div>
            <div className="text-xl font-bold">{logs.length}</div>
          </div>
        </div>
      </div>

      {/* Weekly goal progress */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="card-title !mb-0 flex items-center gap-1.5"><Target size={13} className="text-accent" /> Weekly Sleep Goal</div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setGoalInput(String(weeklyGoal)); setGoalOpen((v) => !v); }}>
            Edit goal
          </button>
        </div>
        {goalOpen && (
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Weekly goal (hours)"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && saveGoal()}
            />
            <button className="btn btn-primary btn-sm" onClick={saveGoal}>Save</button>
          </div>
        )}
        <div className="flex items-baseline justify-between text-sm mb-1.5">
          <span className="font-semibold">{weekTotal}h <span className="text-text-3 font-normal">of {weeklyGoal}h</span></span>
          <span className={weekPct >= 100 ? "text-status-green font-semibold" : "text-text-3"}>{weekPct}%</span>
        </div>
        <div className="h-3 bg-bg-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full progress-bar"
            style={{ width: `${weekPct}%`, background: weekPct >= 100 ? "#22d3a5" : "#2563eb" }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-text-3 bg-bg-2 rounded-lg px-3 py-2 border border-border">
          <Apple size={14} className="text-text-2 flex-shrink-0" />
          <span>Apple Health: log your Health app sleep totals here to keep weekly goal progress in sync. Native auto-sync requires the iOS app.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Log form */}
        <div className="card">
          <div className="card-title">Log Sleep</div>
          <div className="mb-3">
            <label className="label">Date (night of)</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex gap-2.5 mb-3">
            <div className="flex-1">
              <label className="label">Bedtime</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">Wake time</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="bg-bg-2 rounded-lg px-3 py-2 border border-border mb-3 text-center">
            <span className="text-2xl font-bold text-accent">{previewDuration}</span>
            <span className="text-sm text-text-2 ml-1">hours</span>
          </div>
          <div className="mb-3">
            <label className="label">Quality</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-2 rounded-lg border transition-all ${
                    quality >= q
                      ? "bg-status-amber/15 border-status-amber/40 text-status-amber"
                      : "bg-bg-2 border-border text-text-3 hover:text-text-2"
                  }`}
                >
                  <Star size={16} className="mx-auto" fill={quality >= q ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="label">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. woke up twice, used melatonin" />
          </div>
          <button className="btn btn-primary w-full" onClick={handleSave}>
            Save Sleep Log
          </button>
        </div>

        {/* Chart + history */}
        <div className="card">
          <div className="card-title">Last 14 Nights</div>
          {recent.length === 0 ? (
            <div className="text-text-3 text-sm py-4">No sleep logged yet.</div>
          ) : (
            <>
              <div className="flex items-end gap-1 h-32 pb-6 relative mt-1">
                {[...recent].reverse().map((l) => {
                  const pct = Math.max(4, Math.round((100 * (l.duration_hours || 0)) / maxBar));
                  const enough = (l.duration_hours || 0) >= SLEEP_TARGET;
                  const label = new Date(l.logged_date + "T00:00").getDate();
                  return (
                    <div key={l.id} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-bg-3 text-text-1 text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-border">
                        {l.duration_hours}h · {l.quality || "—"}/5
                      </div>
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${pct}%`,
                          background: enough ? "#22d3a5" : "rgba(37,99,235,0.4)",
                        }}
                      />
                      <span className="absolute -bottom-5 text-[8px] text-text-3">{label}</span>
                    </div>
                  );
                })}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-text-3/40 pointer-events-none"
                  style={{ bottom: `${Math.round((100 * SLEEP_TARGET) / maxBar) + 24}px` }}
                />
              </div>
              <div className="text-[11px] text-text-3 mt-1 mb-3">Target: {SLEEP_TARGET}h/night</div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2 border border-border">
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        {l.duration_hours}h
                        <span className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((q) => (
                            <Star key={q} size={9} className={l.quality && l.quality >= q ? "text-status-amber" : "text-text-3"} fill={l.quality && l.quality >= q ? "currentColor" : "none"} />
                          ))}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-3">{formatDate(l.logged_date)}{l.notes ? ` · ${l.notes}` : ""}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => { deleteSleep.mutate(l.id); toast.success("Removed"); }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
