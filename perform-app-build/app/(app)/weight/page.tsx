"use client";

import { useState } from "react";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { WeightChart } from "@/components/charts/WeightChart";
import {
  useBodyWeights,
  useAddBodyWeight,
  useDeleteBodyWeight,
} from "@/hooks/useTraining";
import { useProfile } from "@/hooks/useNutrition";
import { todayISO, formatDate, round } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function WeightPage() {
  const { data: profile } = useProfile();
  const { data: weights = [] } = useBodyWeights();
  const addWeight = useAddBodyWeight();
  const deleteWeight = useDeleteBodyWeight();

  const [val, setVal] = useState("");
  const [unit, setUnit] = useState(profile?.weight_unit || "lbs");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  function handleLog() {
    const weight = parseFloat(val);
    if (!weight) {
      toast.error("Enter a weight value");
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
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
          <button className="btn btn-primary mt-3" onClick={handleLog}>
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
      </div>

      {/* Chart + history */}
      <div className="card">
        <div className="card-title">Weight History</div>
        <WeightChart data={weights} />
        <div className="mt-5 space-y-1.5 max-h-64 overflow-y-auto">
          {[...weights]
            .reverse()
            .map((w, i, arr) => {
              const prev = arr[i + 1];
              const delta = prev ? round(w.weight - prev.weight) : null;
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
