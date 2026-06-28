"use client";

import { useMemo, useState } from "react";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { WeightChart, CompoundOverlay } from "@/components/charts/WeightChart";
import {
  useBodyWeights,
  useAddBodyWeight,
  useUpdateBodyWeight,
  useDeleteBodyWeight,
} from "@/hooks/useTraining";
import { useAllDoses, EnrichedDose } from "@/hooks/useCompounds";
import { useProfile } from "@/hooks/useNutrition";
import { todayISO, formatDate, round } from "@/lib/utils";
import { Trash2, Pencil, Check, X, Syringe } from "lucide-react";
import toast from "react-hot-toast";
import { Reveal } from "@/components/visual/Motion";

// Model relative blood level at a moment using exponential decay from each prior
// dose: level = Σ amount · 0.5^(Δhours / halfLife). Normalized to its own peak.
function buildOverlay(
  doses: EnrichedDose[],
  dates: string[],
  label: string,
  color: string,
  defaultHalfLife: number
): CompoundOverlay | null {
  if (!doses.length || dates.length < 2) return null;
  const sampleTimes = dates.map((d) => new Date(d + "T12:00").getTime());
  const raw = sampleTimes.map((t) => {
    let level = 0;
    doses.forEach((dose) => {
      const dt = new Date(dose.logged_at).getTime();
      if (dt > t) return;
      const hl = dose.half_life_hours && dose.half_life_hours > 0 ? dose.half_life_hours : defaultHalfLife;
      const elapsedH = (t - dt) / 3_600_000;
      level += dose.dose_amount * Math.pow(0.5, elapsedH / hl);
    });
    return level;
  });
  const max = Math.max(...raw);
  if (max <= 0) return null;
  const norm = raw.map((v) => Math.round((v / max) * 100));
  const doseDates = new Set(doses.map((d) => d.logged_at.slice(0, 10)));
  const injection = dates.map((d) => doseDates.has(d));
  return { label, color, data: norm, injection };
}

