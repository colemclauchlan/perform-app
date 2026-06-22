"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useExercises, useSaveTemplate } from "@/hooks/useTraining";
import { ExerciseCatalogItem, WorkoutTemplate, TemplateExercise, SetType } from "@/types/database";
import { muscleColor } from "@/lib/utils";
import { Plus, Trash2, ChevronUp, ChevronDown, Search, Dumbbell, X } from "lucide-react";
import toast from "react-hot-toast";

const SET_TYPES: SetType[] = ["Warmup", "Working", "Failure", "Backoff", "Dropset"];
const uid = () => Math.random().toString(36).slice(2, 10);

type EditSet = { reps: string; weight: string; set_type: SetType };
type EditEx = {
  key: string;
  exercise_name: string;
  muscle_group: string;
  category: string;
  superset_group: string | null;
  sets: EditSet[];
};

/**
 * Edit a saved workout program: rename it, add/remove/reorder exercises, and
 * tweak each exercise's sets (target reps + optional weight). Saves back onto
 * the same program.
 */
export function TemplateEditorModal({
  template,
  open,
  onClose,
}: {
  template: WorkoutTemplate | null;
  open: boolean;
  onClose: () => void;
}) {
  const save = useSaveTemplate();
  const [name, setName] = useState("");
  const [items, setItems] = useState<EditEx[]>([]);
  const [pickerQ, setPickerQ] = useState("");
  const [initId, setInitId] = useState<string | null>(null);
  const { data: results = [] } = useExercises(pickerQ.length >= 2 ? pickerQ : "");

  // Initialize from the program whenever a new one is opened.
  const sig = open ? template?.id ?? "none" : "closed";
  if (sig !== initId) {
    setInitId(sig);
    setName(template?.name ?? "");
    setItems(
      (template?.data ?? []).map((te) => ({
        key: uid(),
        exercise_name: te.exercise_name,
        muscle_group: te.muscle_group ?? "",
        category: te.category ?? "",
        superset_group: te.superset_group ?? null,
        sets: (te.sets ?? []).map((s) => ({
          reps: s.reps ?? "",
          weight: s.weight == null ? "" : String(s.weight),
          set_type: s.set_type ?? "Working",
        })),
      }))
    );
    setPickerQ("");
  }

  function addExercise(ex: ExerciseCatalogItem) {
    setItems((xs) => [
      ...xs,
      {
        key: uid(),
        exercise_name: ex.name,
        muscle_group: ex.muscle_group || "",
        category: ex.category || "",
        superset_group: null,
        sets: [
          { reps: "10", weight: "", set_type: "Working" },
          { reps: "10", weight: "", set_type: "Working" },
          { reps: "10", weight: "", set_type: "Working" },
        ],
      },
    ]);
    setPickerQ("");
  }
  const patchEx = (key: string, p: Partial<EditEx>) =>
    setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const removeEx = (key: string) => setItems((xs) => xs.filter((x) => x.key !== key));
  function moveEx(key: string, dir: -1 | 1) {
    setItems((xs) => {
      const i = xs.findIndex((x) => x.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function patchSet(key: string, idx: number, p: Partial<EditSet>) {
    setItems((xs) =>
      xs.map((x) => (x.key === key ? { ...x, sets: x.sets.map((s, i) => (i === idx ? { ...s, ...p } : s)) } : x))
    );
  }
  const addSet = (key: string) =>
    setItems((xs) =>
      xs.map((x) =>
        x.key === key
          ? { ...x, sets: [...x.sets, x.sets[x.sets.length - 1] ?? { reps: "10", weight: "", set_type: "Working" }] }
          : x
      )
    );
  const removeSet = (key: string, idx: number) =>
    setItems((xs) => xs.map((x) => (x.key === key ? { ...x, sets: x.sets.filter((_, i) => i !== idx) } : x)));

  function handleSave() {
    if (!name.trim()) return toast.error("Name your program");
    if (items.length === 0) return toast.error("Add at least one exercise");
    const data: TemplateExercise[] = items.map((it) => ({
      exercise_name: it.exercise_name,
      category: it.category || undefined,
      muscle_group: it.muscle_group || undefined,
      superset_group: it.superset_group,
      sets: it.sets.map((s) => ({
        weight: s.weight === "" ? null : Number(s.weight),
        reps: s.reps,
        set_type: s.set_type,
      })),
    }));
    save.mutate(
      { id: template?.id, name: name.trim(), data },
      {
        onSuccess: () => {
          toast.success(template ? "Program updated" : "Program saved");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  const totalSets = items.reduce((a, x) => a + x.sets.length, 0);

  return (
    <Modal open={open} onClose={onClose} title={template ? "Edit Program" : "New Program"} wide>
      <div className="space-y-3">
        <div>
          <label className="label">Program name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push Day A" />
        </div>

        <div className="flex items-center gap-3 text-xs bg-bg-2 rounded-lg px-3 py-2 border border-border">
          <span className="text-text-2">
            <b className="text-text-1">{items.length}</b> exercises
          </span>
          <span className="text-text-3">·</span>
          <span className="text-text-2">
            <b className="text-text-1">{totalSets}</b> sets
          </span>
        </div>

        {/* Exercise list */}
        <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-0.5">
          {items.length === 0 && (
            <div className="text-center text-sm text-text-3 py-6 border border-dashed border-border rounded-xl">
              No exercises yet — add one below.
            </div>
          )}
          {items.map((it, i) => (
            <div key={it.key} className="card-sm !p-2.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-7 rounded-full shrink-0" style={{ background: muscleColor(it.muscle_group) }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{it.exercise_name}</div>
                  <div className="text-[10px] text-text-3 truncate">{it.muscle_group || "—"}</div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button className="btn btn-ghost btn-sm !px-1" disabled={i === 0} onClick={() => moveEx(it.key, -1)} title="Move up">
                    <ChevronUp size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm !px-1" disabled={i === items.length - 1} onClick={() => moveEx(it.key, 1)} title="Move down">
                    <ChevronDown size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => removeEx(it.key)} title="Remove exercise">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {it.sets.map((s, si) => (
                  <div key={si} className="flex items-center gap-1.5">
                    <span className="text-[11px] text-text-3 w-4 text-center tabular-nums shrink-0">{si + 1}</span>
                    <select
                      value={s.set_type}
                      onChange={(e) => patchSet(it.key, si, { set_type: e.target.value as SetType })}
                      className="!py-1 !text-[11px] w-24"
                      title="Set type"
                    >
                      {SET_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      value={s.reps}
                      onChange={(e) => patchSet(it.key, si, { reps: e.target.value })}
                      placeholder="reps"
                      className="!py-1 !text-[12px] w-16 text-center"
                    />
                    <span className="text-text-3 text-[11px]">×</span>
                    <input
                      value={s.weight}
                      onChange={(e) => patchSet(it.key, si, { weight: e.target.value })}
                      placeholder="wt"
                      inputMode="decimal"
                      className="!py-1 !text-[12px] w-16 text-center"
                    />
                    <button className="btn btn-ghost btn-sm !px-1 ml-auto shrink-0" onClick={() => removeSet(it.key, si)} title="Remove set">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button className="text-[11px] text-accent hover:underline mt-0.5" onClick={() => addSet(it.key)}>
                  + Add set
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add exercise */}
        <div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              value={pickerQ}
              onChange={(e) => setPickerQ(e.target.value)}
              placeholder="Add exercise — search the catalog…"
              className="!pl-9"
            />
          </div>
          {pickerQ.length >= 2 && (
            <div className="mt-1.5 rounded-xl border border-border bg-bg-2/50 divide-y divide-border/50 max-h-44 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-3 py-3 text-sm text-text-3 text-center">No matches.</div>
              ) : (
                results.slice(0, 12).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-2 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: muscleColor(ex.muscle_group) }} />
                    <span className="text-sm flex-1 min-w-0 truncate">{ex.name}</span>
                    <span className="text-[10px] text-text-3 shrink-0">{ex.muscle_group}</span>
                    <Plus size={13} className="text-accent shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button className="btn btn-primary flex-1 group justify-center" onClick={handleSave} disabled={save.isPending}>
            <span className="shine-overlay" />
            <Dumbbell size={15} /> {save.isPending ? "Saving…" : "Save Program"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
