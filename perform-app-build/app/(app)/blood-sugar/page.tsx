"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/visual/Motion";
import { useBloodSugar, useAddBloodSugar, useDeleteBloodSugar } from "@/hooks/useBloodSugar";
import { Droplet, Plus, Trash2, TestTubes, HeartPulse } from "lucide-react";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function classify(value: number, fasted: boolean): { label: string; color: string } {
  if (value < 70) return { label: "Low", color: "#f56565" };
  if (fasted) {
    if (value < 100) return { label: "Normal (fasted)", color: "#22d3a5" };
    if (value < 126) return { label: "Prediabetes range", color: "#f6ad55" };
    return { label: "Diabetes range", color: "#f56565" };
  }
  if (value < 140) return { label: "Normal", color: "#22d3a5" };
  if (value < 200) return { label: "Elevated", color: "#f6ad55" };
  return { label: "High", color: "#f56565" };
}

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function BloodSugarPage() {
  const { data: logs = [] } = useBloodSugar();
  const addBS = useAddBloodSugar();
  const delBS = useDeleteBloodSugar();
  const [value, setValue] = useState("");
  const [fasted, setFasted] = useState(true);
  const [when, setWhen] = useState(nowLocal());
  const [notes, setNotes] = useState("");

  const sorted = useMemo(
    () => [...logs].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()),
    [logs]
  );
  const latest = sorted[sorted.length - 1];
  const cls = latest ? classify(latest.value, latest.fasted) : null;
  const fastedAvg = useMemo(() => {
    const f = logs.filter((l) => l.fasted);
    return f.length ? Math.round(f.reduce((a, l) => a + Number(l.value), 0) / f.length) : null;
  }, [logs]);

  function handleLog() {
    const v = parseFloat(value);
    if (!v || v < 20 || v > 800) {
      toast.error("Enter a valid reading (mg/dL)");
      return;
    }
    addBS.mutate(
      { value: v, fasted, logged_at: new Date(when).toISOString(), notes: notes || null },
      {
        onSuccess: () => {
          toast.success("Reading logged");
          setValue("");
          setNotes("");
          setWhen(nowLocal());
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  const chartData = {
    labels: sorted.map((l) => new Date(l.logged_at).toLocaleDateString([], { month: "short", day: "numeric" })),
    datasets: [
      {
        label: "Blood sugar (mg/dL)",
        data: sorted.map((l) => l.value),
        borderColor: "#7c5cff",
        pointBackgroundColor: sorted.map((l) => (l.fasted ? "#2dd4bf" : "#f6ad55")),
        pointBorderColor: sorted.map((l) => (l.fasted ? "#2dd4bf" : "#f6ad55")),
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };
  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#8494a8", boxWidth: 12, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: "#4a5568", maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { color: "rgba(255,255,255,0.04)" } },
      y: { ticks: { color: "#4a5568" }, grid: { color: "rgba(255,255,255,0.04)" }, suggestedMin: 60, suggestedMax: 180 },
    },
  };

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Blood Sugar"
        subtitle="Log and plot fasted & post-meal glucose over time"
        action={
          <div className="flex gap-2 flex-wrap">
            <Link href="/blood-pressure" className="btn btn-ghost">
              <HeartPulse size={16} /> Blood Pressure
            </Link>
            <Link href="/bloodwork" className="btn btn-ghost">
              <TestTubes size={16} /> Blood Panel
            </Link>
          </div>
        }
      />

      {/* Hero — latest reading */}
      <Reveal>
        <div className="panel hairline-top p-5 sm:p-6 mb-4">
          <div className="absolute -top-10 -right-8 w-52 h-52 bg-brand-gradient opacity-20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-text-3 font-semibold mb-2">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#7c5cff1a", color: "#9d7bff", boxShadow: "inset 0 0 0 1px #7c5cff33" }}>
                  <Droplet size={13} />
                </span>
                Latest reading
              </div>
              {latest ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl sm:text-6xl font-bold tabular-nums leading-none">{Math.round(latest.value)}</span>
                    <span className="text-text-3 text-base font-medium">mg/dL</span>
                  </div>
                  <div className="text-sm mt-2 flex items-center gap-3 flex-wrap">
                    {cls && (
                      <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${cls.color}22`, color: cls.color }}>
                        {cls.label}
                      </span>
                    )}
                    <span className="text-text-2">{latest.fasted ? "Fasted" : "Non-fasted"}</span>
                    <span className="text-text-3 tabular-nums">{new Date(latest.logged_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                </>
              ) : (
                <div className="text-text-3 text-sm">No readings yet — log your first below.</div>
              )}
            </div>
            {fastedAvg != null && (
              <div className="rounded-xl bg-bg-2/70 border border-border px-4 py-3 text-center sm:min-w-[120px]">
                <div className="text-[10px] uppercase tracking-wide text-text-3 mb-0.5">Fasted avg</div>
                <div className="font-display text-2xl font-bold tabular-nums">{fastedAvg}</div>
                <div className="text-[11px] text-text-3">mg/dL</div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Log form */}
        <div className="card">
          <div className="card-title">Log a reading</div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="label">Blood sugar (mg/dL)</label>
              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="95" />
            </div>
            <div>
              <label className="label">Type</label>
              <div className="flex gap-1 bg-bg-2 p-1 rounded-lg border border-border h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => setFasted(true)}
                  className={`px-3 h-full rounded-md text-xs font-medium transition-all ${fasted ? "bg-accent-gradient text-white" : "text-text-2 hover:text-text-1"}`}
                >
                  Fasted
                </button>
                <button
                  type="button"
                  onClick={() => setFasted(false)}
                  className={`px-3 h-full rounded-md text-xs font-medium transition-all ${!fasted ? "bg-accent-gradient text-white" : "text-text-2 hover:text-text-1"}`}
                >
                  Non-fasted
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Date &amp; time</label>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="mt-3">
            <label className="label">Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="before breakfast, post-meal…" />
          </div>
          <button className="btn btn-primary group mt-3 w-full justify-center" onClick={handleLog} disabled={addBS.isPending}>
            <span className="shine-overlay" />
            <Plus size={16} /> Log reading
          </button>
        </div>

        {/* Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-1">
            <div className="card-title mb-0">Trend</div>
            <div className="flex items-center gap-3 text-[10px] text-text-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#2dd4bf" }} /> Fasted</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#f6ad55" }} /> Non-fasted</span>
            </div>
          </div>
          {sorted.length === 0 ? (
            <div className="text-text-3 text-sm py-12 text-center">Log readings to see your trend.</div>
          ) : (
            <div className="h-56 mt-1">
              <Line data={chartData} options={chartOpts} />
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="card-title">History</div>
        {logs.length === 0 ? (
          <div className="text-text-3 text-sm py-3">No readings yet.</div>
        ) : (
          <div className="space-y-1.5">
            {[...sorted].reverse().map((l) => {
              const c = classify(l.value, l.fasted);
              return (
                <div key={l.id} className="flex items-center justify-between bg-bg-2/70 rounded-lg px-3 py-2.5 border border-border">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium tabular-nums">
                        {Math.round(l.value)} <span className="text-text-3 font-normal">mg/dL</span>
                        <span className="text-text-2 text-[12px] ml-1.5">· {l.fasted ? "Fasted" : "Non-fasted"}</span>
                      </div>
                      <div className="text-[11px] text-text-3">
                        {new Date(l.logged_at).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                        {l.notes ? ` · ${l.notes}` : ""}
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => delBS.mutate(l.id, { onSuccess: () => toast.success("Removed") })}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
