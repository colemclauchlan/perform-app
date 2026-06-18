"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { MacroRing } from "@/components/nutrition/MacroBar";
import { WeeklyMacroGoals } from "@/components/nutrition/WeeklyMacroGoals";
import {
  useProfile,
  useUpdateProfile,
  useFoodLog,
  useFoodCatalog,
  useAddFood,
  useAddFoodLog,
  useUpdateFoodLog,
  useDeleteFoodLog,
  useWeeklyMacros,
} from "@/hooks/useNutrition";
import { FoodCatalogItem, FoodLogEntry, MealType } from "@/types/database";
import {
  todayISO,
  localISO,
  formatDate,
  computeMacros,
  round,
  foodCategoryColor,
  FOOD_CATEGORY_COLORS,
  cn,
} from "@/lib/utils";
import { Plus, Trash2, ChevronLeft, ChevronRight, Search, Minus } from "lucide-react";
import toast from "react-hot-toast";

// Small colored dot used to tag a food category throughout the page.
function CategoryDot({ category, custom }: { category?: string | null; custom?: { name: string; color: string }[] }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ background: foodCategoryColor(category, custom) }}
      title={category || "Uncategorized"}
    />
  );
}

function portionStep(unit: string): number {
  const u = (unit || "").toLowerCase();
  if (u === "g") return 10;
  if (u === "oz") return 1;
  if (u === "cup" || u === "serving") return 0.5;
  return 1;
}

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
  const { data: weekly = [] } = useWeeklyMacros();
  const { data: fullCatalog = [] } = useFoodCatalog("");
  const addLog = useAddFoodLog();
  const updateLog = useUpdateFoodLog();
  const deleteLog = useDeleteFoodLog();
  const updateProfile = useUpdateProfile();

  const calGoal = profile?.target_calories || 2500;
  const proteinGoal = profile?.target_protein || 200;
  const customCategories = profile?.preferences?.custom_food_categories ?? [];

  // Map catalog id → category so logged foods can be color-tagged.
  const categoryById = useMemo(() => {
    const m = new Map<string, string>();
    fullCatalog.forEach((f) => m.set(f.id, f.category));
    return m;
  }, [fullCatalog]);

  function adjustPortion(e: FoodLogEntry, dir: 1 | -1) {
    const step = portionStep(e.quantity_unit);
    const newQty = round(Math.max(step, Number(e.quantity) + dir * step));
    if (newQty === Number(e.quantity)) return;
    const factor = newQty / Number(e.quantity);
    updateLog.mutate({
      id: e.id,
      updates: {
        quantity: newQty,
        calories: round(Number(e.calories) * factor),
        protein: round(Number(e.protein) * factor),
        carbs: round(Number(e.carbs) * factor),
        fat: round(Number(e.fat) * factor),
      },
    });
  }

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
    setDate(localISO(d));
  }

  const rings = [
    {
      label: "Calories",
      value: totals.cal,
      target: profile?.target_calories || 2500,
      unit: "kcal",
      color: "#2563eb",
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

      {/* Weekly macro goal graph */}
      <WeeklyMacroGoals data={weekly} calGoal={calGoal} proteinGoal={proteinGoal} />

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
              const mealCal = mealLog.reduce((a, e) => a + Number(e.calories), 0);
              const mealP = mealLog.reduce((a, e) => a + Number(e.protein), 0);
              const calPct = calGoal > 0 ? Math.round((mealCal / calGoal) * 100) : 0;
              const pPct = proteinGoal > 0 ? Math.round((mealP / proteinGoal) * 100) : 0;
              // color the share of daily goal: bigger share = warmer
              const shareTone =
                calPct >= 40 ? "bg-status-red/15 text-status-red"
                  : calPct >= 25 ? "bg-status-amber/15 text-status-amber"
                  : "bg-status-green/15 text-status-green";
              return (
                <div key={meal}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[11px] uppercase tracking-wider text-text-3">{meal}</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${shareTone}`}>
                        {calPct}% kcal
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-accent-dim text-accent">
                        {pPct}% protein
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {mealLog.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2.5 border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <CategoryDot
                            category={e.food_catalog_id ? categoryById.get(e.food_catalog_id) : "Custom"}
                            custom={customCategories}
                          />
                          <div>
                            <div className="text-sm">{e.name}</div>
                            <div className="text-[11px] text-text-2">
                              {Math.round(e.protein)}g P · {Math.round(e.carbs)}g C
                              · {Math.round(e.fat)}g F
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-bg-3 rounded-lg border border-border px-1">
                            <button
                              className="p-1 text-text-3 hover:text-text-1 disabled:opacity-30"
                              title="Decrease portion"
                              disabled={updateLog.isPending}
                              onClick={() => adjustPortion(e, -1)}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-[11px] text-text-2 min-w-[52px] text-center tabular-nums">
                              {e.quantity}
                              {e.quantity_unit}
                            </span>
                            <button
                              className="p-1 text-text-3 hover:text-text-1 disabled:opacity-30"
                              title="Increase portion"
                              disabled={updateLog.isPending}
                              onClick={() => adjustPortion(e, 1)}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
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
        customCategories={customCategories}
        onSaveCategory={(name, color) =>
          updateProfile.mutate({
            preferences: {
              ...(profile?.preferences ?? {}),
              custom_food_categories: [...customCategories, { name, color }],
            },
          })
        }
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
  customCategories,
  onSaveCategory,
  onLog,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  customCategories: { name: string; color: string }[];
  onSaveCategory: (name: string, color: string) => void;
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
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [mCategory, setMCategory] = useState("Custom");
  const [newCatMode, setNewCatMode] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#a78bfa");

  const addFood = useAddFood();
  const { data: catalog = [] } = useFoodCatalog(search.length >= 2 ? search : "");

  // All selectable categories: built-ins + the user's custom ones.
  const allCategories = useMemo(() => {
    const names = new Set<string>(Object.keys(FOOD_CATEGORY_COLORS));
    customCategories.forEach((c) => names.add(c.name));
    return Array.from(names);
  }, [customCategories]);

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
      const cal = parseFloat(mCal) || 0;
      const p = parseFloat(mP) || 0;
      const c = parseFloat(mC) || 0;
      const f = parseFloat(mF) || 0;
      // Don't log an empty placeholder entry — require a name or some macros.
      if (!mName.trim() && cal <= 0 && p <= 0 && c <= 0 && f <= 0) {
        toast.error("Enter a food name or its calories");
        return;
      }
      // Resolve the chosen category (a brand-new custom one if entered).
      const category =
        newCatMode && newCatName.trim() ? newCatName.trim() : mCategory;

      // Persist a brand-new custom category (name + color) to the profile so it
      // is color-coded everywhere going forward.
      if (
        newCatMode &&
        newCatName.trim() &&
        !FOOD_CATEGORY_COLORS[newCatName.trim()] &&
        !customCategories.some(
          (x) => x.name.toLowerCase() === newCatName.trim().toLowerCase()
        )
      ) {
        onSaveCategory(newCatName.trim(), newCatColor);
      }

      // Optionally remember this custom food for future logging. The entered
      // macros are stored as the per-serving (≈per-100g) basis.
      if (saveToLibrary && mName.trim()) {
        addFood.mutate(
          {
            name: mName.trim(),
            category,
            calories_per_100g: cal,
            protein_per_100g: p,
            carbs_per_100g: c,
            fat_per_100g: f,
            is_global: false,
          },
          {
            onSuccess: () => toast.success("Saved to your food library"),
            onError: (e) => toast.error(e.message),
          }
        );
      }
      onLog({
        name: mName || "Custom Food",
        meal,
        logged_date: date,
        quantity: 1,
        quantity_unit: "serving",
        calories: cal,
        protein: p,
        carbs: c,
        fat: f,
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
    setSaveToLibrary(false);
    setMCategory("Custom");
    setNewCatMode(false);
    setNewCatName("");
    setNewCatColor("#a78bfa");
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
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-bg-3 text-text-2 hover:text-text-1 flex items-center gap-2"
                    onClick={() => {
                      setSelected(f);
                      setSearch(f.name);
                    }}
                  >
                    <CategoryDot category={f.category} custom={customCategories} />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-text-3 text-[11px] shrink-0">
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
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full align-middle"
                  style={{
                    color: foodCategoryColor(selected.category, customCategories),
                    background: `${foodCategoryColor(selected.category, customCategories)}1f`,
                  }}
                >
                  <CategoryDot category={selected.category} custom={customCategories} />
                  {selected.category}
                </span>
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

          {/* Category picker — color-coded, with the option to create a new one */}
          <div>
            <label className="label">Category</label>
            {!newCatMode ? (
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map((cat) => {
                  const active = mCategory === cat;
                  const color = foodCategoryColor(cat, customCategories);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMCategory(cat)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all",
                        active ? "border-transparent" : "border-border text-text-3 hover:text-text-1"
                      )}
                      style={
                        active
                          ? { background: `${color}26`, color, borderColor: `${color}66` }
                          : undefined
                      }
                    >
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      {cat}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setNewCatMode(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-dashed border-border-2 text-text-3 hover:text-accent hover:border-accent transition-all"
                >
                  <Plus size={12} /> New
                </button>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Color</label>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="!w-12 !h-9 !p-1 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setNewCatMode(false);
                    setNewCatName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-text-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveToLibrary}
              onChange={(e) => setSaveToLibrary(e.target.checked)}
              className="!w-4 !h-4"
            />
            Save to my food library for reuse
          </label>
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
