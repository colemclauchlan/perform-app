"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  useBodyMeasurements,
  useAddBodyMeasurement,
  useDeleteBodyMeasurement,
} from "@/hooks/useBodyMetrics";
import { todayISO, formatDate } from "@/lib/utils";
import { Trash2, Ruler, TrendingUp, TrendingDown } from "lucide-react";
import { MuscleModel3DView } from "@/components/visual/MuscleModel3DView";
import { Reveal } from "@/components/visual/Motion";
import toast from "react-hot-toast";

const FIELDS: { key: string; label: string; col: keyof typeof defaultMeasurement }[] = [
  { key: "chest_cm", label: "Chest", col: "chest_cm" },
  { key: "waist_cm", label: "Waist", col: "waist_cm" },
  { key: "hips_cm", label: "Hips", col: "hips_cm" },
  { key: "neck_cm", label: "Neck", col: "neck_cm" },
  { key: "left_arm_cm", label: "Left Arm", col: "left_arm_cm" },
  { key: "right_arm_cm", label: "Right Arm", col: "right_arm_cm" },
  { key: "left_thigh_cm", label: "Left Thigh", col: "left_thigh_cm" },
  { key: "right_thigh_cm", label: "Right Thigh", col: "right_thigh_cm" },
  { key: "left_calf_cm", label: "Left Calf", col: "left_calf_cm" },
  { key: "right_calf_cm", label: "Right Calf", col: "right_calf_cm" },
  { key: "body_fat_pct", label: "Body Fat %", col: "body_fat_pct" },
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

export default function MeasurementsPage() {
  const { data: measurements = [] } = useBodyMeasurements();
  const addMeasurement = useAddBodyMeasurement();
  const deleteMeasurement = useDeleteBodyMeasurement();

  const [date, setDate] = useState(todayISO());
  const [form, setForm] = useState(defaultMeasurement);

  function updateField(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSave() {
    const hasData = FIELDS.some((f) => form[f.col] !== "");
    if (!hasData) {
      toast.error("Enter at least one measurement");
      return;
    }
    const payload: Record<string, unknown> = { logged_date: date };
    FIELDS.forEach((f) => {
      if (form[f.col] !== "") {
        const v = parseFloat(form[f.col] as string);
        if (!Number.isNaN(v)) payload[f.key] = v;
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

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Body Measurements"
        subtitle="Track your measurements over time"
      />

      <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Log form */}
        <div className="card">
          <div className="card-title">Log Measurements</div>
          <div className="mb-3">
            <label className="label">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="label">{f.label} {f.key === "body_fat_pct" ? "(%)" : "(cm)"}</label>
                <input
                  type="number"
                  step="0.1"
                  value={form[f.col] as string}
                  onChange={(e) => updateField(f.col, e.target.value)}
                  placeholder="0.0"
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="label">Notes</label>
            <input value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Optional" />
          </div>
          <button className="btn btn-primary group mt-3 w-full" onClick={handleSave}>
            <span className="shine-overlay" />
            Save Measurements
          </button>
        </div>

        {/* Latest comparison */}
        <div className="card">
          <div className="card-title">Latest vs Previous</div>
          {!latest ? (
            <div className="text-text-3 text-sm py-4">No measurements yet.</div>
          ) : (
            <div className="space-y-2">
              {FIELDS.filter((f) => latest[f.col] != null).map((f) => {
                const cur = latest[f.col] as number | null;
                const old = prev ? (prev[f.col] as number | null) : null;
                const delta = cur != null && old != null ? Math.round((cur - old) * 10) / 10 : null;
                // For waist/fat: decrease = good. For arms/chest: increase = good.
                const decreaseGood = ["waist_cm", "hips_cm", "body_fat_pct"].includes(f.key);
                const isPositive = delta != null && (decreaseGood ? delta < 0 : delta > 0);
                const isNegative = delta != null && (decreaseGood ? delta > 0 : delta < 0);

                return (
                  <div key={f.key} className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2 border border-border">
                    <div className="flex items-center gap-2">
                      <Ruler size={12} className="text-text-3" />
                      <span className="text-sm text-text-2">{f.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {delta != null && (
                        <span className={`text-[11px] flex items-center gap-0.5 ${isPositive ? "text-status-green" : isNegative ? "text-status-red" : "text-text-3"}`}>
                          {isPositive && <TrendingUp size={10} />}
                          {isNegative && <TrendingDown size={10} />}
                          {delta > 0 ? "+" : ""}{delta}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-accent">
                        {cur}{f.key === "body_fat_pct" ? "%" : " cm"}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="text-[11px] text-text-3 mt-1">
                Last logged: {formatDate(latest.logged_date)}
              </div>
            </div>
          )}
        </div>
      </Reveal>

      {/* 3D body model — highlights the areas you're tracking */}
      {latest && (
        <Reveal className="card mb-5">
          <div className="card-title">Body Model · Tracked Areas</div>
          <MuscleModel3DView
            primary=""
            secondary={
              [
                latest.chest_cm != null && "Chest",
                latest.waist_cm != null && "Abs",
                latest.hips_cm != null && "Glutes",
                latest.neck_cm != null && "Traps",
                (latest.left_arm_cm != null || latest.right_arm_cm != null) && "Biceps",
                (latest.left_thigh_cm != null || latest.right_thigh_cm != null) && "Quads",
                (latest.left_calf_cm != null || latest.right_calf_cm != null) && "Calves",
              ].filter(Boolean) as string[]
            }
            height={340}
            showLegend={false}
            caption={`Highlighted areas are tracked · last logged ${formatDate(latest.logged_date)}`}
          />
        </Reveal>
      )}

      {/* History */}
      <div className="card">
        <div className="card-title">Measurement History</div>
        {measurements.length === 0 ? (
          <div className="text-text-3 text-sm py-4">No entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-text-3">
                  <th className="text-left py-2 pr-3">Date</th>
                  {FIELDS.filter((f) => measurements.some((m) => m[f.col] != null)).map((f) => (
                    <th key={f.key} className="text-right py-2 pr-3">{f.label}</th>
                  ))}
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {[...measurements].reverse().map((m) => (
                  <tr key={m.id} className="border-t border-border/40 hover:bg-bg-2 transition-colors">
                    <td className="py-2 pr-3 text-text-2">{formatDate(m.logged_date)}</td>
                    {FIELDS.filter((f) => measurements.some((e) => e[f.col] != null)).map((f) => (
                      <td key={f.key} className="py-2 pr-3 text-right text-text-1">
                        {m[f.col] != null ? `${m[f.col]}${f.key === "body_fat_pct" ? "%" : ""}` : "—"}
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
