"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { MacroRing } from "@/components/nutrition/MacroBar";
import {
  useProfile,
  useFoodLog,
  useFoodCatalog,
  useAddFoodLog,
  useDeleteFoodLog,
} from "@/hooks/useNutrition";
import { FoodCatalogItem, MealType } from "@/types/database";
import { todayISO, formatDate, computeMacros } from "@/lib/utils";
import { Plus, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";

const MEALS: MealType[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Pre-workout",
  "Post-workout",
];

export default function NutritionPage() {
  const [date, setDate] = useState(todayISO());
  const [modalOpen, setModalOpen] = useState(false);
  const { data: profile } = useProfile();
  const { data: log = [] } = useFoodLog(date);
  const addLog = useAddFoodLog();
  const deleteLog = useDeleteFoodLog();

  const totals = log.reduce(
    (acc, e) => ({
      cal: acc.cal + Number(e.calories),
      p: acc.p + Number(e.protein),
      c: acc.c + Number(e.carbs),
      f: acc.f + Number(e.fat),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  function changeDate(delta: number) {
    const d = new Date(date + "T00:00");
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  }

  const rings = [
    {
      label: "Calories",
      value: totals.cal,
      target: profile?.target_calories || 2500,
      unit: "kcal",
      color: "#7c6af7",
    },
    {
      label: "Protein",
      value: totals.p,
      target: profile?.target_protein || 200,
      unit: "g",
      color: "#2dd4bf",
    },
    {
      label: "Carbs",
      value: totals.c,
      target: profile?.target_carbs || 250,
      unit: "g",
      color: "#fbbf24",
    },
    {
      label: "Fat",
      value: totals.f,
      target: profile?.target_fat || 80,
      unit: "g",
      color: "#fb7185",
    },
  ];

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Nutrition"
        subtitle="Log and track your daily intake"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Log Food
          </button>
        }
      />

      {/* Macro rings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {rings.map((r) => (
          <MacroRing key={r.label} {...r} />
        ))}
      </div>

      {/* Daily log */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <div className="card-title mb-0">Food Log</div>
          <div className="flex gap-2 items-center">
            <button className="btn btn-ghost btn-sm" onClick={() => changeDate(-1)}>
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm text-text-2 min-w-[130px] text-center">
              {new Date(date + "T00:00").toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => changeDate(1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {log.length === 0 ? (
          <div className="text-text-3 text-sm text-center py-6">
            No food logged for {formatDate(date)}. Hit &quot;Log Food&quot; to
            get started.
          </div>
        ) : (
          <div className="space-y-3">
            {MEALS.map((meal) => {
              const mealLog = log.filter((e) => e.meal === meal);
              if (mealLog.length === 0) return null;
              return (
                <div key={meal}>
                  <div className="text-[11px] uppercase tracking-wider text-text-3 mb-1.5">
                    {meal}
                  </div>
                  <div className="space-y-1.5">
                    {mealLog.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2.5 border border-border"
                      >
                        <div>
                          <div className="text-sm">
                            {e.name}{" "}
                            {e.quantity && (
                              <span className="text-text-3">
                                {e.quantity}
                                {e.quantity_unit}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-2">
                            {Math.round(e.protein)}g P · {Math.round(e.carbs)}g C
                            · {Math.round(e.fat)}g F
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-accent">
                            {Math.round(e.calories)}
                          </span>
                          <span className="text-[11px] text-text-3">kcal</span>
                          <button
                            className="btn btn-ghost btn-sm !px-1.5"
                            onClick={() => {
                              deleteLog.mutate(e.id);
                              toast.success("Removed");
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <LogFoodModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={date}
        onLog={(entry) => {
          addLog.mutate(entry, {
            onSuccess: () => {
              toast.success("Food logged");
              setModalOpen(false);
            },
            onError: (e) => toast.error(e.message),
          });
        }}
      />
    </div>
  );
}

// ─── LOG FOOD MODAL ───────────────────────────────────────────────────────────
function LogFoodModal({
  open,
  onClose,
  date,
  onLog,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  onLog: (entry: Record<string, unknown>) => void;
}) {
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FoodCatalogItem | null>(null);
  const [qty, setQty] = useState("100");
  const [unit, setUnit] = useState("g");
  const [meal, setMeal] = useState<MealType>("Breakfast");

  // Manual fields
  const [mName, setMName] = useState("");
  const [mCal, setMCal] = useState("");
  const [mP, setMP] = useState("");
  const [mC, setMC] = useState("");
  const [mF, setMF] = useState("");

  const { data: catalog = [] } = useFoodCatalog(search.length >= 2 ? search : "");

  const matches = useMemo(() => {
    if (search.length < 2) return [];
    return catalog.slice(0, 8);
  }, [catalog, search]);

  const preview = useMemo(() => {
    if (!selected) return null;
    return computeMacros(
      {
        calories: selected.calories_per_100g,
        protein: selected.protein_per_100g,
        carbs: selected.carbs_per_100g,
        fat: selected.fat_per_100g,
      },
      parseFloat(qty) || 0,
      unit
    );
  }, [selected, qty, unit]);

  function handleLog() {
    if (tab === "manual") {
      onLog({
        name: mName || "Custom Food",
        meal,
        logged_date: date,
        quantity: 1,
        quantity_unit: "serving",
        calories: parseFloat(mCal) || 0,
        protein: parseFloat(mP) || 0,
        carbs: parseFloat(mC) || 0,
        fat: parseFloat(mF) || 0,
      });
    } else {
      if (!selected || !preview) {
        toast.error("Select a food first");
        return;
      }
      onLog({
        name: selected.name,
        food_catalog_id: selected.id,
        meal,
        logged_date: date,
        quantity: parseFloat(qty) || 100,
        quantity_unit: unit,
        ...preview,
      });
    }
    // Reset
    setSelected(null);
    setSearch("");
    setMName("");
    setMCal("");
    setMP("");
    setMC("");
    setMF("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Food Entry">
      {/* Tabs */}
      <div className="flex gap-1 bg-bg-2 p-1 rounded-lg w-fit mb-4">
        <button
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium ${
            tab === "search" ? "bg-accent text-white" : "text-text-2"
          }`}
          onClick={() => setTab("search")}
        >
          Search Food
        </button>
        <button
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium ${
            tab === "manual" ? "bg-accent text-white" : "text-text-2"
          }`}
          onClick={() => setTab("manual")}
        >
          Manual Entry
        </button>
      </div>

      {tab === "search" ? (
        <div className="space-y-3">
          <div className="relative">
            <label className="label">Search food catalog</label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelected(null);
                }}
                placeholder="e.g. chicken breast, oats..."
                className="!pl-9"
              />
            </div>
            {matches.length > 0 && !selected && (
              <div className="absolute z-10 bg-bg-2 border border-border-2 rounded-lg w-full max-h-52 overflow-y-auto mt-1">
                {matches.map((f) => (
                  <div
                    key={f.id}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-bg-3 text-text-2 hover:text-text-1"
                    onClick={() => {
                      setSelected(f);
                      setSearch(f.name);
                    }}
                  >
                    {f.name}{" "}
                    <span className="text-text-3">
                      {f.calories_per_100g} kcal/100g
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <>
              <div className="card-sm">
                <span className="text-sm font-medium">{selected.name}</span>{" "}
                <Badge variant="teal">{selected.category}</Badge>
                <div className="text-[11px] text-text-2 mt-1">
                  Per 100g: {selected.calories_per_100g} kcal ·{" "}
                  {selected.protein_per_100g}g P · {selected.carbs_per_100g}g C ·{" "}
                  {selected.fat_per_100g}g F
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <label className="label">Quantity</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="label">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option>g</option>
                    <option>oz</option>
                    <option>serving</option>
                    <option>cup</option>
                  </select>
                </div>
              </div>
              {preview && (
                <div className="card-sm text-xs text-text-2">
                  For {qty}
                  {unit}:{" "}
                  <b className="text-accent">
                    {Math.round(preview.calories)} kcal
                  </b>{" "}
                  · {Math.round(preview.protein)}g P ·{" "}
                  {Math.round(preview.carbs)}g C · {Math.round(preview.fat)}g F
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="label">Food name</label>
            <input
              value={mName}
              onChange={(e) => setMName(e.target.value)}
              placeholder="Custom food name"
            />
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="label">Calories</label>
              <input
                type="number"
                value={mCal}
                onChange={(e) => setMCal(e.target.value)}
                placeholder="kcal"
              />
            </div>
            <div className="flex-1">
              <label className="label">Protein (g)</label>
              <input
                type="number"
                value={mP}
                onChange={(e) => setMP(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="label">Carbs (g)</label>
              <input
                type="number"
                value={mC}
                onChange={(e) => setMC(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="label">Fat (g)</label>
              <input
                type="number"
                value={mF}
                onChange={(e) => setMF(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2.5 mt-4">
        <div className="flex-1">
          <label className="label">Meal</label>
          <select
            value={meal}
            onChange={(e) => setMeal(e.target.value as MealType)}
          >
            {MEALS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="btn btn-primary" onClick={handleLog}>
          Log Food
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
