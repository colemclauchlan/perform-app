"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { useMealPlans, useAddPlanToLog } from "@/hooks/useMealPlans";
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
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Minus,
  Flame,
  Utensils,
  CornerDownLeft,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/visual/Motion";
import toast from "react-hot-toast";

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

const MEALS: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout"];

export default function NutritionPage() {
  const [date, setDate] = useState(todayISO());
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
    { label: "Calories", value: totals.cal, target: calGoal, unit: "kcal", color: "#2563eb" },
    { label: "Protein", value: totals.p, target: proteinGoal, unit: "g", color: "#2dd4bf" },
    { label: "Carbs", value: totals.c, target: profile?.target_carbs || 250, unit: "g", color: "#fbbf24" },
    { label: "Fat", value: totals.f, target: profile?.target_fat || 80, unit: "g", color: "#fb7185" },
  ];

  const calRemaining = Math.round(calGoal - totals.cal);
  const calPctOfGoal = calGoal > 0 ? Math.min(100, Math.round((totals.cal / calGoal) * 100)) : 0;

  function log_(entry: Record<string, unknown>) {
    addLog.mutate(entry, {
      onSuccess: () => toast.success("Logged"),
      onError: (e) => toast.error(e.message),
    });
  }
  function saveCategory(name: string, color: string) {
    updateProfile.mutate({
      preferences: {
        ...(profile?.preferences ?? {}),
        custom_food_categories: [...customCategories, { name, color }],
      },
    });
  }

  return (
    <div className="p-6 max-w-[1200px]">
      {/* Header — logging is inline below, no modal trigger */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="relative pl-3.5">
          <span className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-brand-gradient" />
          <h1 className="text-2xl font-display font-bold tracking-tight leading-none">Nutrition</h1>
          <p className="text-sm text-text-2 mt-1.5">Search a food and log it in one tap</p>
        </div>
        <div className="flex gap-2 items-center">
          <button className="btn btn-ghost btn-sm" onClick={() => changeDate(-1)} title="Previous day">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm text-text-2 min-w-[132px] text-center tabular-nums">
            {new Date(date + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => changeDate(1)} title="Next day">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── STAR: inline logger + diary ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <FoodLogger
            date={date}
            customCategories={customCategories}
            onLog={log_}
            onSaveCategory={saveCategory}
          />

          {/* Today's food log */}
          <div className="card">
            <div className="card-title flex items-center gap-2 mb-3">
              <Utensils size={14} className="text-accent" /> {formatDate(date)} · Food Log
            </div>
            {log.length === 0 ? (
              <div className="text-text-3 text-sm text-center py-8">
                Nothing logged yet — search a food above to start your diary.
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
                  const shareTone =
                    calPct >= 40 ? "bg-status-red/15 text-status-red"
                      : calPct >= 25 ? "bg-status-amber/15 text-status-amber"
                      : "bg-status-green/15 text-status-green";
                  return (
                    <div key={meal}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[11px] uppercase tracking-wider text-text-3">{meal}</div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${shareTone}`}>{calPct}% kcal</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-accent-dim text-accent">{pPct}% protein</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {mealLog.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center justify-between bg-bg-2/80 rounded-xl px-3 py-2.5 border border-border transition-colors hover:border-border-2 hover:bg-bg-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CategoryDot category={e.food_catalog_id ? categoryById.get(e.food_catalog_id) : "Custom"} custom={customCategories} />
                              <div className="min-w-0">
                                <div className="text-sm truncate">{e.name}</div>
                                <div className="text-[11px] text-text-2 tabular-nums">
                                  {Math.round(e.protein)}g P · {Math.round(e.carbs)}g C · {Math.round(e.fat)}g F
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 bg-bg-3 rounded-lg border border-border px-1">
                                <button className="p-1 text-text-3 hover:text-text-1 disabled:opacity-30" title="Decrease portion" disabled={updateLog.isPending} onClick={() => adjustPortion(e, -1)}>
                                  <Minus size={12} />
                                </button>
                                <span className="text-[11px] text-text-2 min-w-[52px] text-center tabular-nums">{e.quantity}{e.quantity_unit}</span>
                                <button className="p-1 text-text-3 hover:text-text-1 disabled:opacity-30" title="Increase portion" disabled={updateLog.isPending} onClick={() => adjustPortion(e, 1)}>
                                  <Plus size={12} />
                                </button>
                              </div>
                              <span className="text-sm font-bold font-display text-accent-bright tabular-nums">{Math.round(e.calories)}</span>
                              <span className="text-[11px] text-text-3">kcal</span>
                              <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => { deleteLog.mutate(e.id); toast.success("Removed"); }}>
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
        </div>

        {/* ── Trackers sidebar ────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Calorie summary */}
          <div className="panel hairline-top p-4 sm:p-5">
            <div className="absolute -top-10 -right-8 w-44 h-44 bg-brand-gradient opacity-20 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-text-3 font-semibold mb-2">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#2563eb1a", color: "#3b82f6", boxShadow: "inset 0 0 0 1px #2563eb33" }}>
                  <Flame size={13} />
                </span>
                Calories today
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl sm:text-5xl font-bold tabular-nums text-brand leading-none">
                  {Math.round(totals.cal).toLocaleString()}
                </span>
                <span className="text-text-3 text-base font-medium tabular-nums">/ {calGoal.toLocaleString()}</span>
              </div>
              <div className="text-sm text-text-2 mt-2 tabular-nums">
                {calRemaining > 0 ? (
                  <><span className="text-text-1 font-semibold">{calRemaining.toLocaleString()}</span> kcal remaining</>
                ) : calRemaining === 0 ? (
                  <span className="text-status-amber font-semibold">Daily target reached</span>
                ) : (
                  <span className="text-status-red font-semibold">{Math.abs(calRemaining).toLocaleString()} kcal over</span>
                )}
              </div>
              <div className="relative mt-4 h-2 rounded-full bg-bg-3 overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full bg-accent-gradient progress-bar" style={{ width: `${calPctOfGoal}%` }} />
              </div>
            </div>
          </div>

          {/* Macro rings */}
          <div className="grid grid-cols-2 gap-3">
            {rings.map((r) => (
              <MacroRing key={r.label} {...r} />
            ))}
          </div>

          {/* Weekly macro goals */}
          <Reveal>
            <WeeklyMacroGoals data={weekly} calGoal={calGoal} proteinGoal={proteinGoal} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}

// ─── INLINE FOOD LOGGER (the star) ────────────────────────────────────────────
function FoodLogger({
  date,
  customCategories,
  onLog,
  onSaveCategory,
}: {
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
  const { data: plans = [] } = useMealPlans();
  const addPlanToLog = useAddPlanToLog();
  const [planId, setPlanId] = useState("");

  function logPlan() {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    addPlanToLog.mutate(
      { plan, date },
      {
        onSuccess: () => { toast.success(`Logged "${plan.name}"`); setPlanId(""); },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  const allCategories = useMemo(() => {
    const names = new Set<string>(Object.keys(FOOD_CATEGORY_COLORS));
    customCategories.forEach((c) => names.add(c.name));
    return Array.from(names);
  }, [customCategories]);

  const matches = useMemo(() => (search.length < 2 ? [] : catalog.slice(0, 10)), [catalog, search]);

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

  // One-tap quick add from a search result (default 100g / 1 serving).
  function quickAdd(f: FoodCatalogItem) {
    const m = computeMacros(
      { calories: f.calories_per_100g, protein: f.protein_per_100g, carbs: f.carbs_per_100g, fat: f.fat_per_100g },
      100,
      "g"
    );
    onLog({ name: f.name, food_catalog_id: f.id, meal, logged_date: date, quantity: 100, quantity_unit: "g", ...m });
  }

  function addSelected() {
    if (!selected || !preview) {
      toast.error("Pick a food first");
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
    setSelected(null);
    setSearch("");
    setQty("100");
    setUnit("g");
  }

  function addManual() {
    const cal = parseFloat(mCal) || 0;
    const p = parseFloat(mP) || 0;
    const c = parseFloat(mC) || 0;
    const f = parseFloat(mF) || 0;
    if (!mName.trim() && cal <= 0 && p <= 0 && c <= 0 && f <= 0) {
      toast.error("Enter a food name or its calories");
      return;
    }
    const category = newCatMode && newCatName.trim() ? newCatName.trim() : mCategory;
    if (
      newCatMode &&
      newCatName.trim() &&
      !FOOD_CATEGORY_COLORS[newCatName.trim()] &&
      !customCategories.some((x) => x.name.toLowerCase() === newCatName.trim().toLowerCase())
    ) {
      onSaveCategory(newCatName.trim(), newCatColor);
    }
    if (saveToLibrary && mName.trim()) {
      addFood.mutate(
        { name: mName.trim(), category, calories_per_100g: cal, protein_per_100g: p, carbs_per_100g: c, fat_per_100g: f, is_global: false },
        { onSuccess: () => toast.success("Saved to your food library"), onError: (e) => toast.error(e.message) }
      );
    }
    onLog({ name: mName || "Custom Food", meal, logged_date: date, quantity: 1, quantity_unit: "serving", calories: cal, protein: p, carbs: c, fat: f });
    setMName(""); setMCal(""); setMP(""); setMC(""); setMF("");
    setSaveToLibrary(false); setMCategory("Custom"); setNewCatMode(false); setNewCatName("");
  }

  return (
    <div className="panel hairline-top p-4 sm:p-5">
      <div className="absolute -top-12 -right-10 w-52 h-52 bg-brand-gradient opacity-[0.18] blur-3xl pointer-events-none" />
      <div className="relative">
        {/* Header + tabs */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="w-8 h-8 rounded-xl bg-accent-gradient flex items-center justify-center shadow-glow">
              <Utensils size={16} className="text-white" />
            </span>
            Log Food
          </div>
          <div className="flex gap-1 bg-bg-2 p-1 rounded-lg border border-border">
            {(["search", "manual"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                  tab === t ? "bg-accent-gradient text-white shadow-soft" : "text-text-2 hover:text-text-1"
                )}
              >
                {t === "search" ? "Search" : "Manual"}
              </button>
            ))}
          </div>
        </div>

        {/* Meal selector chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {MEALS.map((m) => (
            <button
              key={m}
              onClick={() => setMeal(m)}
              className={cn(
                "text-[12px] px-2.5 py-1 rounded-full border transition-colors",
                meal === m ? "border-accent bg-accent-dim text-text-1 font-medium" : "border-border bg-bg-2 text-text-3 hover:text-text-2"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {tab === "search" ? (
          <div>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
                placeholder="Search foods — e.g. chicken breast, oats, banana…"
                className="!pl-10 !py-3 !text-[15px]"
              />
            </div>

            {!selected && search.length >= 2 && (
              <div className="mt-2 rounded-xl border border-border bg-bg-2/50 divide-y divide-border/50 max-h-72 overflow-y-auto">
                {matches.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-text-3 text-center">
                    No matches. Try the <button className="text-accent hover:underline" onClick={() => setTab("manual")}>manual entry</button>.
                  </div>
                ) : (
                  matches.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-bg-2 transition-colors">
                      <CategoryDot category={f.category} custom={customCategories} />
                      <button className="flex-1 min-w-0 text-left" onClick={() => { setSelected(f); setSearch(f.name); }} title="Adjust portion">
                        <div className="text-sm truncate">{f.name}</div>
                        <div className="text-[11px] text-text-3 tabular-nums">
                          {f.calories_per_100g} kcal · {f.protein_per_100g}P / {f.carbs_per_100g}C / {f.fat_per_100g}F per 100g
                        </div>
                      </button>
                      <button
                        onClick={() => quickAdd(f)}
                        className="btn btn-primary btn-sm group shrink-0"
                        title={`Add 100g to ${meal}`}
                      >
                        <span className="shine-overlay" />
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {selected && (
              <div className="mt-3 rounded-xl border border-border-2/60 bg-bg-2/60 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CategoryDot category={selected.category} custom={customCategories} />
                  <span className="text-sm font-medium flex-1 truncate">{selected.name}</span>
                  <button className="text-text-3 hover:text-text-1 text-xs" onClick={() => { setSelected(null); setSearch(""); }}>
                    change
                  </button>
                </div>
                <div className="flex items-end gap-2.5">
                  <div className="flex-1">
                    <label className="label">Quantity</label>
                    <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
                  </div>
                  <div className="w-28">
                    <label className="label">Unit</label>
                    <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                      <option>g</option><option>oz</option><option>serving</option><option>cup</option>
                    </select>
                  </div>
                  <button className="btn btn-primary group h-[42px]" onClick={addSelected}>
                    <span className="shine-overlay" />
                    <Plus size={16} /> Add
                  </button>
                </div>
                {preview && (
                  <div className="text-xs text-text-2 mt-2 tabular-nums">
                    {qty}{unit} → <b className="text-accent">{Math.round(preview.calories)} kcal</b> · {Math.round(preview.protein)}g P · {Math.round(preview.carbs)}g C · {Math.round(preview.fat)}g F
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="label">Food name</label>
              <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Custom food name" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="label">Calories</label>
                <input type="number" value={mCal} onChange={(e) => setMCal(e.target.value)} placeholder="kcal" />
              </div>
              <div>
                <label className="label">Protein</label>
                <input type="number" value={mP} onChange={(e) => setMP(e.target.value)} placeholder="g" />
              </div>
              <div>
                <label className="label">Carbs</label>
                <input type="number" value={mC} onChange={(e) => setMC(e.target.value)} placeholder="g" />
              </div>
              <div>
                <label className="label">Fat</label>
                <input type="number" value={mF} onChange={(e) => setMF(e.target.value)} placeholder="g" />
              </div>
            </div>

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
                        className={cn("flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all", active ? "border-transparent" : "border-border text-text-3 hover:text-text-1")}
                        style={active ? { background: `${color}26`, color, borderColor: `${color}66` } : undefined}
                      >
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        {cat}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => setNewCatMode(true)} className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-dashed border-border-2 text-text-3 hover:text-accent hover:border-accent transition-all">
                    <Plus size={12} /> New
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category name" autoFocus />
                  </div>
                  <div>
                    <label className="label">Color</label>
                    <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="!w-12 !h-9 !p-1 cursor-pointer" />
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setNewCatMode(false); setNewCatName(""); }}>Cancel</button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-text-2 cursor-pointer">
                <input type="checkbox" checked={saveToLibrary} onChange={(e) => setSaveToLibrary(e.target.checked)} className="!w-4 !h-4" />
                Save to my food library
              </label>
              <button className="btn btn-primary group" onClick={addManual}>
                <span className="shine-overlay" />
                <CornerDownLeft size={15} /> Add to {meal}
              </button>
            </div>
          </div>
        )}

        {/* Quick-log a saved meal plan */}
        <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-text-3 flex items-center gap-1.5 whitespace-nowrap">
            <UtensilsCrossed size={13} className="text-accent" /> Saved plan:
          </span>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="flex-1 min-w-[150px]"
            disabled={plans.length === 0}
          >
            <option value="">{plans.length === 0 ? "No saved plans yet" : "Select a meal plan…"}</option>
            {plans.map((p) => {
              const cal = (p.items || []).reduce((a, it) => a + Number(it.calories), 0);
              return (
                <option key={p.id} value={p.id}>
                  {p.name} · {Math.round(cal)} kcal
                </option>
              );
            })}
          </select>
          <button
            className="btn btn-primary btn-sm group"
            onClick={logPlan}
            disabled={!planId || addPlanToLog.isPending}
          >
            <span className="shine-overlay" />
            <Plus size={14} /> Log plan
          </button>
          <Link href="/meal-plans" className="btn btn-ghost btn-sm">
            Meal Plans <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
