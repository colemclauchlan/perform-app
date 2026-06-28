"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/visual/Motion";
import {
  useBloodPressure,
  useAddBloodPressure,
  useDeleteBloodPressure,
} from "@/hooks/useBloodPressure";
import { HeartPulse, Plus, Trash2, TestTubes, Droplet } from "lucide-react";
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

function classify(sys: number, dia: number): { label: string; color: string } {
  if (sys > 180 || dia > 120) return { label: "Hypertensive crisis", color: "#f56565" };
  if (sys >= 140 || dia >= 90) return { label: "Stage 2 hypertension", color: "#f56565" };
  if (sys >= 130 || dia >= 80) return { label: "Stage 1 hypertension", color: "#f6ad55" };
  if (sys >= 120) return { label: "Elevated", color: "#fbbf24" };
  return { label: "Normal", color: "#2fe3a8" };
}

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function BloodPressurePage() {
  const { data: logs = [] } = useBloodPressure();
  const addBP = useAddBloodPressure();
  const delBP = useDeleteBloodPressure();
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [pulse, setPulse] = useState("");
  const [when, setWhen] = useState(nowLocal());
  const [notes, setNotes] = useState("");

  const sorted = useMemo(
    () => [...logs].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()),
    [logs]
  );
  const latest = sorted[sorted.length - 1];
  const cls = latest ? classify(latest.systolic, latest.diastolic) : null;
  const avg = useMemo(() => {
    if (!logs.length) return null;
    const s = Math.round(logs.reduce((a, l) => a + l.systolic, 0) / logs.length);
    const d = Math.round(logs.reduce((a, l) => a + l.diastolic, 0) / logs.length);
    return { s, d };
  }, [logs]);

  function handleLog() {
    const s = parseInt(sys, 10);
    const d = parseInt(dia, 10);
    if (!s || !d || s < 50 || s > 300 || d < 30 || d > 200) {
      toast.error("Enter a valid reading (systolic / diastolic)");
      return;
    }
    addBP.mutate(
      {
        systolic: s,
        diastolic: d,
        pulse: pulse ? parseInt(pulse, 10) : null,
        logged_at: new Date(when).toISOString(),
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Reading logged");
          setSys("");
          setDia("");
          setPulse("");
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
        label: "Systolic",
        data: sorted.map((l) => l.systolic),
        borderColor: "#f56565",
        backgroundColor: "#f56565",
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "Diastolic",
        data: sorted.map((l) => l.diastolic),
        borderColor: "#3aa6f7",
        backgroundColor: "#3aa6f7",
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
      y: { ticks: { color: "#4a5568" }, grid: { color: "rgba(255,255,255,0.04)" }, suggestedMin: 50, suggestedMax: 160 },
    },
  };

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        eyebrow="VITALS · BLOOD PRESSURE"
        title="Blood Pressure"
        subtitle="Log and plot your readings over time"
        action={
          <div className="flex gap-2 flex-wrap">
            <Link href="/blood-sugar" className="btn btn-ghost">
              <Droplet size={16} /> Blood Sugar
            </Link>
            <Link href="/bloodwork" className="btn btn-ghost">
              <TestTubes size={16} /> Blood Panel
            </Link>
          </div>
        }
      />

      {/* Hero — latest reading + classification */}
      <Reveal>
        <div className="panel hairline-top p-5 sm:p-6 mb-4">
          <div className="absolute -top-10 -right-8 w-52 h-52 bg-brand-gradient opacity-20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-text-3 font-semibold mb-2">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#f565651a", color: "#f56565", boxShadow: "inset 0 0 0 1px #f5656533" }}>
                  <HeartPulse size={13} />
                </span>
                Latest reading
              </div>
              {latest ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl sm:text-6xl font-bold tabular-nums leading-none">
                      {latest.systolic}<span className="text-text-3 font-medium">/</span>{latest.diastolic}
                    </span>
                    <span className="text-text-3 text-base font-medium">mmHg</span>
                  </div>
                  <div className="text-sm mt-2 flex items-center gap-3 flex-wrap">
                    {cls && (
                      <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${cls.color}22`, color: cls.color }}>
                        {cls.label}
                      </span>
                    )}
                    {latest.pulse != null && <span className="text-text-2 tabular-nums">{latest.pulse} bpm</span>}
                    <span className="text-text-3 tabular-nums">{new Date(latest.logged_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                </>
              ) : (
                <div className="text-text-3 text-sm">No readings yet — log your first below.</div>
              )}
            </div>
            {avg && (
              <div className="rounded-xl bg-bg-2/70 border border-border px-4 py-3 text-center sm:min-w-[120px]">
                <div className="text-[10px] uppercase tracking-wide text-text-3 mb-0.5">Average</div>
                <div className="font-display text-2xl font-bold tabular-nums">{avg.s}/{avg.d}</div>
                <div className="text-[11px] text-text-3">{logs.length} reading{logs.length !== 1 ? "s" : ""}</div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Log form */}
        <div className="card">
          <div className="card-title">Log a reading</div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="label">Systolic</label>
              <input type="number" value={sys} onChange={(e) => setSys(e.target.value)} placeholder="120" />
            </div>
            <div>
              <label className="label">Diastolic</label>
              <input type="number" value={dia} onChange={(e) => setDia(e.target.value)} placeholder="80" />
            </div>
            <div>
              <label className="label">Pulse</label>
              <input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="bpm" />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Date &amp; time</label>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="mt-3">
            <label className="label">Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="resting, post-workout, AM…" />
          </div>
          <button className="btn btn-primary group mt-3 w-full justify-center" onClick={handleLog} disabled={addBP.isPending}>
            <span className="shine-overlay" />
            <Plus size={16} /> Log reading
          </button>
        </div>

        {/* Chart */}
        <div className="card">
          <div className="card-title">Trend</div>
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
              const c = classify(l.systolic, l.diastolic);
              return (
                <div key={l.id} className="flex items-center justify-between bg-bg-2/70 rounded-lg px-3 py-2.5 border border-border">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium tabular-nums">
                        {l.systolic}/{l.diastolic} <span className="text-text-3 font-normal">mmHg</span>
                        {l.pulse != null && <span className="text-text-2 text-[12px] ml-1.5">· {l.pulse} bpm</span>}
                      </div>
                      <div className="text-[11px] text-text-3">
                        {new Date(l.logged_at).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                        {l.notes ? ` · ${l.notes}` : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm !px-1.5"
                    onClick={() => {
                      delBP.mutate(l.id, { onSuccess: () => toast.success("Removed") });
                    }}
                  >
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
