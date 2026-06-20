"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useSaveTemplate } from "@/hooks/useTraining";
import { Dumbbell, Loader2, Sparkles, Save, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

type GenEx = { name: string; muscle_group?: string; sets: number; reps: string; notes?: string };
type GenDay = { day: string; focus?: string; exercises: GenEx[] };
type Program = { name: string; summary: string; days: GenDay[]; notes?: string };

const SPLITS = [
  "Push / Pull / Legs",
  "Upper / Lower",
  "Full Body",
  "Bro Split (one muscle per day)",
  "Arnold Split",
  "Push / Pull",
  "Chest+Tri / Back+Bi / Legs+Shoulders",
];
const GOALS = ["Hypertrophy", "Strength", "Powerbuilding", "Endurance", "General fitness"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export function AIWorkoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const saveTemplate = useSaveTemplate();
  const [split, setSplit] = useState(SPLITS[0]);
  const [days, setDays] = useState(4);
  const [goal, setGoal] = useState("Hypertrophy");
  const [experience, setExperience] = useState("Intermediate");
  const [focus, setFocus] = useState("");
  const [equipment, setEquipment] = useState("Full commercial gym");
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setLoading(true);
    setProgram(null);
    try {
      const res = await fetch("/api/workout-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ split, days, goal, experience, focus, equipment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Could not generate a program.");
        return;
      }
      setProgram(data.program as Program);
    } catch {
      toast.error("Network error reaching the workout service.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    if (!program) return;
    setSaving(true);
    try {
      await Promise.all(
        program.days.map((d) =>
          saveTemplate.mutateAsync({
            name: `${program.name} — ${d.day}`,
            notes: d.focus || null,
            data: (d.exercises || []).map((ex) => ({
              exercise_name: ex.name,
              muscle_group: ex.muscle_group,
              sets: Array.from({ length: Math.max(1, Number(ex.sets) || 3) }, () => ({
                weight: null,
                reps: String(ex.reps || "8-12"),
              })),
            })),
          })
        )
      );
      toast.success(`Saved ${program.days.length} workout templates`);
      setProgram(null);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="AI Workout Program Builder" wide>
      {!program ? (
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            Pick a split and the AI builds a full program around your goal and tracked lifts.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Training split</label>
              <select value={split} onChange={(e) => setSplit(e.target.value)}>
                {SPLITS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Days / week</label>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {[2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Goal</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value)}>
                {GOALS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Experience</label>
              <select value={experience} onChange={(e) => setExperience(e.target.value)}>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Muscle emphasis (optional)</label>
            <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. bring up chest and rear delts" />
          </div>
          <div>
            <label className="label">Equipment</label>
            <input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Full commercial gym / home dumbbells / …" />
          </div>
          <button onClick={generate} disabled={loading} className="btn btn-primary group w-full justify-center">
            <span className="shine-overlay" />
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Building your program…" : "Generate program"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-display font-bold">{program.name}</h3>
            {program.summary && <p className="text-sm text-text-2 mt-1">{program.summary}</p>}
          </div>

          <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
            {program.days.map((d, i) => (
              <div key={i} className="rounded-xl border border-border bg-bg-2/40 p-3">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <Dumbbell size={13} className="text-accent" /> {d.day}
                  </div>
                  {d.focus && <div className="text-[11px] text-text-3 truncate">{d.focus}</div>}
                </div>
                <div className="space-y-1">
                  {(d.exercises || []).map((ex, j) => (
                    <div key={j} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-text-1 min-w-0">
                        {ex.name}
                        {ex.notes && <span className="text-text-3"> · {ex.notes}</span>}
                      </span>
                      <span className="text-text-2 tabular-nums shrink-0">
                        {ex.sets} × {ex.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {program.notes && (
            <p className="text-[12px] text-text-3 border-l-2 border-accent/40 pl-3">{program.notes}</p>
          )}

          <div className="flex gap-2">
            <button onClick={saveAll} disabled={saving} className="btn btn-primary group flex-1 justify-center">
              <span className="shine-overlay" />
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save all as templates
            </button>
            <button onClick={() => setProgram(null)} className="btn btn-ghost">
              <RotateCcw size={15} /> Tweak
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
