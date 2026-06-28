"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  useBodyMeasurements,
  useAddBodyMeasurement,
  useDeleteBodyMeasurement,
} from "@/hooks/useBodyMetrics";
import { todayISO, formatDate } from "@/lib/utils";
import { Trash2, Ruler, TrendingUp, TrendingDown, Activity, CalendarDays } from "lucide-react";
import { BodyGltfModel3DView } from "@/components/visual/BodyGltfModel3DView";
import type { MeasurePoint } from "@/components/visual/BodyGltfModel3D";
import { Reveal } from "@/components/visual/Motion";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

type Col = keyof typeof defaultMeasurement;

// field column -> { label, anchor id on the 3D model }
const FIELDS: { key: Col; label: string; pointId?: string }[] = [
  { key: "chest_cm", label: "Chest", pointId: "chest" },
  { key: "waist_cm", label: "Waist", pointId: "waist" },
  { key: "hips_cm", label: "Hips", pointId: "hips" },
  { key: "neck_cm", label: "Neck", pointId: "neck" },
  { key: "left_arm_cm", label: "Left Arm", pointId: "leftArm" },
  { key: "right_arm_cm", label: "Right Arm", pointId: "rightArm" },
  { key: "left_thigh_cm", label: "Left Thigh", pointId: "leftThigh" },
  { key: "right_thigh_cm", label: "Right Thigh", pointId: "rightThigh" },
  { key: "left_calf_cm", label: "Left Calf", pointId: "leftCalf" },
  { key: "right_calf_cm", label: "Right Calf", pointId: "rightCalf" },
  { key: "body_fat_pct", label: "Body Fat %" },
];

const defaultMeasurement = {
  chest_cm: "",
  waist_cm: "",
  hips_cm: "",
  neck_cm: "",
  left_arm_cm: "",
  right_arm_cm: "",
  left_thigh_cm: "",
  right_thigh_cm: "",
  left_calf_cm: "",
  right_calf_cm: "",
  body_fat_pct: "",
  notes: "",
};

const CM_PER_IN = 2.54;

