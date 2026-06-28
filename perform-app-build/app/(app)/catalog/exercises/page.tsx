"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import {
  useExercises,
  useAddExercise,
  useDeleteExercise,
  useLiftProgression,
  useFavorites,
  useToggleFavorite,
} from "@/hooks/useTraining";
import { ExerciseDetailModal } from "@/components/training/ExerciseDetailModal";
import { ExerciseCatalogItem, ExerciseCategory } from "@/types/database";
import { muscleColor, cn } from "@/lib/utils";
import { Plus, Trash2, Search, Star, Trophy, Info } from "lucide-react";
import toast from "react-hot-toast";

const MUSCLES = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Forearms", "Legs", "Glutes", "Calves", "Core", "Full Body", "Cardio"];
const EQUIPMENT = ["Barbell", "Dumbbell", "Kettlebell", "Cable Machine", "Plate Loaded Machine", "Selectorized Machine", "Smith Machine", "Bodyweight", "Cardio Machine", "Band", "EZ Bar"];
const TYPES = ["Strength", "Hypertrophy", "Cardio", "Mobility"];
const CATEGORIES: (ExerciseCategory | "All")[] = [
  "All",
  "Free Weights",
  "Cable Machines",
  "Plate Loaded Machines",
  "Selectorized Machines",
  "Bodyweight / Calisthenics",
  "Cardio",
];

export default function ExerciseCatalogPage() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<ExerciseCategory | "All">("All");
  const [muscle, setMuscle] = useState("All");
  const [favOnly, setFavOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<ExerciseCatalogItem | null>(null);

  const { data: exercises = [] } = useExercises();
  const { data: progression = [] } = useLiftProgression();
  const { data: favorites = [] } = useFavorites();
  const deleteExercise = useDeleteExercise();
  const toggleFav = useToggleFavorite();

  const progByName = useMemo(() => {
    const m = new Map<string, (typeof progression)[number]>();
    progression.forEach((p) => m.set(p.name, p));
    return m;
  }, [progression]);
  const favSet = useMemo(() => new Set(favorites.map((f) => f.exercise_name)), [favorites]);

  const muscles = useMemo(
    () => ["All", ...Array.from(new Set(exercises.map((e) => e.muscle_group))).sort()],
    [exercises]
  );

  const filtered = useMemo(() => {
    return exercises
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
  }, [exercises, search, cat, muscle, favOnly, favSet]);

  return (
    <div className="p-6 max-w-[1200px]">
      <PageHeader
        eyebrow="LIBRARY · EXERCISES"
        title="Exercise Catalog"
        subtitle={`${exercises.length} exercises · tap any row for form cues, tips, and your PRs`}
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Exercise
          </button>
        }
      />

      <div className="card">
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." className="!pl-9" />
          </div>
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="!py-2 text-sm w-40">
            {muscles.map((m) => (
              <option key={m} value={m}>{m === "All" ? "All muscles" : m}</option>
            ))}
          </select>
          <button onClick={() => setFavOnly((v) => !v)} className={cn("btn btn-sm", favOnly ? "btn-primary" : "btn-ghost")}>
            <Star size={13} className={favOnly ? "fill-current" : ""} /> Favorites
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-lg border transition-all",
                cat === c ? "bg-accent text-white border-accent" : "bg-bg-2 text-text-2 border-border hover:border-border-2"
              )}
            >
              {c === "All" ? "All" : c.replace(" / Calisthenics", "")}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-text-3 border-b border-border">
                <th className="text-left py-2 px-2 w-8"></th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Muscle</th>
                <th className="text-left py-2 px-2 hidden sm:table-cell">Equipment</th>
                <th className="text-right py-2 px-2">PR (e1RM)</th>
                <th className="py-2 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const fav = favSet.has(e.name);
                const pr = progByName.get(e.name);
                return (
                  <tr
                    key={e.id}
                    className="border-b border-border/40 hover:bg-bg-2 cursor-pointer group"
                    onClick={() => setDetail(e)}
                  >
                    <td className="py-2.5 px-2">
                      <button
                        onClick={(ev) => { ev.stopPropagation(); toggleFav.mutate({ exercise_name: e.name, on: !fav }); }}
                        title={fav ? "Unfavorite" : "Favorite"}
                      >
                        <Star size={15} className={fav ? "fill-status-amber text-status-amber" : "text-text-3 hover:text-text-2"} />
                      </button>
                    </td>
                    <td className="py-2.5 px-2 font-medium">
                      <span className="flex items-center gap-1.5">
                        {e.name}
                        {e.is_compound && <span className="text-[9px] font-bold text-status-amber bg-status-amber/15 px-1 rounded">CMP</span>}
                        <Info size={12} className="text-text-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-flex items-center gap-1.5 text-text-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: muscleColor(e.muscle_group) }} />
                        {e.muscle_group}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-text-2 hidden sm:table-cell">{e.equipment}</td>
                    <td className="py-2.5 px-2 text-right">
                      {pr ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-accent">
                          <Trophy size={12} className="text-status-amber" />
                          {pr.e1rmPR} {pr.unit}
                        </span>
                      ) : (
                        <span className="text-text-3">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      {!e.is_global && (
                        <button
                          className="btn btn-ghost btn-sm !px-1.5"
                          onClick={(ev) => { ev.stopPropagation(); deleteExercise.mutate(e.id); toast.success("Removed"); }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-text-3 text-sm py-8">No exercises match your filters.</div>
          )}
        </div>
      </div>

      <AddExerciseModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ExerciseDetailModal
        open={!!detail}
        onClose={() => setDetail(null)}
        exercise={detail}
        progression={detail ? progByName.get(detail.name) : undefined}
      />
    </div>
  );
}

function AddExerciseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addExercise = useAddExercise();
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("Chest");
  const [equip, setEquip] = useState("Barbell");
  const [type, setType] = useState("Strength");
  const [cat, setCat] = useState<ExerciseCategory>("Free Weights");
  const [isCompound, setIsCompound] = useState(false);

  function handleSave() {
    if (!name) return toast.error("Enter a name");
    addExercise.mutate(
      {
        name,
        muscle_group: muscle,
        equipment: equip,
        exercise_type: type,
        category: cat,
        is_compound: isCompound,
      },
      {
        onSuccess: () => { toast.success("Exercise added"); setName(""); onClose(); },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Exercise">
      <div className="space-y-3">
        <div>
          <label className="label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Barbell Bench Press" />
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Muscle group</label>
            <select value={muscle} onChange={(e) => setMuscle(e.target.value)}>
              {MUSCLES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Equipment</label>
            <select value={equip} onChange={(e) => setEquip(e.target.value)}>
              {EQUIPMENT.map((eq) => <option key={eq}>{eq}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Category</label>
            <select value={cat} onChange={(e) => setCat(e.target.value as ExerciseCategory)}>
              {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-2 cursor-pointer">
          <input type="checkbox" checked={isCompound} onChange={(e) => setIsCompound(e.target.checked)} className="!w-4 !h-4" />
          Compound (multi-joint) movement
        </label>
        <div className="flex gap-2 pt-1">
          <button className="btn btn-primary" onClick={handleSave}>Add</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
