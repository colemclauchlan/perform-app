"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  useExercises,
  useCreateWorkout,
  useUpdateWorkout,
  useSaveTemplate,
  useFavorites,
  useToggleFavorite,
  useWorkoutPhotoUrls,
  uploadWorkoutPhoto,
  SetInput,
} from "@/hooks/useTraining";
import { useProfile } from "@/hooks/useNutrition";
import {
  ExerciseCatalogItem,
  WorkoutSession,
  TemplateExercise,
  SetType,
  ExerciseCategory,
} from "@/types/database";
import { todayISO, cn, muscleColor, suggestSubstitutions } from "@/lib/utils";
import { RestTimer } from "./RestTimer";
import {
  Plus,
  X,
  Search,
  Trash2,
  ChevronUp,
  ChevronDown,
  Timer,
  Star,
  Save,
  Link2,
  ImagePlus,
  Repeat,
} from "lucide-react";
import toast from "react-hot-toast";

const SET_TYPES: SetType[] = ["Warmup", "Working", "Failure", "Backoff", "Dropset"];
const SET_TYPE_ABBR: Record<SetType, string> = {
  Warmup: "W",
  Working: "—",
  Failure: "F",
  Backoff: "B",
  Dropset: "D",
};
const SET_TYPE_COLOR: Record<SetType, string> = {
  Warmup: "text-status-amber",
  Working: "text-text-2",
  Failure: "text-status-red",
  Backoff: "text-status-teal",
  Dropset: "text-accent",
};
const SS_LETTERS = ["A", "B", "C", "D", "E"];

const CATEGORIES: (ExerciseCategory | "All")[] = [
  "All",
  "Free Weights",
  "Cable Machines",
  "Plate Loaded Machines",
  "Selectorized Machines",
  "Bodyweight / Calisthenics",
  "Cardio",
];

type BuilderSet = { set_type: SetType; reps: string; weight: string; rpe: string };
type BuilderExercise = {
  key: string;
  exercise_name: string;
  exercise_catalog_id: string | null;
  muscle_group: string;
  category: string;
  superset_group: string | null;
  rest_seconds: number;
  sets: BuilderSet[];
};

const uid = () => Math.random().toString(36).slice(2, 10);
const blankSet = (): BuilderSet => ({ set_type: "Working", reps: "", weight: "", rpe: "" });

function fromCatalog(ex: ExerciseCatalogItem): BuilderExercise {
  return {
    key: uid(),
    exercise_name: ex.name,
    exercise_catalog_id: ex.id,
    muscle_group: ex.muscle_group,
    category: ex.category || "",
    superset_group: null,
    rest_seconds: 90,
    sets: [blankSet(), blankSet(), blankSet()],
  };
}

