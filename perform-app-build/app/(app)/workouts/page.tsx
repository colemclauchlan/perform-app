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
  useWorkoutPhotoUrls,
  LiftProgression,
} from "@/hooks/useTraining";
import { WorkoutSession, WorkoutSet, WorkoutTemplate } from "@/types/database";
import { formatDate, cn, muscleColor } from "@/lib/utils";
import { WorkoutBuilder } from "@/components/training/WorkoutBuilder";
import { ExerciseDetailModal } from "@/components/training/ExerciseDetailModal";
import { AIWorkoutModal } from "@/components/training/AIWorkoutModal";
import { TemplateEditorModal } from "@/components/training/TemplateEditorModal";
import { MuscleModel3DView } from "@/components/visual/MuscleModel3DView";
import { Reveal, Stagger, StaggerItem } from "@/components/visual/Motion";
import { motion } from "framer-motion";
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
  Sparkles,
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
  const [aiOpen, setAiOpen] = useState(false);
  const [editSession, setEditSession] = useState<WorkoutSession | null>(null);
  const [presetTemplate, setPresetTemplate] = useState<WorkoutTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<WorkoutTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [liftSearch, setLiftSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
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
    let unit = "";
    workouts.forEach((w) => {
      if (new Date(w.session_date).getTime() < cutoff) return;
      sessions++;
      (w.sets || []).forEach((s) => {
        sets++;
        volume += (s.weight || 0) * (parseInt(s.reps || "0") || 0);
        if (!unit && s.weight_unit) unit = s.weight_unit;
      });
    });
    return { sessions, sets, volume: Math.round(volume), unit };
  }, [workouts]);

  const totalSets = useMemo(
    () => workouts.reduce((a, w) => a + (w.sets?.length || 0), 0),
    [workouts]
  );

  // muscle recovery: days since last trained + times trained THIS WEEK (resets weekly)
  const recovery = useMemo(() => {
    // week starts Monday
    const now = new Date();
    const weekStart = new Date(now);
    const dow = (now.getDay() + 6) % 7; // 0 = Monday
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - dow);
    const weekStartMs = weekStart.getTime();

    const lastByMuscle: Record<string, string> = {};
    const weekHits: Record<string, Set<string>> = {};
    [...workouts]
      .sort((a, b) => a.session_date.localeCompare(b.session_date))
      .forEach((w) => {
        const sessionMs = new Date(w.session_date).getTime();
        const musclesThisSession = new Set<string>();
        (w.sets || []).forEach((s) => {
          const mg = catalogByName.get(s.exercise_name)?.muscle_group;
          if (mg) {
            lastByMuscle[mg] = w.session_date;
            musclesThisSession.add(mg);
          }
        });
        if (sessionMs >= weekStartMs) {
          musclesThisSession.forEach((mg) => {
            if (!weekHits[mg]) weekHits[mg] = new Set();
            weekHits[mg].add(w.id);
          });
        }
      });
    return MUSCLE_LIST.map((m) => {
      const last = lastByMuscle[m];
      const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;
      return { muscle: m, days, last, hits: weekHits[m]?.size || 0 };
    });
  }, [workouts, catalogByName]);

  // Muscles trained this week → highlighted on the 3D model in the hero.
  const musclesThisWeek = useMemo(
    () => recovery.filter((r) => r.hits > 0).map((r) => r.muscle),
    [recovery]
  );

  const topPRs = useMemo(
    () => [...progression].sort((a, b) => b.e1rmPR - a.e1rmPR),
    [progression]
  );

  const filteredLifts = useMemo(
    () =>
      topPRs.filter((l) => !liftSearch || l.name.toLowerCase().includes(liftSearch.toLowerCase())),
    [topPRs, liftSearch]
  );

  // search recent sessions by title or notes
  const filteredWorkouts = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    if (!q) return workouts;
    return workouts.filter(
      (w) =>
        (w.name || "").toLowerCase().includes(q) ||
        (w.notes || "").toLowerCase().includes(q)
    );
  }, [workouts, sessionSearch]);

  // which session set each lift's e1RM PR → click PR to jump to its source workout
  const prSessionByLift = useMemo(() => {
    const map: Record<string, { sessionId: string; e1rm: number }> = {};
    workouts.forEach((w) => {
      (w.sets || []).forEach((s) => {
        const e1 = s.e1rm || 0;
        const cur = map[s.exercise_name];
        if (!cur || e1 > cur.e1rm) map[s.exercise_name] = { sessionId: w.id, e1rm: e1 };
      });
    });
    return map;
  }, [workouts]);

  function jumpToSession(sessionId: string) {
    setSessionSearch("");
    setExpanded(sessionId);
    setTimeout(() => {
      document.getElementById(`session-${sessionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  }

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
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setAiOpen(true)}>
              <Sparkles size={16} className="text-accent" /> AI Program
            </button>
            <button className="btn btn-primary group" onClick={openNew}>
              <span className="shine-overlay" />
              <Plus size={16} /> New Workout
            </button>
          </div>
        }
      />

      <AIWorkoutModal open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* ── Logging-first hero: start a workout + 3D muscles worked this week ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="panel hairline-top overflow-hidden mb-5"
      >
        <div className="absolute -top-24 -right-16 w-80 h-80 bg-brand-gradient opacity-20 blur-3xl pointer-events-none" />
        <div className="relative grid lg:grid-cols-[1fr_280px] gap-5 p-5 sm:p-6">
          <div className="flex flex-col">
            <div className="text-[11px] uppercase tracking-[0.14em] text-text-3 font-semibold mb-1">This week</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-none tabular-nums">
              <span className="text-brand">{weekStats.volume.toLocaleString()}</span>
              {weekStats.unit && <span className="text-base text-text-2 font-normal ml-2">{weekStats.unit} moved</span>}
            </h2>
            <p className="text-sm text-text-2 mt-2 tabular-nums">
              {weekStats.sessions} session{weekStats.sessions !== 1 ? "s" : ""} · {weekStats.sets} sets
              <span className="text-text-3"> · {workouts.length} all-time · {progression.length} lifts tracked</span>
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={openNew}
              className="btn btn-primary group mt-4 self-start px-6 py-3 text-base"
            >
              <span className="shine-overlay" />
              <Play size={18} /> Start a Workout
            </motion.button>

            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wide text-text-3 mb-1.5">Quick start</div>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setAiOpen(true)} className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border border-border bg-bg-2 text-text-2 hover:border-accent/50 hover:text-text-1 transition-colors">
                  <Sparkles size={13} className="text-accent" /> AI Program
                </button>
                {templates.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => startFromTemplate(t)}
                    className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border border-border bg-bg-2 text-text-2 hover:border-accent/50 hover:text-text-1 transition-colors max-w-[170px]"
                  >
                    <LayoutTemplate size={12} /> <span className="truncate">{t.name}</span>
                  </button>
                ))}
                {templates.length === 0 && (
                  <span className="text-[12px] text-text-3">Save a workout as a template for one-tap starts.</span>
                )}
              </div>
            </div>

            {musclesThisWeek.length > 0 && (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wide text-text-3 mb-1.5">Trained this week</div>
                <Stagger className="flex flex-wrap gap-1.5">
                  {recovery
                    .filter((r) => r.hits > 0)
                    .map((r) => (
                      <StaggerItem key={r.muscle}>
                        <span className="badge bg-status-green/15 text-status-green ring-1 ring-inset ring-status-green/20 text-[11px]">
                          {r.muscle} ×{r.hits}
                        </span>
                      </StaggerItem>
                    ))}
                </Stagger>
              </div>
            )}
          </div>

          {/* 3D muscle model — muscles trained this week glow red */}
          <div className="hidden sm:block">
            <MuscleModel3DView primary="" secondary={musclesThisWeek} height={300} showLegend={false} caption="Worked this week" />
          </div>
        </div>
      </motion.div>

      {/* recovery heatmap */}
      <div className="card mb-4">
        <div className="card-title flex items-center justify-between">
          <span className="flex items-center gap-2"><Dumbbell size={14} /> Muscle Recovery</span>
          <span className="text-[10px] text-text-3 font-normal normal-case">sets this week · resets Monday</span>
        </div>
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
              <div key={r.muscle} className={cn("relative rounded-xl border px-2 py-2.5 text-center", tone)}>
                {r.hits > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    ×{r.hits}
                  </span>
                )}
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
          <div className="flex items-center justify-between mb-3">
            <div className="card-title !mb-0 flex items-center gap-2"><LayoutTemplate size={14} /> Pre-saved Programs</div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditTemplate(null);
                setEditorOpen(true);
              }}
            >
              <Plus size={14} /> New Program
            </button>
          </div>
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
                    setEditTemplate(t);
                    setEditorOpen(true);
                  }}
                  title="Edit program"
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="btn btn-ghost btn-sm !px-1.5"
                  onClick={() => {
                    deleteTemplate.mutate(t.id);
                    toast.success("Template deleted");
                  }}
                  title="Delete program"
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
          {workouts.length > 0 && (
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
              <input
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Search by title or notes..."
                className="!pl-9"
              />
            </div>
          )}
          {workouts.length === 0 ? (
            <div className="text-text-3 text-sm py-8 text-center">No sessions logged yet. Hit New Workout to begin.</div>
          ) : filteredWorkouts.length === 0 ? (
            <div className="text-text-3 text-sm py-8 text-center">No sessions match “{sessionSearch}”.</div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-0.5">
              {filteredWorkouts.map((s, idx) => {
                const vol = (s.sets || []).reduce((a, x) => a + (x.weight || 0) * (parseInt(x.reps || "0") || 0), 0);
                const volUnit = (s.sets || []).find((x) => x.weight)?.weight_unit || "lbs";
                return (
                  <div key={s.id} id={`session-${s.id}`} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
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
                            {vol > 0 ? ` · ${Math.round(vol).toLocaleString()} ${volUnit} vol` : ""}
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
                        {(s.photo_urls?.length > 0 || s.notes) && (
                          <div className="mt-2 flex flex-wrap gap-3 items-start">
                            {s.photo_urls?.length > 0 && <SessionPhotos paths={s.photo_urls} />}
                            {s.notes && (
                              <div className="flex-1 min-w-[180px] text-[13px] text-text-2 bg-bg-2/60 border border-border rounded-lg px-3 py-2 whitespace-pre-wrap">
                                <div className="text-[10px] uppercase tracking-wider text-text-3 mb-1">Notes</div>
                                {s.notes}
                              </div>
                            )}
                          </div>
                        )}
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
                const prSession = prSessionByLift[lift.name];
                return (
                  <div
                    key={lift.name}
                    className="w-full flex items-center justify-between bg-bg-2 rounded-xl px-3 py-3 border border-border hover:border-border-2 transition-all animate-fade-in"
                    style={{ animationDelay: `${idx * 25}ms` }}
                  >
                    <button onClick={() => ex && setDetail({ ex, prog: lift })} className="text-left min-w-0 flex-1">
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
                    </button>
                    <button
                      onClick={() => prSession && jumpToSession(prSession.sessionId)}
                      disabled={!prSession}
                      title={prSession ? "Jump to the workout where this PR was set" : undefined}
                      className={cn(
                        "text-right shrink-0 ml-2 rounded-lg px-2 py-1 transition-all",
                        prSession ? "hover:bg-accent/10 cursor-pointer" : "cursor-default"
                      )}
                    >
                      <div className="text-[10px] text-text-3 uppercase tracking-wide">e1RM</div>
                      <div className="text-xl font-bold text-accent">{lift.e1rmPR}</div>
                      <div className="text-[10px] text-text-3">{lift.unit}{prSession ? " · view" : ""}</div>
                    </button>
                  </div>
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
      <TemplateEditorModal template={editTemplate} open={editorOpen} onClose={() => setEditorOpen(false)} />
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

function SessionPhotos({ paths }: { paths: string[] }) {
  const { data: signed = {} } = useWorkoutPhotoUrls(paths);
  return (
    <div className="flex flex-wrap gap-2">
      {paths.map((p) =>
        signed[p] ? (
          <a key={p} href={signed[p]} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-border hover:border-accent/50 transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signed[p]} alt="Workout" className="w-full h-full object-cover" />
          </a>
        ) : (
          <div key={p} className="w-20 h-20 rounded-lg bg-bg-2 animate-pulse" />
        )
      )}
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
        // Only show sets that actually have weight logged; skip the exercise if none.
        const weighted = g.sets.filter((s) => s.weight);
        if (weighted.length === 0) return null;
        const mg = catalogByName.get(g.name)?.muscle_group || "Other";
        const topE1 = Math.max(...weighted.map((s) => s.e1rm || 0));
        return (
          <div key={g.name} className="bg-bg-1 rounded-lg px-3 py-2.5 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: muscleColor(mg) }} />
                {g.name}
                {weighted[0].superset_group && (
                  <span className="text-[9px] font-bold text-accent bg-accent-dim px-1 rounded">SS {weighted[0].superset_group}</span>
                )}
              </span>
              <span className="text-[10px] text-text-3">{weighted.length} sets</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {weighted.map((set) => {
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
