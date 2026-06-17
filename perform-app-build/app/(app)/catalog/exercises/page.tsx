"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  useExercises,
  useAddExercise,
  useDeleteExercise,
} from "@/hooks/useTraining";
import { Plus, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";

const MUSCLES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Glutes",
  "Core",
  "Full Body",
  "Cardio",
];
const EQUIPMENT = [
  "Barbell",
  "Dumbbell",
  "Cable",
  "Machine",
  "Bodyweight",
  "Smith Machine",
  "EZ Bar",
  "Band",
];
const TYPES = ["Strength", "Hypertrophy", "Cardio", "Mobility"];

export default function ExerciseCatalogPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: exercises = [] } = useExercises(search);
  const deleteExercise = useDeleteExercise();

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Exercise Library"
        subtitle="Manage your exercise catalog"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Exercise
          </button>
        }
      />

      <div className="card">
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="!pl-9"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-text-3 border-b border-border">
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Muscle</th>
                <th className="text-left py-2 px-2">Equipment</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((e) => (
                <tr key={e.id} className="border-b border-border/40 hover:bg-bg-2">
                  <td className="py-2.5 px-2 font-medium">{e.name}</td>
                  <td className="py-2.5 px-2">
                    <Badge variant="teal">{e.muscle_group}</Badge>
                  </td>
                  <td className="py-2.5 px-2 text-text-2">{e.equipment}</td>
                  <td className="py-2.5 px-2 text-text-2">{e.exercise_type}</td>
                  <td className="py-2.5 px-2">
                    {!e.is_global && (
                      <button
                        className="btn btn-ghost btn-sm !px-1.5"
                        onClick={() => {
                          deleteExercise.mutate(e.id);
                          toast.success("Removed");
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddExerciseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function AddExerciseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addExercise = useAddExercise();
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("Chest");
  const [equip, setEquip] = useState("Barbell");
  const [type, setType] = useState("Strength");

  function handleSave() {
    if (!name) {
      toast.error("Enter a name");
      return;
    }
    addExercise.mutate(
      {
        name,
        muscle_group: muscle,
        equipment: equip,
        exercise_type: type,
      },
      {
        onSuccess: () => {
          toast.success("Exercise added");
          setName("");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Exercise">
      <div className="space-y-3">
        <div>
          <label className="label">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Barbell Bench Press"
          />
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Muscle group</label>
            <select value={muscle} onChange={(e) => setMuscle(e.target.value)}>
              {MUSCLES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Equipment</label>
            <select value={equip} onChange={(e) => setEquip(e.target.value)}>
              {EQUIPMENT.map((eq) => (
                <option key={eq}>{eq}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn btn-primary" onClick={handleSave}>
            Add
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
