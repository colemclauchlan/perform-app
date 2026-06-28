"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import {
  useFoodCatalog,
  useAddFood,
  useDeleteFood,
  useProfile,
} from "@/hooks/useNutrition";
import { foodCategoryColor } from "@/lib/utils";
import { Plus, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";

// Small colored pill for a food category. Colors come from the shared
// foodCategoryColor map (with custom user categories merged in).
function CategoryTag({
  category,
  custom,
}: {
  category: string | null | undefined;
  custom?: { name: string; color: string }[];
}) {
  const color = foodCategoryColor(category, custom);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {category || "Other"}
    </span>
  );
}

const CATEGORIES = [
  "Protein",
  "Carb",
  "Fat",
  "Dairy",
  "Vegetable",
  "Fruit",
  "Supplement",
  "Other",
];

export default function FoodCatalogPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: foods = [] } = useFoodCatalog(search);
  const { data: profile } = useProfile();
  const customCategories = profile?.preferences?.custom_food_categories ?? [];
  const deleteFood = useDeleteFood();

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        eyebrow="LIBRARY · FOOD"
        title="Food Catalog"
        subtitle="Search, add and manage foods"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Food
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
            placeholder="Search catalog..."
            className="!pl-9"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-text-3 border-b border-border">
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Category</th>
                <th className="text-left py-2 px-2">Cal/100g</th>
                <th className="text-left py-2 px-2">P</th>
                <th className="text-left py-2 px-2">C</th>
                <th className="text-left py-2 px-2">F</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {foods.map((f) => (
                <tr key={f.id} className="border-b border-border/40 hover:bg-bg-2">
                  <td className="py-2.5 px-2 font-medium">{f.name}</td>
                  <td className="py-2.5 px-2">
                    <CategoryTag category={f.category} custom={customCategories} />
                  </td>
                  <td className="py-2.5 px-2 text-text-2">
                    {f.calories_per_100g}
                  </td>
                  <td className="py-2.5 px-2 text-text-2">
                    {f.protein_per_100g}g
                  </td>
                  <td className="py-2.5 px-2 text-text-2">{f.carbs_per_100g}g</td>
                  <td className="py-2.5 px-2 text-text-2">{f.fat_per_100g}g</td>
                  <td className="py-2.5 px-2">
                    {!f.is_global && (
                      <button
                        className="btn btn-ghost btn-sm !px-1.5"
                        onClick={() => {
                          deleteFood.mutate(f.id);
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

      <AddFoodModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function AddFoodModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addFood = useAddFood();
  const [name, setName] = useState("");
  const [cat, setCat] = useState("Protein");
  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");

  function handleSave() {
    if (!name) {
      toast.error("Enter a food name");
      return;
    }
    addFood.mutate(
      {
        name,
        category: cat,
        calories_per_100g: parseFloat(cal) || 0,
        protein_per_100g: parseFloat(p) || 0,
        carbs_per_100g: parseFloat(c) || 0,
        fat_per_100g: parseFloat(f) || 0,
      },
      {
        onSuccess: () => {
          toast.success("Food added");
          setName("");
          setCal("");
          setP("");
          setC("");
          setF("");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Custom Food">
      <div className="space-y-3">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Breast (cooked)"
            />
          </div>
          <div className="w-36">
            <label className="label">Category</label>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIES.map((cc) => (
                <option key={cc}>{cc}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-title pt-1">Per 100g</div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Calories</label>
            <input
              type="number"
              value={cal}
              onChange={(e) => setCal(e.target.value)}
              placeholder="kcal"
            />
          </div>
          <div className="flex-1">
            <label className="label">Protein (g)</label>
            <input
              type="number"
              value={p}
              onChange={(e) => setP(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Carbs (g)</label>
            <input
              type="number"
              value={c}
              onChange={(e) => setC(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="label">Fat (g)</label>
            <input
              type="number"
              value={f}
              onChange={(e) => setF(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn btn-primary" onClick={handleSave}>
            Add to Catalog
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
