"use client";

import { useState, useMemo } from "react";
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
import { WorkoutSet } from "@/types/database";
import { todayISO, formatDate, cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChevronRight,
  X,
  Search,
  TrendingUp,
  Dumbbell,
  Settings2,
  PersonStanding,
  Weight,
  BarChart2,
  Calendar,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

type WorkoutCategory = "all" | "free_weights" | "machines" | "bodyweight";

const CATEGORY_TABS: { id: WorkoutCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: Dumbbell },
  { id: "free_weights", label: "Free Weights", icon: Weight },
  { id: "machines", label: "Machines", icon: Settings2 },
  { id: "bodyweight", label: "Bodyweight", icon: PersonStanding },
];

const FREE_WEIGHT_EQ = ["barbell", "dumbbell", "ez bar", "kettlebell", "band", "cable"];
const MACHINE_EQ = ["machine", "smith", "leg press"];
const BODYWEIGHT_EQ = ["bodyweight", "pull-up", "rings"];

function getCategory(equipment: string): WorkoutCategory {
  const eq = (equipment || "").toLowerCase();
  if (BODYWEIGHT_EQ.some((e) => eq.includes(e))) return "bodyweight";
  if (MACHINE_EQ.some((e) => eq.includes(e))) return "machines";
  if (FREE_WEIGHT_EQ.some((e) => eq.includes(e))) return "free_weights";
  return "free_weights";
}

const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#2563eb",
  Back: "#22d3a5",
  Shoulders: "#f6ad55",
  Biceps: "#a78bfa",
  Triceps: "#fc8181",
  Legs: "#34d399",
  Glutes: "#fb923c",
  Core: "#60a5fa",
  "Full Body": "#818cf8",
  Cardio: "#e879f9",
};

