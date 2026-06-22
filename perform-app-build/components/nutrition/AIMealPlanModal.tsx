"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useSaveMealPlan } from "@/hooks/useMealPlans";
import { MealType } from "@/types/database";
import { MACRO_HEX, MACRO_TEXT } from "@/lib/utils";
import { Sparkles, Loader2, ChefHat, Save, RotateCcw, Flame } from "lucide-react";
import toast from "react-hot-toast";

type GenItem = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
type GenMeal = { meal: string; items: GenItem[] };
type GenPlan = {
  name: string;
  summary: string;
  targets?: { calories: number; protein: number; carbs: number; fat: number };
  meals: GenMeal[];
  notes?: string;
};

const GOAL_PRESETS = ["Lean bulk", "Cut / fat loss", "Recomp", "Maintain", "Contest prep"];
const MEAL_OPTIONS: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout"];
const VALID_MEALS = new Set(MEAL_OPTIONS as string[]);

const n = (v: unknown) => Math.round(Number(v) || 0);

export function AIMealPlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const save = useSaveMealPlan();
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState<"anything" | "restricted">("anything");
  const [ingredients, setIngredients] = useState("");
  const [meals, setMeals] = useState<MealType[]>(["Breakfast", "Lunch", "Dinner", "Snack"]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GenPlan | null>(null);

  function toggleMeal(m: MealType) {
    setMeals((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  async function generate() {
    if (!goal.trim()) {
      toast.error("Tell the coach your goal first.");
      return;
    }
    if (mode === "restricted" && !ingredients.trim()) {
      toast.error("List the ingredients to build from.");
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const res = await fetch("/api/meal-plan-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          goal,
          mode,
          ingredients,
          meals: meals.join(", "),
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Could not generate a plan.");
        return;
      }
      setPlan(data.plan as GenPlan);
    } catch {
      toast.error("Network error reaching the meal-plan service.");
    } finally {
      setLoading(false);
    }
  }

  const totals = plan
    ? plan.meals.flatMap((m) => m.items).reduce(
        (a, it) => ({
          calories: a.calories + n(it.calories),
          protein: a.protein + n(it.protein),
          carbs: a.carbs + n(it.carbs),
          fat: a.fat + n(it.fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
    : null;

  function savePlan() {
    if (!plan) return;
    const items = plan.meals.flatMap((m) => {
      const meal = (VALID_MEALS.has(m.meal) ? m.meal : "Snack") as MealType;
      return (m.items || []).map((it) => ({
        food_catalog_id: null,
        name: it.name,
        meal,
        quantity: Number(it.quantity) || 1,
        quantity_unit: it.unit || "serving",
        calories: n(it.calories),
        protein: n(it.protein),
        carbs: n(it.carbs),
        fat: n(it.fat),
      }));
    });
    save.mutate(
      {
        input: {
          name: plan.name || "AI Meal Plan",
          meal_type: "Full Day",
          notes: plan.summary || null,
          items,
        },
      },
      {
        onSuccess: () => {
          toast.success("Saved to your meal plans");
          reset();
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function reset() {
    setPlan(null);
    setGoal("");
    setIngredients("");
    setNotes("");
    setMode("anything");
    setMeals(["Breakfast", "Lunch", "Dinner", "Snack"]);
  }

  return (
    <Modal open={open} onClose={onClose} title="AI Meal Plan Builder" wide>
      {!plan ? (
        <div className="space-y-4">
          <p className="text-sm text-text-2">
            The AI chef reads your tracked stats and builds a plan around your goal. Tell it what you&apos;re after.
          </p>

          <div>
            <label className="label">Your goal &amp; intentions</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {GOAL_PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal((cur) => (cur ? cur : g))}
                  className="text-[12px] px-2.5 py-1 rounded-full border border-border bg-bg-2 text-text-2 hover:border-accent/50 hover:text-text-1 transition-colors"
                >
                  {g}
                </button>
              ))}
            </div>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder="e.g. Lean bulk to ~200lb, ~3000 kcal, high protein, train 5x/week…"
            />
          </div>

          <div>
            <label className="label">Ingredients</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("anything")}
                className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                  mode === "anything" ? "border-accent bg-accent-dim text-text-1" : "border-border bg-bg-2 text-text-2"
                }`}
              >
                <Sparkles size={14} className="inline mr-1.5 text-accent" />
                Let the AI recommend anything
              </button>
              <button
                type="button"
                onClick={() => setMode("restricted")}
                className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                  mode === "restricted" ? "border-accent bg-accent-dim text-text-1" : "border-border bg-bg-2 text-text-2"
                }`}
              >
                <ChefHat size={14} className="inline mr-1.5 text-accent" />
                Only use my ingredients
              </button>
            </div>
            {mode === "restricted" && (
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={2}
                className="mt-2"
                placeholder="List foods you have / want to use — e.g. chicken breast, white rice, eggs, broccoli, olive oil, greek yogurt…"
              />
            )}
          </div>

          <div>
            <label className="label">Meals to include</label>
            <div className="flex flex-wrap gap-1.5">
              {MEAL_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMeal(m)}
                  className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                    meals.includes(m)
                      ? "border-accent bg-accent-dim text-text-1"
                      : "border-border bg-bg-2 text-text-3 hover:text-text-2"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Preferences (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, dislikes, prep style, budget…"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="btn btn-primary group w-full justify-center"
          >
            <span className="shine-overlay" />
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Building your plan…" : "Generate meal plan"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-display font-bold">{plan.name}</h3>
            {plan.summary && <p className="text-sm text-text-2 mt-1">{plan.summary}</p>}
          </div>

          {totals && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { k: "Calories", v: totals.calories, c: MACRO_HEX.calories, u: "" },
                { k: "Protein", v: totals.protein, c: MACRO_HEX.protein, u: "g" },
                { k: "Carbs", v: totals.carbs, c: MACRO_HEX.carbs, u: "g" },
                { k: "Fat", v: totals.fat, c: MACRO_HEX.fat, u: "g" },
              ].map((m) => (
                <div key={m.k} className="rounded-xl border border-border bg-bg-2/70 px-3 py-2 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-text-3">{m.k}</div>
                  <div className="font-display font-bold tabular-nums" style={{ color: m.c }}>
                    {m.v}
                    {m.u}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 max-h-[44vh] overflow-y-auto pr-1">
            {plan.meals.map((m, i) => {
              const mt = m.items.reduce((a, it) => a + n(it.calories), 0);
              return (
                <div key={i} className="rounded-xl border border-border bg-bg-2/40 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <Flame size={13} className="text-status-amber" /> {m.meal}
                    </div>
                    <div className="text-[11px] text-text-3 tabular-nums">{mt} kcal</div>
                  </div>
                  <div className="space-y-1">
                    {m.items.map((it, j) => (
                      <div key={j} className="flex items-center justify-between text-[12px]">
                        <span className="text-text-1">
                          {it.name}{" "}
                          <span className="text-text-3">
                            · {it.quantity}
                            {it.unit}
                          </span>
                        </span>
                        <span className="tabular-nums shrink-0 ml-2 flex items-center gap-1.5">
                          <span className={MACRO_TEXT.calories}>{n(it.calories)} kcal</span>
                          <span className={MACRO_TEXT.protein}>{n(it.protein)}p</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {plan.notes && (
            <p className="text-[12px] text-text-3 border-l-2 border-accent/40 pl-3">{plan.notes}</p>
          )}

          <div className="flex gap-2">
            <button onClick={savePlan} disabled={save.isPending} className="btn btn-primary group flex-1 justify-center">
              <span className="shine-overlay" />
              {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save to my plans
            </button>
            <button onClick={() => setPlan(null)} className="btn btn-ghost">
              <RotateCcw size={15} /> Tweak
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
