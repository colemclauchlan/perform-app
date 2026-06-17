"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  useWorkouts,
  useExercises,
  useDeleteWorkout,
  useLiftProgression,
  useTemplates,
  useDeleteTemplate,
  LiftProgression,
} from "@/hooks/useTraining";
import { WorkoutSession, WorkoutSet, WorkoutTemplate } from "@/types/database";
import { formatDate, cn, muscleColor } from "@/lib/utils";
import { WorkoutBuilder } from "@/components/training/WorkoutBuilder";
import { ExerciseDetailModal } from "@/components/training/ExerciseDetailModal";
import {
  Plus,
  Trash2,
  ChevronRight,
  Search,
  TrendingUp,
  Dumbbell,
  Calendar,
  BarChart2,
  Zap,
  Trophy,
  Pencil,
  Play,
  LayoutTemplate,
} from "lucide-react";
import toast from "react-hot-toast";

const MUSCLE_LIST = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Glutes", "Core"];

export default function WorkoutsPage() {
  const { data: workouts = [] } = useWorkouts();
  const { data: exercises = [] } = useExercises();
  const { data: progression = [] } = useLiftProgression();
  const { data: templates = [] } = useTemplates();
  const deleteWorkout = useDeleteWorkout();
  const deleteTemplate = useDeleteTemplate();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editSession, setEditSession] = useState<WorkoutSession | null>(null);
  const [presetTemplate, setPresetTemplate] = useState<WorkoutTemplate | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [liftSearch, setLiftSearch] = useState("");
  const [detail, setDetail] = useState<{ ex: typeof exercises[number]; prog?: LiftProgression } | null>(null);

  const catalogByName = useMemo(() => {
    const m = new Map<string, typeof exercises[number]>();
    exercises.forEach((e) => m.set(e.name, e));
    return m;
  }, [exercises]);

  // weekly stats
  const weekStats = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    let sessions = 0;
    let sets = 0;
    let volume = 0;
    workouts.forEach((w) => {
      if (new Date(w.session_date).getTime() < cutoff) return;
      sessions++;
      (w.sets || []).forEach((s) => {
        sets++;
        volume += (s.weight || 0) * (parseInt(s.reps || "0") || 0);
      });
    });
    return { sessions, sets, volume: Math.round(volume) };
  }, [workouts]);

  const totalSets = useMemo(
    () => workouts.reduce((a, w) => a + (w.sets?.length || 0), 0),
    [workouts]
  );

  // muscle recovery: days since last trained per muscle
  const recovery = useMemo(() => {
    const lastByMuscle: Record<string, string> = {};
    [...workouts]
      .sort((a, b) => a.session_date.localeCompare(b.session_date))
      .forEach((w) => {
        (w.sets || []).forEach((s) => {
          const mg = catalogByName.get(s.exercise_name)?.muscle_group;
          if (mg) lastByMuscle[mg] = w.session_date;
        });
      });
    return MUSCLE_LIST.map((m) => {
      const last = lastByMuscle[m];
      const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;
      return { muscle: m, days, last };
    });
  }, [workouts, catalogByName]);

  const topPRs = useMemo(
    () => [...progression].sort((a, b) => b.e1rmPR - a.e1rmPR),
    [progression]
  );

  const filteredLifts = useMemo(
    () =>
      topPRs.filter((l) => !liftSearch || l.name.toLowerCase().includes(liftSearch.toLowerCase())),
    [topPRs, liftSearch]
  );

  function openNew() {
    setEditSession(null);
    setPresetTemplate(null);
    setBuilderOpen(true);
  }
  function openEdit(s: WorkoutSession) {
    setEditSession(s);
    setPresetTemplate(null);
    setBuilderOpen(true);
  }
  function startFromTemplate(t: WorkoutTemplate) {
    setEditSession(null);
    setPresetTemplate(t);
    setBuilderOpen(true);
  }

  return (
    <div className="p-6 max-w-[1200px]">
      <PageHeader
        title="Workouts"
        subtitle="Build sessions, track every set, and watch your lifts climb"
        action={
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> New Workout
          </button>
        }
      />

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 animate-fade-in">
        <StatCard icon={Calendar} tone="accent" label="Total Sessions" value={workouts.length} />
        <StatCard icon={Zap} tone="amber" label="This Week" value={`${weekStats.sessions} sess`} sub={`${weekStats.sets} sets`} />
        <StatCard icon={BarChart2} tone="green" label="7-Day Volume" value={weekStats.volume.toLocaleString()} />
        <StatCard icon={Trophy} tone="teal" label="Exercises Tracked" value={progression.length} sub={`${totalSets} sets all-time`} />
      </div>

      {/* recovery heatmap */}
      <div className="card mb-4">
        <div className="card-title flex items-center gap-2"><Dumbbell size={14} /> Muscle Recovery</div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {recovery.map((r) => {
            const fresh = r.days === null;
            const tone =
              r.days === null ? "bg-bg-2 text-text-3 border-border"
                : r.days === 0 ? "bg-status-red/15 text-status-red border-status-red/30"
                : r.days === 1 ? "bg-status-amber/15 text-status-amber border-status-amber/30"
                : r.days <= 3 ? "bg-status-teal/15 text-status-teal border-status-teal/30"
                : "bg-status-green/15 text-status-green border-status-green/30";
            return (
              <div key={r.muscle} className={cn("rounded-xl border px-2 py-2.5 text-center", tone)}>
                <div className="text-[11px] font-semibold">{r.muscle}</div>
                <div className="text-[10px] mt-0.5 opacity-90">
                  {fresh ? "untrained" : r.days === 0 ? "today" : `${r.days}d rest`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* templates */}
      {templates.length > 0 && (
        <div className="card mb-4">
          <div className="card-title flex items-center gap-2"><LayoutTemplate size={14} /> Templates</div>
          <div className="flex gap-2 flex-wrap">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-1.5 bg-bg-2 border border-border rounded-xl pl-3 pr-1.5 py-1.5 hover:border-border-2 transition-all">
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-[10px] text-text-3">{(t.data || []).length} exercises</div>
                </div>
                <button className="btn btn-primary btn-sm !px-2" onClick={() => startFromTemplate(t)} title="Start workout">
                  <Play size={12} />
                </button>
                <button
                  className="btn btn-ghost btn-sm !px-1.5"
                  onClick={() => {
                    deleteTemplate.mutate(t.id);
                    toast.success("Template deleted");
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* sessions */}
        <div className="card">
          <div className="card-title">Recent Sessions</div>
          {workouts.length === 0 ? (
            <div className="text-text-3 text-sm py-8 text-center">No sessions logged yet. Hit New Workout to begin.</div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-0.5">
              {workouts.map((s, idx) => {
                const vol = (s.sets || []).reduce((a, x) => a + (x.weight || 0) * (parseInt(x.reps || "0") || 0), 0);
                return (
                  <div key={s.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                    <div
                      className={cn(
                        "flex items-center justify-between bg-bg-2 rounded-xl px-3 py-3 border cursor-pointer transition-all",
                        expanded === s.id ? "border-accent/40 bg-bg-3" : "border-border hover:border-border-2"
                      )}
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
                          <Dumbbell className="text-accent" size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{s.name}</div>
                          <div className="text-[11px] text-text-2 mt-0.5">
                            {formatDate(s.session_date)} · {s.sets?.length || 0} sets
                            {vol > 0 ? ` · ${Math.round(vol).toLocaleString()} vol` : ""}
                            {s.duration_minutes ? ` · ${s.duration_minutes}m` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="btn btn-ghost btn-sm !px-1.5"
                          onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                        >
                          <Pencil size={13} />
                        </button>
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
                        <ChevronRight size={15} className={cn("text-text-3 transition-transform", expanded === s.id && "rotate-90")} />
                      </div>
                    </div>
                    {expanded === s.id && s.sets && (
                      <div className="mt-1.5 mb-2 animate-fade-in">
                        <ExerciseBreakdown sets={s.sets} catalogByName={catalogByName} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* progression / PRs */}
        <div className="card">
          <div className="card-title">Lift Progression &amp; PRs</div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input value={liftSearch} onChange={(e) => setLiftSearch(e.target.value)} placeholder="Search a lift..." className="!pl-9" />
          </div>
          {filteredLifts.length === 0 ? (
            <div className="text-text-3 text-sm py-8 text-center">
              {progression.length === 0 ? "Log workouts to see progression." : "No matching lifts."}
            </div>
          ) : (
            <div className="space-y-2 max-h-[508px] overflow-y-auto pr-0.5">
              {filteredLifts.map((lift, idx) => {
                const ex = catalogByName.get(lift.name);
                const mg = ex?.muscle_group || "Other";
                return (
                  <button
                    key={lift.name}
                    onClick={() => ex && setDetail({ ex, prog: lift })}
                    className="w-full text-left flex items-center justify-between bg-bg-2 rounded-xl px-3 py-3 border border-border hover:border-border-2 transition-all animate-fade-in"
                    style={{ animationDelay: `${idx * 25}ms` }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: muscleColor(mg) }} />
                        {lift.name}
                      </div>
                      <div className="text-[11px] text-text-2 mt-0.5">
                        Best {lift.bestReps} · {lift.sessions} sets
                      </div>
                      <div className={cn("text-[11px] flex items-center gap-1 mt-1", lift.delta >= 0 ? "text-status-green" : "text-status-red")}>
                        <TrendingUp size={10} />
                        {lift.delta >= 0 ? "+" : ""}{lift.delta} {lift.unit} since start
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-[10px] text-text-3 uppercase tracking-wide">e1RM</div>
                      <div className="text-xl font-bold text-accent">{lift.e1rmPR}</div>
                      <div className="text-[10px] text-text-3">{lift.unit}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <WorkoutBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        editSession={editSession}
        presetTemplate={presetTemplate?.data ?? null}
        presetName={presetTemplate?.name}
      />
      <ExerciseDetailModal
        open={!!detail}
        onClose={() => setDetail(null)}
        exercise={detail?.ex ?? null}
        progression={detail?.prog}
      />
    </div>
  );
}

const TONES: Record<string, { bg: string; text: string }> = {
  accent: { bg: "bg-accent-dim", text: "text-accent" },
  amber: { bg: "bg-status-amber/10", text: "text-status-amber" },
  green: { bg: "bg-status-green/10", text: "text-status-green" },
  teal: { bg: "bg-status-teal/10", text: "text-status-teal" },
};

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  tone: keyof typeof TONES;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  const t = TONES[tone];
  return (
    <div className="stat-card flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", t.bg)}>
        <Icon size={18} className={t.text} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-text-3">{label}</div>
        <div className="text-xl font-bold truncate">{value}</div>
        {sub && <div className="text-[10px] text-text-3">{sub}</div>}
      </div>
    </div>
  );
}

function ExerciseBreakdown({
  sets,
  catalogByName,
}: {
  sets: WorkoutSet[];
  catalogByName: Map<string, { muscle_group: string }>;
}) {
  const ordered = [...sets].sort((a, b) => a.position - b.position);
  const grouped: { name: string; sets: WorkoutSet[] }[] = [];
  const idx = new Map<string, number>();
  ordered.forEach((s) => {
    if (!idx.has(s.exercise_name)) {
      idx.set(s.exercise_name, grouped.length);
      grouped.push({ name: s.exercise_name, sets: [] });
    }
    grouped[idx.get(s.exercise_name)!].sets.push(s);
  });

  return (
    <div className="space-y-2 pl-2">
      {grouped.map((g) => {
        const mg = catalogByName.get(g.name)?.muscle_group || "Other";
        const topE1 = Math.max(...g.sets.map((s) => s.e1rm || 0));
        return (
          <div key={g.name} className="bg-bg-1 rounded-lg px-3 py-2.5 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: muscleColor(mg) }} />
                {g.name}
                {g.sets[0].superset_group && (
                  <span className="text-[9px] font-bold text-accent bg-accent-dim px-1 rounded">SS {g.sets[0].superset_group}</span>
                )}
              </span>
              <span className="text-[10px] text-text-3">{g.sets.length} sets</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {g.sets.map((set) => {
                const isTop = (set.e1rm || 0) === topE1 && topE1 > 0;
                return (
                  <div
                    key={set.id}
                    className={cn(
                      "px-2 py-1 rounded-md text-[11px]",
                      set.set_type === "Warmup" ? "bg-status-amber/10 border border-status-amber/20 text-status-amber"
                        : set.set_type === "Failure" ? "bg-status-red/10 border border-status-red/20 text-status-red"
                        : isTop ? "bg-accent/20 border border-accent/30 text-accent"
                        : "bg-bg-3 border border-border text-text-2"
                    )}
                  >
                    {set.weight ? `${set.weight}${set.weight_unit} × ` : ""}{set.reps || "—"}
                    {set.rpe ? ` @${set.rpe}` : ""}
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