export default function MeasurementsPage() {
  const { data: measurements = [] } = useBodyMeasurements();
  const addMeasurement = useAddBodyMeasurement();
  const deleteMeasurement = useDeleteBodyMeasurement();

  const [date, setDate] = useState(todayISO());
  const [form, setForm] = useState(defaultMeasurement);
  const [trendKey, setTrendKey] = useState<Col>("waist_cm");
  // Girth measurements are stored in cm; the user can view/enter in cm or inches.
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("bt_measure_unit") : null;
    if (saved === "in" || saved === "cm") setUnit(saved);
  }, []);

  // % stays as-is; lengths convert between the stored cm and the display unit.
  const dispUnit = (k: Col) => (k === "body_fat_pct" ? "%" : unit);
  const cmToU = (cm: number) => (unit === "in" ? Math.round((cm / CM_PER_IN) * 10) / 10 : Math.round(cm * 10) / 10);
  const toDisp = (k: Col, cm: number) => (k === "body_fat_pct" ? cm : cmToU(cm));

  function updateField(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Switch units and convert any values already typed into the form.
  function changeUnit(next: "cm" | "in") {
    if (next === unit) return;
    setForm((f) => {
      const nf = { ...f };
      FIELDS.forEach((fld) => {
        if (fld.key === "body_fat_pct") return;
        const raw = nf[fld.key] as string;
        if (raw === "") return;
        const v = parseFloat(raw);
        if (Number.isNaN(v)) return;
        const cm = unit === "in" ? v * CM_PER_IN : v;
        nf[fld.key] = String(Math.round((next === "in" ? cm / CM_PER_IN : cm) * 10) / 10);
      });
      return nf;
    });
    setUnit(next);
    if (typeof window !== "undefined") localStorage.setItem("bt_measure_unit", next);
  }

  function handleSave() {
    const hasData = FIELDS.some((f) => form[f.key] !== "");
    if (!hasData) {
      toast.error("Enter at least one measurement");
      return;
    }
    const payload: Record<string, unknown> = { logged_date: date };
    FIELDS.forEach((f) => {
      if (form[f.key] !== "") {
        const v = parseFloat(form[f.key] as string);
        if (!Number.isNaN(v)) {
          // body fat is a %, everything else is a length stored in cm
          payload[f.key] = f.key === "body_fat_pct" ? v : Math.round((unit === "in" ? v * CM_PER_IN : v) * 100) / 100;
        }
      }
    });
    if (form.notes) payload.notes = form.notes;

    addMeasurement.mutate(payload, {
      onSuccess: () => {
        toast.success("Measurements saved");
        setForm(defaultMeasurement);
      },
      onError: (e) => toast.error(e.message),
    });
  }

  const latest = measurements[measurements.length - 1];
  const prev = measurements[measurements.length - 2];

  // Measurement callouts plotted onto the 3D model.
  const points: MeasurePoint[] = useMemo(() => {
    if (!latest) return [];
    return FIELDS.flatMap((f) => {
      if (!f.pointId) return [];
      const cur = latest[f.key] as number | null;
      if (cur == null) return [];
      const old = prev ? (prev[f.key] as number | null) : null;
      const dCur = cmToU(cur);
      const dOld = old != null ? cmToU(old) : null;
      const delta = dOld != null ? Math.round((dCur - dOld) * 10) / 10 : null;
      return [{ id: f.pointId, label: f.label.replace("Left ", "L ").replace("Right ", "R "), value: dCur, unit, delta }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest, prev, unit]);

  const trackedCount = points.length;
  const bodyFat = latest?.body_fat_pct as number | null | undefined;

  // Available metrics for the trend chart (those with >=1 logged value).
  const trendable = FIELDS.filter((f) => measurements.some((m) => m[f.key] != null));
  const trendSeries = useMemo(() => {
    const rows = measurements.filter((m) => m[trendKey] != null);
    return {
      labels: rows.map((m) => formatDate(m.logged_date)),
      values: rows.map((m) => toDisp(trendKey, m[trendKey] as number)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurements, trendKey, unit]);

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader eyebrow="PHYSIQUE · GIRTH MAP" title="Body Measurements" subtitle="Track your physique — plotted onto a 3D model" />

      {/* ── Hero: 3D body with measurements plotted on it ── */}
      <Reveal>
        <div className="panel hairline-top p-4 sm:p-5 mb-5">
          <div className="absolute -top-12 -right-10 w-56 h-56 bg-brand-gradient opacity-[0.16] blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-center">
            <div>
              {latest ? (
                <BodyGltfModel3DView points={points} height={460} />
              ) : (
                <div className="h-[300px] rounded-xl border border-border bg-bg-2/40 flex flex-col items-center justify-center text-text-3 text-sm gap-2">
                  <Ruler size={26} className="text-text-3" />
                  Log your first measurements to see them on the model.
                </div>
              )}
            </div>

            {/* stat rail */}
            <div className="space-y-2.5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-text-3 font-semibold">Latest snapshot</div>
              <StatChip icon={<Activity size={14} />} label="Body fat" value={bodyFat != null ? `${bodyFat}%` : "—"} tone="#fb7185" />
              <StatChip icon={<Ruler size={14} />} label="Areas tracked" value={`${trackedCount}`} tone="#2dd4bf" />
              <StatChip
                icon={<CalendarDays size={14} />}
                label="Last logged"
                value={latest ? formatDate(latest.logged_date) : "—"}
                tone="#189bf5"
                small
              />
              <div className="pt-2 mt-1 border-t border-border/60 flex flex-col gap-1.5 text-[11px] text-text-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#189bf5", boxShadow: "0 0 6px #189bf5aa" }} /> Tracked point
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-status-green" /> Up since last log
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingDown size={11} className="text-text-1" /> Down since last log
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Log + Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Log form */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="card-title !mb-0">Log Measurements</div>
            <div className="inline-flex rounded-lg border border-border overflow-hidden text-[11px]" role="group" aria-label="Units">
              {(["cm", "in"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => changeUnit(u)}
                  className={`px-2.5 py-1 font-medium transition-colors ${unit === u ? "bg-accent text-white" : "text-text-3 hover:text-text-1"}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-text-3 mb-3 -mt-1">Girth around each muscle group — not clothing size.</div>
          <div className="mb-3">
            <label className="label">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="label">
                  {f.label} ({dispUnit(f.key)})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form[f.key] as string}
                  onChange={(e) => updateField(f.key, e.target.value)}
                  placeholder="0.0"
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="label">Notes</label>
            <input value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Optional" />
          </div>
          <button className="btn btn-primary group mt-3 w-full justify-center" onClick={handleSave} disabled={addMeasurement.isPending}>
            <span className="shine-overlay" />
            Save Measurements
          </button>
        </div>

        {/* Trend + Latest vs Previous */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="card-title !mb-0">Trend</div>
              <select
                value={trendKey}
                onChange={(e) => setTrendKey(e.target.value as Col)}
                className="!py-1 !text-xs w-36"
                disabled={trendable.length === 0}
              >
                {(trendable.length ? trendable : FIELDS).map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            {trendSeries.values.length < 2 ? (
              <div className="text-text-3 text-sm py-10 text-center">Log at least two entries to see a trend.</div>
            ) : (
              <div className="h-44">
                <Line
                  data={{
                    labels: trendSeries.labels,
                    datasets: [
                      {
                        data: trendSeries.values,
                        borderColor: "#189bf5",
                        backgroundColor: "rgba(24,155,245,0.14)",
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                        pointBackgroundColor: "#189bf5",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { intersect: false, mode: "index" } },
                    scales: {
                      x: { ticks: { color: "#4a5568", maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { color: "rgba(255,255,255,0.04)" } },
                      y: { ticks: { color: "#4a5568" }, grid: { color: "rgba(255,255,255,0.04)" } },
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* Latest vs Previous */}
          <div className="card">
            <div className="card-title">Latest vs Previous</div>
            {!latest ? (
              <div className="text-text-3 text-sm py-4">No measurements yet.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {FIELDS.filter((f) => latest[f.key] != null).map((f) => {
                  const curCm = latest[f.key] as number;
                  const oldCm = prev ? (prev[f.key] as number | null) : null;
                  const cur = toDisp(f.key, curCm);
                  const old = oldCm != null ? toDisp(f.key, oldCm) : null;
                  const delta = old != null ? Math.round((cur - old) * 10) / 10 : null;
                  const up = delta != null && delta > 0;
                  const down = delta != null && delta < 0;
                  return (
                    <div key={f.key} className="bg-bg-2 rounded-lg px-2.5 py-2 border border-border/60">
                      <div className="text-[10px] uppercase tracking-wide text-text-3 truncate">{f.label}</div>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-sm font-semibold text-text-1 tabular-nums">
                          {cur}
                          <span className="text-text-3 font-normal text-[10px] ml-0.5">{dispUnit(f.key)}</span>
                        </span>
                        {delta != null && delta !== 0 && (
                          <span className={`text-[11px] flex items-center gap-0.5 tabular-nums ${up ? "text-status-green" : "text-text-1"}`}>
                            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {delta > 0 ? "+" : ""}
                            {delta}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── History ── */}
      <div className="card">
        <div className="card-title flex items-center gap-2">
          Measurement History
          <span className="text-text-3 text-[10px] normal-case tracking-normal font-normal">· lengths in {unit}</span>
        </div>
        {measurements.length === 0 ? (
          <div className="text-text-3 text-sm py-4">No entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-text-3">
                  <th className="text-left py-2 pr-3">Date</th>
                  {FIELDS.filter((f) => measurements.some((m) => m[f.key] != null)).map((f) => (
                    <th key={f.key} className="text-right py-2 pr-3">
                      {f.label}
                    </th>
                  ))}
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {[...measurements].reverse().map((m) => (
                  <tr key={m.id} className="border-t border-border/40 hover:bg-bg-2 transition-colors">
                    <td className="py-2 pr-3 text-text-2 whitespace-nowrap">{formatDate(m.logged_date)}</td>
                    {FIELDS.filter((f) => measurements.some((e) => e[f.key] != null)).map((f) => (
                      <td key={f.key} className="py-2 pr-3 text-right text-text-1 tabular-nums">
                        {m[f.key] != null ? `${toDisp(f.key, m[f.key] as number)}${f.key === "body_fat_pct" ? "%" : ""}` : "—"}
                      </td>
                    ))}
                    <td className="py-2">
                      <button
                        className="btn btn-ghost btn-sm !px-1.5"
                        onClick={() => {
                          deleteMeasurement.mutate(m.id);
                          toast.success("Removed");
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  tone,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-2/70 px-3 py-2.5">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tone}1a`, color: tone, boxShadow: `inset 0 0 0 1px ${tone}33` }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-text-3">{label}</div>
        <div className={`font-semibold text-text-1 tabular-nums truncate ${small ? "text-xs" : "text-base font-display"}`}>{value}</div>
      </div>
    </div>
  );
}