export default function WeightPage() {
  const { data: profile } = useProfile();
  const { data: weights = [] } = useBodyWeights();
  const { data: doses = [] } = useAllDoses();
  const addWeight = useAddBodyWeight();
  const updateWeight = useUpdateBodyWeight();
  const deleteWeight = useDeleteBodyWeight();

  const [val, setVal] = useState("");
  const [unit, setUnit] = useState(profile?.weight_unit || "lbs");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  const [showCompounds, setShowCompounds] = useState(false);

  // Build GLP-1 + AAS blood-level overlays from logged doses, sampled at weight dates.
  const overlays = useMemo<CompoundOverlay[]>(() => {
    if (!showCompounds || weights.length < 2) return [];
    const dates = weights.map((w) => w.logged_date);
    const glp = doses.filter((d) => d.compound_type === "GLP-1");
    const aas = doses.filter((d) => d.compound_type === "Steroid");
    const out: CompoundOverlay[] = [];
    const g = buildOverlay(glp, dates, "GLP-1 level", "#2fe3a8", 165);
    const a = buildOverlay(aas, dates, "AAS level", "#f59e0b", 100);
    if (g) out.push(g);
    if (a) out.push(a);
    return out;
  }, [showCompounds, doses, weights]);

  const hasDoseData = doses.some((d) => d.compound_type === "GLP-1" || d.compound_type === "Steroid");

  // inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function startEdit(id: string, weight: number, logged_date: string, n: string | null) {
    setEditId(id);
    setEditVal(String(weight));
    setEditDate(logged_date);
    setEditNotes(n || "");
  }
  function saveEdit() {
    const weight = parseFloat(editVal);
    if (!weight || weight <= 0 || weight > 2000) { toast.error("Enter a valid weight"); return; }
    updateWeight.mutate(
      { id: editId!, updates: { weight, logged_date: editDate, notes: editNotes || null } },
      {
        onSuccess: () => { toast.success("Entry updated"); setEditId(null); },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function handleLog() {
    const weight = parseFloat(val);
    if (!weight || weight <= 0 || weight > 2000) {
      toast.error("Enter a valid weight");
      return;
    }
    addWeight.mutate(
      { weight, unit: unit as "lbs" | "kg", logged_date: date, notes: notes || null },
      {
        onSuccess: () => {
          toast.success("Weight logged");
          setVal("");
          setNotes("");
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  // Stats
  const latest = weights[weights.length - 1];
  const highest = weights.length ? Math.max(...weights.map((w) => w.weight)) : 0;
  const lowest = weights.length ? Math.min(...weights.map((w) => w.weight)) : 0;
  const avg = weights.length
    ? round(weights.reduce((a, w) => a + w.weight, 0) / weights.length)
    : 0;

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader title="Body Weight" subtitle="Track your weight over time" />

      <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {/* Log form */}
        <div className="card">
          <div className="card-title">Log Weight</div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="label">Weight</label>
              <input
                type="number"
                step="0.1"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder="185.0"
              />
            </div>
            <div className="w-24">
              <label className="label">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as "lbs" | "kg")}>
                <option>lbs</option>
                <option>kg</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="mt-3">
            <label className="label">Notes (fasted, post-workout, etc.)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <button className="btn btn-primary group mt-3" onClick={handleLog}>
            <span className="shine-overlay" />
            Log Weight
          </button>
        </div>

        {/* Stats */}
        <div className="card">
          <div className="card-title">Stats</div>
          {weights.length === 0 ? (
            <div className="text-text-3 text-sm">No entries yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="Current"
                value={latest.weight}
                unit={latest.unit}
                sub={formatDate(latest.logged_date)}
              />
              <StatCard
                label="Average"
                value={avg}
                unit={latest.unit}
                sub={`${weights.length} entries`}
              />
              <StatCard label="Highest" value={highest} unit={latest.unit} />
              <StatCard label="Lowest" value={lowest} unit={latest.unit} />
            </div>
          )}
        </div>
      </Reveal>

      {/* Chart + history */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="card-title mb-0">Weight History</div>
          {hasDoseData && (
            <button
              onClick={() => setShowCompounds((s) => !s)}
              className={`btn btn-sm ${showCompounds ? "btn-primary" : "btn-ghost"}`}
              title="Overlay estimated GLP-1 / AAS blood levels and injection dates"
            >
              <Syringe size={13} /> Compound levels
            </button>
          )}
        </div>
        {showCompounds && overlays.length > 0 && (
          <div className="text-[11px] text-text-3 mt-1 mb-1">
            Dots mark injection dates · right axis shows estimated blood level (relative to your peak, by half-life decay).
          </div>
        )}
        <div className="mt-3">
          <WeightChart data={weights} overlays={overlays} />
        </div>
        <div className="mt-5 space-y-1.5 max-h-64 overflow-y-auto">
          {[...weights]
            .reverse()
            .map((w, i, arr) => {
              const prev = arr[i + 1];
              const delta = prev ? round(w.weight - prev.weight) : null;
              if (editId === w.id) {
                return (
                  <div key={w.id} className="bg-bg-2 rounded-lg px-3 py-2 border border-accent/50">
                    <div className="flex gap-2 items-end flex-wrap">
                      <div className="w-24">
                        <label className="label">Weight</label>
                        <input type="number" step="0.1" value={editVal} onChange={(e) => setEditVal(e.target.value)} className="!py-1.5" />
                      </div>
                      <div className="w-36">
                        <label className="label">Date</label>
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="!py-1.5" />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="label">Notes</label>
                        <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="!py-1.5" placeholder="Optional" />
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={13} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}><X size={13} /></button>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2 border border-border"
                >
                  <div>
                    <div className="text-sm">
                      {w.weight} {w.unit}
                    </div>
                    <div className="text-[11px] text-text-2">
                      {formatDate(w.logged_date)}
                      {w.notes ? ` · ${w.notes}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {delta != null && (
                      <span
                        className={`text-xs ${
                          delta > 0
                            ? "text-status-green"
                            : delta < 0
                            ? "text-status-red"
                            : "text-text-3"
                        }`}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm !px-1.5"
                      onClick={() => startEdit(w.id, w.weight, w.logged_date, w.notes)}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm !px-1.5"
                      onClick={() => {
                        deleteWeight.mutate(w.id);
                        toast.success("Removed");
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          {weights.length === 0 && (
            <div className="text-text-3 text-sm py-3">No entries yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