export function WorkoutBuilder({
  open,
  onClose,
  editSession,
  presetTemplate,
  presetName,
}: {
  open: boolean;
  onClose: () => void;
  editSession?: WorkoutSession | null;
  presetTemplate?: TemplateExercise[] | null;
  presetName?: string;
}) {
  const { data: catalog = [] } = useExercises();
  const { data: profile } = useProfile();
  const { data: favorites = [] } = useFavorites();
  const toggleFav = useToggleFavorite();
  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();
  const saveTemplate = useSaveTemplate();
  const wu = profile?.weight_unit || "lbs";

  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<BuilderExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [swapKey, setSwapKey] = useState<string | null>(null);
  const [alsoTemplate, setAlsoTemplate] = useState(false);
  const [saving, setSaving] = useState(false);

  // photos: existing storage paths kept on the session + freshly picked files
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const { data: signedPhotos = {} } = useWorkoutPhotoUrls(photoPaths);

  const pendingPreviews = useMemo(
    () => pendingFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [pendingFiles]
  );
  useEffect(() => {
    return () => pendingPreviews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [pendingPreviews]);

  // rest timer
  const [restSignal, setRestSignal] = useState(0);
  const [restSeconds, setRestSeconds] = useState(90);
  const [timerOpen, setTimerOpen] = useState(false);

  const catalogByName = useMemo(() => {
    const m = new Map<string, ExerciseCatalogItem>();
    catalog.forEach((e) => m.set(e.name, e));
    return m;
  }, [catalog]);

  // initialize when opened
  useEffect(() => {
    if (!open) return;
    setPendingFiles([]);
    setPhotoPaths(editSession?.photo_urls || []);
    if (editSession) {
      setName(editSession.name);
      setDate(editSession.session_date);
      setDuration(editSession.duration_minutes ? String(editSession.duration_minutes) : "");
      setNotes(editSession.notes || "");
      const ordered = [...(editSession.sets || [])].sort((a, b) => a.position - b.position);
      const groups: BuilderExercise[] = [];
      const byName = new Map<string, BuilderExercise>();
      ordered.forEach((s) => {
        let g = byName.get(s.exercise_name);
        if (!g) {
          const cat = catalogByName.get(s.exercise_name);
          g = {
            key: uid(),
            exercise_name: s.exercise_name,
            exercise_catalog_id: s.exercise_catalog_id ?? cat?.id ?? null,
            muscle_group: cat?.muscle_group || "Other",
            category: cat?.category || "",
            superset_group: s.superset_group ?? null,
            rest_seconds: s.rest_seconds ?? 90,
            sets: [],
          };
          byName.set(s.exercise_name, g);
          groups.push(g);
        }
        g.sets.push({
          set_type: s.set_type || "Working",
          reps: s.reps || "",
          weight: s.weight == null ? "" : String(s.weight),
          rpe: s.rpe == null ? "" : String(s.rpe),
        });
      });
      setExercises(groups);
    } else if (presetTemplate) {
      setName(presetName || "");
      setDate(todayISO());
      setDuration("");
      setNotes("");
      setExercises(
        presetTemplate.map((te) => {
          const cat = catalogByName.get(te.exercise_name);
          return {
            key: uid(),
            exercise_name: te.exercise_name,
            exercise_catalog_id: cat?.id ?? null,
            muscle_group: te.muscle_group || cat?.muscle_group || "Other",
            category: te.category || cat?.category || "",
            superset_group: te.superset_group ?? null,
            rest_seconds: 90,
            sets: te.sets.length
              ? te.sets.map((s) => ({
                  set_type: s.set_type || "Working",
                  reps: s.reps || "",
                  weight: s.weight == null ? "" : String(s.weight),
                  rpe: s.rpe == null ? "" : String(s.rpe),
                }))
              : [blankSet()],
          };
        })
      );
    } else {
      setName("");
      setDate(todayISO());
      setDuration("");
      setNotes("");
      setExercises([]);
    }
    setAlsoTemplate(false);
    setTimerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editSession, presetTemplate]);

  function patchExercise(key: string, patch: Partial<BuilderExercise>) {
    setExercises((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }
  function patchSet(key: string, idx: number, patch: Partial<BuilderSet>) {
    setExercises((xs) =>
      xs.map((x) =>
        x.key === key
          ? { ...x, sets: x.sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)) }
          : x
      )
    );
  }
  function addSet(key: string) {
    setExercises((xs) =>
      xs.map((x) => {
        if (x.key !== key) return x;
        const last = x.sets[x.sets.length - 1];
        return { ...x, sets: [...x.sets, last ? { ...last, set_type: "Working" } : blankSet()] };
      })
    );
  }
  function removeSet(key: string, idx: number) {
    setExercises((xs) =>
      xs.map((x) => (x.key === key ? { ...x, sets: x.sets.filter((_, i) => i !== idx) } : x))
    );
  }
  function removeExercise(key: string) {
    setExercises((xs) => xs.filter((x) => x.key !== key));
  }
  function move(key: string, dir: -1 | 1) {
    setExercises((xs) => {
      const i = xs.findIndex((x) => x.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= xs.length) return xs;
      const copy = [...xs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function cycleSuperset(key: string) {
    setExercises((xs) =>
      xs.map((x) => {
        if (x.key !== key) return x;
        const cur = x.superset_group;
        const i = cur ? SS_LETTERS.indexOf(cur) : -1;
        const next = i + 1 >= SS_LETTERS.length ? null : SS_LETTERS[i + 1];
        return { ...x, superset_group: next };
      })
    );
  }

  function addExerciseFromCatalog(ex: ExerciseCatalogItem) {
    setExercises((xs) => [...xs, fromCatalog(ex)]);
  }

  // Replace an exercise in-place (keeping its sets/rest/superset) with a chosen alternative.
  function swapExercise(key: string, alt: ExerciseCatalogItem) {
    setExercises((xs) =>
      xs.map((x) =>
        x.key === key
          ? {
              ...x,
              exercise_name: alt.name,
              exercise_catalog_id: alt.id,
              muscle_group: alt.muscle_group,
              category: alt.category || "",
            }
          : x
      )
    );
  }

  const swapTarget = useMemo(
    () => (swapKey ? exercises.find((x) => x.key === swapKey) || null : null),
    [swapKey, exercises]
  );

  function startRest(seconds: number) {
    setRestSeconds(seconds);
    setRestSignal((s) => s + 1);
    setTimerOpen(true);
  }

  function buildSetInputs(): SetInput[] {
    const out: SetInput[] = [];
    let pos = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s, i) => {
        out.push({
          exercise_name: ex.exercise_name,
          exercise_catalog_id: ex.exercise_catalog_id,
          set_number: i + 1,
          position: pos++,
          reps: s.reps,
          weight: s.weight === "" ? null : parseFloat(s.weight),
          weight_unit: wu,
          rpe: s.rpe === "" ? null : parseFloat(s.rpe),
          rest_seconds: ex.rest_seconds || null,
          set_type: s.set_type,
          superset_group: ex.superset_group,
        });
      });
    });
    return out;
  }

  async function handleSave() {
    if (!name.trim()) return toast.error("Name your workout");
    if (exercises.length === 0) return toast.error("Add at least one exercise");
    const sets = buildSetInputs();
    if (sets.length === 0) return toast.error("Add at least one set");

    setSaving(true);
    let uploaded: string[] = [];
    try {
      uploaded = await Promise.all(pendingFiles.map((f) => uploadWorkoutPhoto(f)));
    } catch (e) {
      setSaving(false);
      return toast.error(e instanceof Error ? e.message : "Photo upload failed");
    }

    const input = {
      name: name.trim(),
      session_date: date,
      duration_minutes: duration ? parseInt(duration) : null,
      notes: notes || null,
      photo_urls: [...photoPaths, ...uploaded],
      sets,
    };

    const onSuccess = () => {
      setSaving(false);
      if (alsoTemplate) {
        saveTemplate.mutate({
          name: name.trim(),
          notes: notes || null,
          data: exercises.map<TemplateExercise>((ex) => ({
            exercise_name: ex.exercise_name,
            category: ex.category,
            muscle_group: ex.muscle_group,
            superset_group: ex.superset_group,
            sets: ex.sets.map((s) => ({
              weight: s.weight === "" ? null : parseFloat(s.weight),
              reps: s.reps,
              rpe: s.rpe === "" ? null : parseFloat(s.rpe),
              set_type: s.set_type,
            })),
          })),
        });
      }
      toast.success(editSession ? "Workout updated" : "Workout saved");
      onClose();
    };

    const onError = (e: Error) => {
      setSaving(false);
      toast.error(e.message);
    };

    if (editSession) {
      updateWorkout.mutate({ id: editSession.id, input }, { onSuccess, onError });
    } else {
      createWorkout.mutate(input, { onSuccess, onError });
    }
  }

  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
  const tonnage = exercises.reduce(
    (a, e) =>
      a +
      e.sets.reduce((b, s) => {
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps) || 0;
        return b + w * r;
      }, 0),
    0
  );

  return (
    <>
      <Modal open={open} onClose={onClose} title={editSession ? "Edit Workout" : "New Workout"} wide>
        <div className="space-y-3">
          {/* meta */}
          <div className="flex gap-2.5 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="label">Workout name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push Day A" />
            </div>
            <div className="w-36">
              <label className="label">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="w-24">
              <label className="label">Duration (m)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" />
            </div>
          </div>

          {/* summary bar */}
          <div className="flex items-center gap-4 text-[11px] text-text-3 px-1">
            <span>{exercises.length} exercises</span>
            <span>{totalSets} sets</span>
            <span>{Math.round(tonnage).toLocaleString()} {wu} volume</span>
            <button
              className="ml-auto btn btn-ghost btn-sm"
              onClick={() => startRest(restSeconds)}
            >
              <Timer size={13} /> Rest timer
            </button>
          </div>

          {/* exercises */}
          {exercises.length === 0 ? (
            <div className="text-center text-text-3 text-sm py-8 border border-dashed border-border rounded-xl">
              No exercises yet. Add one to start building your session.
            </div>
          ) : (
            <div className="space-y-2.5">
              {exercises.map((ex, exIdx) => (
                <div key={ex.key} className="card-sm !p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: muscleColor(ex.muscle_group) }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                        {ex.superset_group && (
                          <span className="text-[10px] font-bold text-accent bg-accent-dim px-1.5 rounded">SS {ex.superset_group}</span>
                        )}
                        {ex.exercise_name}
                      </div>
                      <div className="text-[10px] text-text-3">{ex.muscle_group}{ex.category ? ` · ${ex.category}` : ""}</div>
                    </div>
                    <div className="ml-auto flex items-center gap-0.5">
                      <button className="btn btn-ghost btn-sm !px-1.5" title="Swap exercise" onClick={() => setSwapKey(ex.key)}>
                        <Repeat size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm !px-1.5" title="Superset group" onClick={() => cycleSuperset(ex.key)}>
                        <Link2 size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => move(ex.key, -1)} disabled={exIdx === 0}>
                        <ChevronUp size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => move(ex.key, 1)} disabled={exIdx === exercises.length - 1}>
                        <ChevronDown size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => removeExercise(ex.key)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* set header */}
                  <div className="grid grid-cols-[28px_64px_1fr_1fr_56px_28px] gap-1.5 text-[9px] uppercase tracking-wide text-text-3 px-0.5 mb-1">
                    <span>#</span>
                    <span>Type</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span>RPE</span>
                    <span></span>
                  </div>
                  <div className="space-y-1">
                    {ex.sets.map((s, i) => (
                      <div key={i} className="grid grid-cols-[28px_64px_1fr_1fr_56px_28px] gap-1.5 items-center">
                        <span className="text-xs text-text-3 text-center">{i + 1}</span>
                        <select
                          value={s.set_type}
                          onChange={(e) => patchSet(ex.key, i, { set_type: e.target.value as SetType })}
                          className={cn("!py-1 !px-1 text-[11px] font-semibold", SET_TYPE_COLOR[s.set_type])}
                          title={s.set_type}
                        >
                          {SET_TYPES.map((t) => (
                            <option key={t} value={t}>{SET_TYPE_ABBR[t]} {t}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={s.weight}
                          onChange={(e) => patchSet(ex.key, i, { weight: e.target.value })}
                          placeholder={wu}
                          className="!py-1 text-sm"
                        />
                        <input
                          value={s.reps}
                          onChange={(e) => patchSet(ex.key, i, { reps: e.target.value })}
                          placeholder="reps"
                          className="!py-1 text-sm"
                        />
                        <input
                          type="number"
                          value={s.rpe}
                          onChange={(e) => patchSet(ex.key, i, { rpe: e.target.value })}
                          placeholder="—"
                          className="!py-1 text-sm"
                        />
                        <button className="btn btn-ghost btn-sm !px-1" onClick={() => removeSet(ex.key, i)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => addSet(ex.key)}>
                      <Plus size={12} /> Set
                    </button>
                    <label className="flex items-center gap-1 text-[11px] text-text-3 ml-auto">
                      Rest
                      <input
                        type="number"
                        value={ex.rest_seconds}
                        onChange={(e) => patchExercise(ex.key, { rest_seconds: parseInt(e.target.value) || 0 })}
                        className="!py-0.5 !px-1.5 w-16 text-xs"
                      />
                      s
                    </label>
                    <button className="btn btn-ghost btn-sm !px-1.5" title="Start rest" onClick={() => startRest(ex.rest_seconds || 90)}>
                      <Timer size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn-ghost w-full border border-dashed border-border hover:border-accent/50"
            onClick={() => setPickerOpen(true)}
          >
            <Plus size={15} /> Add Exercise
          </button>

          <div>
            <label className="label">Session notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="How did it feel?" />
          </div>

          {/* photos */}
          <div>
            <label className="label">Progress photos</label>
            <div className="flex flex-wrap gap-2">
              {photoPaths.map((p) => (
                <div key={p} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                  {signedPhotos[p] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signedPhotos[p]} alt="Workout" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-bg-2 animate-pulse" />
                  )}
                  <button
                    type="button"
                    className="absolute top-0.5 right-0.5 bg-bg-1/80 rounded-full p-0.5 text-text-2 hover:text-status-red"
                    onClick={() => setPhotoPaths((ps) => ps.filter((x) => x !== p))}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {pendingPreviews.map((p, i) => (
                <div key={p.url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-accent/40 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="New" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-0.5 right-0.5 bg-bg-1/80 rounded-full p-0.5 text-text-2 hover:text-status-red"
                    onClick={() => setPendingFiles((fs) => fs.filter((_, j) => j !== i))}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border border-dashed border-border hover:border-accent/50 flex flex-col items-center justify-center text-text-3 hover:text-accent cursor-pointer transition-colors">
                <ImagePlus size={18} />
                <span className="text-[9px] mt-0.5">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) setPendingFiles((fs) => [...fs, ...files]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-text-2 cursor-pointer">
            <input type="checkbox" checked={alsoTemplate} onChange={(e) => setAlsoTemplate(e.target.checked)} className="!w-4 !h-4" />
            <Save size={13} /> Also save as a reusable program
          </label>

          <div className="flex gap-2 pt-1">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editSession ? "Update Session" : "Save Session"}
            </button>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </div>
      </Modal>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        catalog={catalog}
        favorites={favorites.map((f) => f.exercise_name)}
        onToggleFav={(n, on) => toggleFav.mutate({ exercise_name: n, on })}
        onPick={(ex) => {
          addExerciseFromCatalog(ex);
          toast.success(`Added ${ex.name}`);
        }}
      />

      <SubstituteModal
        target={swapTarget}
        catalog={catalog}
        onClose={() => setSwapKey(null)}
        onPick={(alt) => {
          if (swapKey) {
            swapExercise(swapKey, alt);
            toast.success(`Swapped to ${alt.name}`);
          }
          setSwapKey(null);
        }}
      />

      {timerOpen && (
        <RestTimer startSignal={restSignal} startSeconds={restSeconds} onClose={() => setTimerOpen(false)} />
      )}
    </>
  );
}

function SubstituteModal({
  target,
  catalog,
  onClose,
  onPick,
}: {
  target: BuilderExercise | null;
  catalog: ExerciseCatalogItem[];
  onClose: () => void;
  onPick: (ex: ExerciseCatalogItem) => void;
}) {
  const targetItem = useMemo(() => {
    if (!target) return null;
    if (target.exercise_catalog_id) {
      const byId = catalog.find((e) => e.id === target.exercise_catalog_id);
      if (byId) return byId;
    }
    return catalog.find((e) => e.name === target.exercise_name) || null;
  }, [target, catalog]);

  const suggestions = useMemo(
    () => (targetItem ? suggestSubstitutions(targetItem, catalog, 8) : []),
    [targetItem, catalog]
  );

  return (
    <Modal open={!!target} onClose={onClose} title="Swap Exercise" wide>
      {target && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-sm text-text-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: muscleColor(target.muscle_group) }} />
            <span>
              Alternatives for <span className="font-semibold text-text-1">{target.exercise_name}</span>
              <span className="text-text-3"> · {target.muscle_group}</span>
            </span>
          </div>

          {suggestions.length === 0 ? (
            <div className="text-center text-text-3 text-sm py-6 border border-dashed border-border rounded-xl">
              No close alternatives found in your library.
            </div>
          ) : (
            <div className="space-y-1 max-h-[52vh] overflow-y-auto">
              {suggestions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-2.5 bg-bg-2 hover:bg-bg-3 border border-border rounded-lg px-3 py-2 transition-all"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: muscleColor(ex.muscle_group) }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {ex.name}
                      {ex.is_compound && <span className="text-[9px] font-bold text-status-amber bg-status-amber/15 px-1 rounded">CMP</span>}
                    </div>
                    <div className="text-[10px] text-text-3">
                      {ex.muscle_group}
                      {ex.movement_pattern ? ` · ${ex.movement_pattern}` : ""}
                      {ex.equipment ? ` · ${ex.equipment}` : ""}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onPick(ex)}>
                    <Repeat size={13} /> Swap
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ExercisePicker({
  open,
  onClose,
  catalog,
  favorites,
  onToggleFav,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  catalog: ExerciseCatalogItem[];
  favorites: string[];
  onToggleFav: (name: string, on: boolean) => void;
  onPick: (ex: ExerciseCatalogItem) => void;
}) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<ExerciseCategory | "All">("All");
  const [muscle, setMuscle] = useState("All");
  const [favOnly, setFavOnly] = useState(false);

  const muscles = useMemo(
    () => ["All", ...Array.from(new Set(catalog.map((e) => e.muscle_group))).sort()],
    [catalog]
  );
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const filtered = useMemo(() => {
    return catalog
      .filter((e) => {
        if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (cat !== "All" && e.category !== cat) return false;
        if (muscle !== "All" && e.muscle_group !== muscle) return false;
        if (favOnly && !favSet.has(e.name)) return false;
        return true;
      })
      .sort((a, b) => {
        const fa = favSet.has(a.name) ? 0 : 1;
        const fb = favSet.has(b.name) ? 0 : 1;
        return fa - fb || a.name.localeCompare(b.name);
      });
  }, [catalog, search, cat, muscle, favOnly, favSet]);

  return (
    <Modal open={open} onClose={onClose} title="Add Exercise" wide>
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." className="!pl-9" autoFocus />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-lg border transition-all",
                cat === c ? "bg-accent text-white border-accent" : "bg-bg-2 text-text-2 border-border hover:border-border-2"
              )}
            >
              {c === "All" ? "All" : c.replace(" / Calisthenics", "").replace(" Machines", " Mach.")}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="!py-1.5 text-sm flex-1">
            {muscles.map((m) => (
              <option key={m} value={m}>{m === "All" ? "All muscles" : m}</option>
            ))}
          </select>
          <button
            onClick={() => setFavOnly((v) => !v)}
            className={cn(
              "btn btn-sm whitespace-nowrap",
              favOnly ? "btn-primary" : "btn-ghost"
            )}
          >
            <Star size={13} className={favOnly ? "fill-current" : ""} /> Favorites
          </button>
        </div>

        <div className="space-y-1 max-h-[44vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center text-text-3 text-sm py-6">No exercises match.</div>
          ) : (
            filtered.map((ex) => {
              const fav = favSet.has(ex.name);
              return (
                <div
                  key={ex.id}
                  className="flex items-center gap-2.5 bg-bg-2 hover:bg-bg-3 border border-border rounded-lg px-3 py-2 transition-all"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: muscleColor(ex.muscle_group) }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {ex.name}
                      {ex.is_compound && <span className="text-[9px] font-bold text-status-amber bg-status-amber/15 px-1 rounded">CMP</span>}
                    </div>
                    <div className="text-[10px] text-text-3">{ex.muscle_group} · {ex.equipment}</div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm !px-1.5"
                    onClick={() => onToggleFav(ex.name, !fav)}
                    title={fav ? "Unfavorite" : "Favorite"}
                  >
                    <Star size={14} className={fav ? "fill-status-amber text-status-amber" : "text-text-3"} />
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => onPick(ex)}>
                    <Plus size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  );
}
