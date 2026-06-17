"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import {
  useWorkouts,
  useExercises,
  useCreateWorkout,
  useDeleteWorkout,
  useLiftProgression,
} from "@/hooks/useTraining";
import { useProfile } from "@/hooks/useNutrition";
import { WorkoutSession } from "@/types/database";
import { todayISO, formatDate } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChevronRight,
  X,
  Search,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

export default function WorkoutsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [liftSearch, setLiftSearch] = useState("");
  const { data: workouts = [] } = useWorkouts();
  const { data: progression = [] } = useLiftProgression();
  const deleteWorkout = useDeleteWorkout();

  const filteredLifts = progression.filter(
    (l) => !liftSearch || l.name.toLowerCase().includes(liftSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Workouts"
        subtitle="Log sessions and track lift progression"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Workout
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Sessions */}
        <div className="card">
          <div className="card-title">Recent Sessions</div>
          {workouts.length === 0 ? (
            <div className="text-text-3 text-sm py-3">
              No sessions logged yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {workouts.map((s) => (
                <div key={s.id}>
                  <div
                    className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2.5 border border-border cursor-pointer hover:border-border-2"
                    onClick={() =>
                      setExpanded(expanded === s.id ? null : s.id)
                    }
                  >
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-[11px] text-text-2">
                        {formatDate(s.session_date)} · {s.sets?.length || 0}{" "}
                        set{(s.sets?.length || 0) !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-ghost btn-sm !px-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkout.mutate(s.id);
                          toast.success("Deleted");
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight
                        size={15}
                        className={`text-text-3 transition-transform ${
                          expanded === s.id ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>
                  {expanded === s.id && s.sets && (
                    <div className="mt-1.5 mb-2">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[10px] uppercase text-text-3">
                            <th className="text-left py-1.5 px-2">Exercise</th>
                            <th className="text-left py-1.5 px-2">Reps</th>
                            <th className="text-left py-1.5 px-2">Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.sets.map((set) => (
                            <tr
                              key={set.id}
                              className="border-t border-border/40"
                            >
                              <td className="py-1.5 px-2">
                                {set.exercise_name}
                              </td>
                              <td className="py-1.5 px-2 text-text-2">
                                {set.reps}
                              </td>
                              <td className="py-1.5 px-2 text-text-2">
                                {set.weight} {set.weight_unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lift progression */}
        <div className="card">
          <div className="card-title">Lift Progression</div>
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
            />
            <input
              value={liftSearch}
              onChange={(e) => setLiftSearch(e.target.value)}
              placeholder="Search an exercise..."
              className="!pl-9"
            />
          </div>
          {filteredLifts.length === 0 ? (
            <div className="text-text-3 text-sm py-3">
              {progression.length === 0
                ? "Log workouts to see progression."
                : "No matching lifts."}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[440px] overflow-y-auto">
              {filteredLifts.map((lift) => (
                <div
                  key={lift.name}
                  className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2.5 border border-border"
                >
                  <div>
                    <div className="text-sm font-medium">{lift.name}</div>
                    <div className="text-[11px] text-text-2">
                      {lift.sessions} session
                      {lift.sessions !== 1 ? "s" : ""} · PR: {lift.pr}{" "}
                      {lift.unit}
                    </div>
                    <div
                      className={`text-[11px] flex items-center gap-1 ${
                        lift.delta >= 0 ? "text-status-green" : "text-status-red"
                      }`}
                    >
                      <TrendingUp size={11} />
                      {lift.delta >= 0 ? "+" : ""}
                      {lift.delta} {lift.unit} since start
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-accent">
                      {lift.latest}
                    </div>
                    <div className="text-[11px] text-text-3">
                      {lift.unit} last
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NewWorkoutModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

// ─── NEW WORKOUT MODAL ────────────────────────────────────────────────────────
type DraftSet = {
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

function NewWorkoutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: exercises = [] } = useExercises();
  const { data: profile } = useProfile();
  const createWorkout = useCreateWorkout();
  const wu = profile?.weight_unit || "lbs";

  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<DraftSet[]>([
    { exercise_name: "", sets: "3", reps: "", weight: "", notes: "" },
  ]);

  function addRow() {
    setRows([
      ...rows,
      { exercise_name: "", sets: "3", reps: "", weight: "", notes: "" },
    ]);
  }
  function updateRow(i: number, patch: Partial<DraftSet>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    if (!name) {
      toast.error("Enter a workout name");
      return;
    }
    // Expand "sets" count into individual set rows for progression tracking
    const setRows: Array<{
      exercise_name: string;
      set_number: number;
      reps: string;
      weight: number;
      weight_unit: string;
      notes: string;
    }> = [];
    rows.forEach((r) => {
      if (!r.exercise_name) return;
      const numSets = parseInt(r.sets) || 1;
      for (let i = 0; i < numSets; i++) {
        setRows.push({
          exercise_name: r.exercise_name,
          set_number: i + 1,
          reps: r.reps,
          weight: parseFloat(r.weight) || 0,
          weight_unit: wu,
          notes: r.notes,
        });
      }
    });
    if (setRows.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    createWorkout.mutate(
      { name, session_date: date, sets: setRows },
      {
        onSuccess: () => {
          toast.success("Workout saved");
          setName("");
          setRows([
            { exercise_name: "", sets: "3", reps: "", weight: "", notes: "" },
          ]);
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Workout Session" wide>
      <div className="space-y-3">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Workout name / label</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push Day A"
            />
          </div>
          <div className="w-40">
            <label className="label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="card-title pt-2">Exercises</div>
        {rows.map((r, i) => (
          <div key={i} className="card-sm">
            <div className="flex gap-2.5 items-end flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="label">Exercise</label>
                <select
                  value={r.exercise_name}
                  onChange={(e) =>
                    updateRow(i, { exercise_name: e.target.value })
                  }
                >
                  <option value="">Select...</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.name}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-16">
                <label className="label">Sets</label>
                <input
                  type="number"
                  value={r.sets}
                  onChange={(e) => updateRow(i, { sets: e.target.value })}
                />
              </div>
              <div className="w-20">
                <label className="label">Reps</label>
                <input
                  value={r.reps}
                  onChange={(e) => updateRow(i, { reps: e.target.value })}
                  placeholder="5 or 8-12"
                />
              </div>
              <div className="w-24">
                <label className="label">Weight ({wu})</label>
                <input
                  type="number"
                  value={r.weight}
                  onChange={(e) => updateRow(i, { weight: e.target.value })}
                  placeholder="135"
                />
              </div>
              {rows.length > 1 && (
                <button
                  className="btn btn-danger btn-sm !px-2 mb-0.5"
                  onClick={() => removeRow(i)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={addRow}>
          <Plus size={14} /> Add exercise
        </button>

        <div className="flex gap-2 pt-2">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Session
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