export default function WorkoutsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [liftSearch, setLiftSearch] = useState("");
  const [workoutTab, setWorkoutTab] = useState<WorkoutCategory>("all");
  const [progressionTab, setProgressionTab] = useState<WorkoutCategory>("all");
  const { data: workouts = [] } = useWorkouts();
  const { data: exercises = [] } = useExercises();
  const { data: progression = [] } = useLiftProgression();
  const deleteWorkout = useDeleteWorkout();

  const exerciseCategoryMap = useMemo(() => {
    const map: Record<string, WorkoutCategory> = {};
    exercises.forEach((ex) => {
      map[ex.name] = getCategory(ex.equipment || "");
    });
    return map;
  }, [exercises]);

  const filteredWorkouts = useMemo(() => {
    if (workoutTab === "all") return workouts;
    return workouts.filter((w) => {
      if (!w.sets?.length) return false;
      return w.sets.some((s) => {
        const cat = exerciseCategoryMap[s.exercise_name] ?? "free_weights";
        return cat === workoutTab;
      });
    });
  }, [workouts, workoutTab, exerciseCategoryMap]);

  const filteredLifts = useMemo(() => {
    return progression.filter((l) => {
      const matchesSearch = !liftSearch || l.name.toLowerCase().includes(liftSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (progressionTab === "all") return true;
      const cat = exerciseCategoryMap[l.name] ?? "free_weights";
      return cat === progressionTab;
    });
  }, [progression, liftSearch, progressionTab, exerciseCategoryMap]);

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

      {workouts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5 animate-fade-in">
          <div className="stat-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-dim flex items-center justify-center">
              <Calendar size={18} className="text-accent" />
            </div>
            <div>
              <div className="text-[11px] text-text-3">Total Sessions</div>
              <div className="text-xl font-bold">{workouts.length}</div>
            </div>
          </div>
          <div className="stat-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-green/10 flex items-center justify-center">
              <BarChart2 size={18} className="text-status-green" />
            </div>
            <div>
              <div className="text-[11px] text-text-3">Exercises Tracked</div>
              <div className="text-xl font-bold">{progression.length}</div>
            </div>
          </div>
          <div className="stat-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-amber/10 flex items-center justify-center">
              <Zap size={18} className="text-status-amber" />
            </div>
            <div>
              <div className="text-[11px] text-text-3">Total Sets</div>
              <div className="text-xl font-bold">
                {workouts.reduce((a, w) => a + (w.sets?.length || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sessions */}
        <div className="card">
          <div className="card-title">Recent Sessions</div>
          <div className="flex gap-1 mb-3 bg-bg-2 p-1 rounded-lg border border-border overflow-x-auto">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setWorkoutTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                    workoutTab === tab.id ? "bg-accent text-white" : "text-text-2 hover:text-text-1"
                  )}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {filteredWorkouts.length === 0 ? (
            <div className="text-text-3 text-sm py-6 text-center">
              {workouts.length === 0 ? "No sessions logged yet." : "No sessions in this category."}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredWorkouts.map((s, idx) => (
                <div key={s.id} className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div
                    className={cn(
                      "flex items-center justify-between bg-bg-2 rounded-xl px-3 py-3 border cursor-pointer transition-all",
                      expanded === s.id ? "border-accent/40 bg-bg-3" : "border-border hover:border-border-2"
                    )}
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent-dim flex items-center justify-center">
                        <Dumbbell className="text-accent" size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{s.name}</div>
                        <div className="text-[11px] text-text-2 mt-0.5">
                          {formatDate(s.session_date)} · {s.sets?.length || 0} set{(s.sets?.length || 0) !== 1 ? "s" : ""}
                        </div>
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
                        className={cn(
                          "text-text-3 transition-transform duration-200",
                          expanded === s.id && "rotate-90"
                        )}
                      />
                    </div>
                  </div>

                  {expanded === s.id && s.sets && (
                    <div className="mt-1.5 mb-2 animate-fade-in">
                      <ExerciseBreakdown sets={s.sets} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lift Progression */}
        <div className="card">
          <div className="card-title">Lift Progression</div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              value={liftSearch}
              onChange={(e) => setLiftSearch(e.target.value)}
              placeholder="Search an exercise..."
              className="!pl-9"
            />
          </div>

          <div className="flex gap-1 mb-3 bg-bg-2 p-1 rounded-lg border border-border overflow-x-auto">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setProgressionTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                    progressionTab === tab.id ? "bg-accent text-white" : "text-text-2 hover:text-text-1"
                  )}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {filteredLifts.length === 0 ? (
            <div className="text-text-3 text-sm py-6 text-center">
              {progression.length === 0 ? "Log workouts to see progression." : "No matching lifts."}
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto">
              {filteredLifts.map((lift, idx) => (
                <div
                  key={lift.name}
                  className="flex items-center justify-between bg-bg-2 rounded-xl px-3 py-3 border border-border hover:border-border-2 transition-all animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div>
                    <div className="text-sm font-semibold">{lift.name}</div>
                    <div className="text-[11px] text-text-2 mt-0.5">
                      {lift.sessions} session{lift.sessions !== 1 ? "s" : ""} · PR: {lift.pr} {lift.unit}
                    </div>
                    <div className={cn("text-[11px] flex items-center gap-1 mt-1", lift.delta >= 0 ? "text-status-green" : "text-status-red")}>
                      <TrendingUp size={10} />
                      {lift.delta >= 0 ? "+" : ""}{lift.delta} {lift.unit} since start
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-accent">{lift.latest}</div>
                    <div className="text-[11px] text-text-3">{lift.unit} last</div>
                    <div className="mt-1.5 w-20 h-1 bg-bg-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full progress-bar bg-accent"
                        style={{ width: lift.pr > 0 ? `${Math.min(100, (lift.latest / lift.pr) * 100)}%` : "0%" }}
                      />
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

function ExerciseBreakdown({ sets }: { sets: WorkoutSet[] }) {
  const grouped = sets.reduce<Record<string, WorkoutSet[]>>((acc, set) => {
    if (!acc[set.exercise_name]) acc[set.exercise_name] = [];
    acc[set.exercise_name].push(set);
    return acc;
  }, {});

  return (
    <div className="space-y-2 pl-2">
      {Object.entries(grouped).map(([exerciseName, exSets]) => {
        const maxWeight = Math.max(...exSets.map((s) => s.weight || 0));
        return (
          <div key={exerciseName} className="bg-bg-1 rounded-lg px-3 py-2.5 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-1">{exerciseName}</span>
              <span className="text-[10px] text-text-3">{exSets.length} set{exSets.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {exSets.map((set) => {
                const isTop = set.weight === maxWeight && maxWeight > 0;
                return (
                  <div
                    key={set.id}
                    className={cn(
                      "px-2 py-1 rounded-md text-[11px]",
                      isTop
                        ? "bg-accent/20 border border-accent/30 text-accent"
                        : "bg-bg-3 border border-border text-text-2"
                    )}
                  >
                    {set.reps ? `${set.reps}` : "—"}
                    {set.weight ? ` × ${set.weight}${set.weight_unit}` : ""}
                    {isTop && <span className="ml-1 text-[9px] font-bold">★</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
  const [filterCat, setFilterCat] = useState<WorkoutCategory>("all");
  const [rows, setRows] = useState<DraftSet[]>([
    { exercise_name: "", sets: "3", reps: "", weight: "", notes: "" },
  ]);

  const filteredExercises = useMemo(() => {
    if (filterCat === "all") return exercises;
    return exercises.filter((ex) => getCategory(ex.equipment || "") === filterCat);
  }, [exercises, filterCat]);

  function addRow() {
    setRows([...rows, { exercise_name: "", sets: "3", reps: "", weight: "", notes: "" }]);
  }
  function updateRow(i: number, patch: Partial<DraftSet>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    if (!name) { toast.error("Enter a workout name"); return; }
    const setRows: Array<{
      exercise_name: string; set_number: number; reps: string;
      weight: number; weight_unit: string; notes: string;
    }> = [];
    rows.forEach((r) => {
      if (!r.exercise_name) return;
      const numSets = parseInt(r.sets) || 1;
      for (let i = 0; i < numSets; i++) {
        setRows.push({
          exercise_name: r.exercise_name, set_number: i + 1,
          reps: r.reps, weight: parseFloat(r.weight) || 0,
          weight_unit: wu, notes: r.notes,
        });
      }
    });
    if (setRows.length === 0) { toast.error("Add at least one exercise"); return; }
    createWorkout.mutate(
      { name, session_date: date, sets: setRows },
      {
        onSuccess: () => {
          toast.success("Workout saved");
          setName("");
          setRows([{ exercise_name: "", sets: "3", reps: "", weight: "", notes: "" }]);
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
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push Day A" />
          </div>
          <div className="w-40">
            <label className="label">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Filter by type</label>
          <div className="flex gap-1 bg-bg-2 p-1 rounded-lg border border-border w-fit">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterCat(tab.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-all",
                    filterCat === tab.id ? "bg-accent text-white" : "text-text-2 hover:text-text-1"
                  )}
                >
                  <Icon size={11} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card-title pt-1">Exercises</div>
        {rows.map((r, i) => (
          <div key={i} className="card-sm">
            <div className="flex gap-2.5 items-end flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="label">Exercise</label>
                <select value={r.exercise_name} onChange={(e) => updateRow(i, { exercise_name: e.target.value })}>
                  <option value="">Select...</option>
                  {filteredExercises.map((ex) => (
                    <option key={ex.id} value={ex.name}>{ex.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-14">
                <label className="label">Sets</label>
                <input type="number" value={r.sets} onChange={(e) => updateRow(i, { sets: e.target.value })} />
              </div>
              <div className="w-20">
                <label className="label">Reps</label>
                <input value={r.reps} onChange={(e) => updateRow(i, { reps: e.target.value })} placeholder="8-12" />
              </div>
              <div className="w-24">
                <label className="label">Weight ({wu})</label>
                <input type="number" value={r.weight} onChange={(e) => updateRow(i, { weight: e.target.value })} placeholder="135" />
              </div>
              {rows.length > 1 && (
                <button className="btn btn-danger btn-sm !px-2 mb-0.5" onClick={() => removeRow(i)}>
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
          <button className="btn btn-primary" onClick={handleSave}>Save Session</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
