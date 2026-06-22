"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useFoodCatalog } from "@/hooks/useNutrition";
import { AIMealPlanModal } from "@/components/nutrition/AIMealPlanModal";
import {
  useMealPlans,
  useSaveMealPlan,
  useDeleteMealPlan,
  useAddPlanToLog,
  useUpdatePlanMealLabels,
  MealPlanInput,
} from "@/hooks/useMealPlans";
import { MealPlan, MealPlanItem, MealType, FoodCatalogItem } from "@/types/database";
import { computeMacros, round, todayISO, cn } from "@/lib/utils";
import {
  Plus,
  Minus,
  Trash2,
  Pencil,
  Search,
  X,
  CalendarPlus,
  UtensilsCrossed,
  Flame,
  Sparkles,
  Loader2,
  ThumbsUp,
  AlertCircle,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

const PLAN_TYPES: MealPlan["meal_type"][] = [
  "Full Day",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Pre-workout",
  "Post-workout",
];
const MEAL_SLOTS: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout"];
const UNITS = ["g", "oz", "cup", "serving"];
// Units a single serving can be expressed in (no "serving" — that'd be circular).
const SERVING_UNITS = ["g", "oz", "cup", "ml"];

function planTotals(plan: MealPlan) {
  return (plan.items || []).reduce(
    (a, it) => ({
      calories: a.calories + Number(it.calories),
      protein: a.protein + Number(it.protein),
      carbs: a.carbs + Number(it.carbs),
      fat: a.fat + Number(it.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// A single food row inside a plan card. In a grouped (Full Day) view the meal is
// shown in the group header, so it's hidden on the row.
function ItemRow({ it, hideMeal }: { it: MealPlanItem; hideMeal?: boolean }) {
  const qty = round(Number(it.quantity));
  const isServing = it.quantity_unit === "serving";
  const ssize = Number(it.serving_size ?? 100);
  const sunit = it.serving_unit ?? "g";
  // e.g. "1 serving (100g)", "2 servings (200g)", "1 serving (1cup)"
  const amountLabel = isServing
    ? `${qty} serving${qty !== 1 ? "s" : ""}${ssize > 0 ? ` (${round(qty * ssize)}${sunit})` : ""}`
    : `${qty}${it.quantity_unit}`;
  return (
    <div className="flex items-center justify-between text-[13px] bg-bg-2 rounded-lg px-2.5 py-1.5 border border-border/50">
      <div className="min-w-0">
        <span className="font-medium truncate">{it.name}</span>
        <span className="text-text-3 ml-1.5 text-[11px]">
          {hideMeal ? "" : `${it.meal} · `}
          {amountLabel}
        </span>
      </div>
      <div className="shrink-0 ml-2 text-right">
        <div className="text-text-2 text-xs">{Math.round(Number(it.calories))} cal</div>
        <div className="text-[10px] flex items-center justify-end gap-1.5">
          <span className="text-accent">{round(Number(it.protein))}p</span>
          <span className="text-status-teal">{round(Number(it.carbs))}c</span>
          <span className="text-status-coral">{round(Number(it.fat))}f</span>
        </div>
      </div>
    </div>
  );
}

export default function MealPlansPage() {
  const { data: plans = [] } = useMealPlans();
  const deletePlan = useDeleteMealPlan();
  const addToLog = useAddPlanToLog();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MealPlan | null>(null);
  const [addTarget, setAddTarget] = useState<MealPlan | null>(null);
  const [reviewTarget, setReviewTarget] = useState<MealPlan | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [renaming, setRenaming] = useState<{ planId: string; meal: string } | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const updateLabels = useUpdatePlanMealLabels();

  function saveLabel(plan: MealPlan, meal: string) {
    const val = renameVal.trim();
    const labels = { ...(plan.meal_labels || {}) };
    if (val && val !== meal) labels[meal] = val;
    else delete labels[meal];
    updateLabels.mutate(
      { id: plan.id, meal_labels: labels },
      {
        onSuccess: () => {
          toast.success("Meal renamed");
          setRenaming(null);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(p: MealPlan) {
    setEditing(p);
    setModalOpen(true);
  }

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Meal Plans"
        subtitle="Reusable meal templates with full macro breakdowns — add a whole plan to your log in one tap"
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setAiOpen(true)}>
              <Sparkles size={16} className="text-accent" /> AI Meal Plan
            </button>
            <button className="btn btn-primary group" onClick={openNew}>
              <span className="shine-overlay" />
              <Plus size={16} /> New Plan
            </button>
          </div>
        }
      />

      <AIMealPlanModal open={aiOpen} onClose={() => setAiOpen(false)} />

      {plans.length === 0 ? (
        <div className="card text-center py-12">
          <UtensilsCrossed size={28} className="mx-auto text-text-3 mb-3" />
          <div className="text-text-2 mb-1">No meal plans yet</div>
          <div className="text-sm text-text-3 mb-4">Build a reusable plan from your food catalog — or let the AI chef build one around your goals.</div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button className="btn btn-primary group" onClick={openNew}>
              <span className="shine-overlay" />
              <Plus size={16} /> Create your first plan
            </button>
            <button className="btn btn-ghost" onClick={() => setAiOpen(true)}>
              <Sparkles size={16} className="text-accent" /> Generate with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan, idx) => {
            const t = planTotals(plan);
            return (
              <div key={plan.id} className="card animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-base font-semibold flex items-center gap-2">{plan.name}</div>
                    <Badge variant="teal">{plan.meal_type}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-ghost btn-sm !px-1.5"
                      title="AI nutritionist review"
                      onClick={() => setReviewTarget(plan)}
                    >
                      <Sparkles size={15} className="text-status-teal" />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm !px-1.5"
                      title="Add to daily intake"
                      onClick={() => setAddTarget(plan)}
                    >
                      <CalendarPlus size={15} className="text-accent" />
                    </button>
                    <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => openEdit(plan)}>
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm !px-1.5"
                      onClick={() => {
                        deletePlan.mutate(plan.id);
                        toast.success("Plan deleted");
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <MacroPill label="Cal" value={Math.round(t.calories)} tone="text-status-amber" icon />
                  <MacroPill label="Protein" value={`${round(t.protein)}g`} tone="text-accent" />
                  <MacroPill label="Carbs" value={`${round(t.carbs)}g`} tone="text-status-teal" />
                  <MacroPill label="Fat" value={`${round(t.fat)}g`} tone="text-status-coral" />
                </div>

                {plan.notes && <div className="text-xs text-text-3 mb-2 italic">{plan.notes}</div>}

                {(plan.items || []).length === 0 ? (
                  <div className="text-xs text-text-3 text-center py-2">No foods in this plan.</div>
                ) : plan.meal_type === "Full Day" ? (
                  // Full Day → split into meal groups (Breakfast / Lunch / …), each renameable.
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                    {MEAL_SLOTS.map((meal) => {
                      const items = (plan.items || []).filter((it) => it.meal === meal);
                      if (items.length === 0) return null;
                      const mt = items.reduce(
                        (a, it) => ({
                          calories: a.calories + Number(it.calories),
                          protein: a.protein + Number(it.protein),
                          carbs: a.carbs + Number(it.carbs),
                          fat: a.fat + Number(it.fat),
                        }),
                        { calories: 0, protein: 0, carbs: 0, fat: 0 }
                      );
                      const label = plan.meal_labels?.[meal] || meal;
                      const isEditing = renaming?.planId === plan.id && renaming?.meal === meal;
                      return (
                        <div key={meal}>
                          <div className="flex items-center justify-between mb-1 px-0.5 gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input
                                  value={renameVal}
                                  onChange={(e) => setRenameVal(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveLabel(plan, meal);
                                    if (e.key === "Escape") setRenaming(null);
                                  }}
                                  autoFocus
                                  placeholder={meal}
                                  className="!py-1 !text-[12px] flex-1"
                                />
                                <button onClick={() => saveLabel(plan, meal)} className="p-1 text-status-green" title="Save">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => setRenaming(null)} className="p-1 text-text-3" title="Cancel">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-[11px] uppercase tracking-wider text-text-2 font-semibold flex items-center gap-1.5 min-w-0">
                                  <span className="truncate">{label}</span>
                                  <button
                                    onClick={() => {
                                      setRenaming({ planId: plan.id, meal });
                                      setRenameVal(plan.meal_labels?.[meal] || "");
                                    }}
                                    className="text-text-3/60 hover:text-accent shrink-0"
                                    title="Rename meal"
                                  >
                                    <Pencil size={10} />
                                  </button>
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] tabular-nums shrink-0">
                                  <span className="text-text-3">{Math.round(mt.calories)} cal</span>
                                  <span className="text-accent">{round(mt.protein)}p</span>
                                  <span className="text-status-teal">{round(mt.carbs)}c</span>
                                  <span className="text-status-coral">{round(mt.fat)}f</span>
                                </span>
                              </>
                            )}
                          </div>
                          <div className="space-y-1">
                            {items.map((it) => (
                              <ItemRow key={it.id} it={it} hideMeal />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Single meal → flat list
                  <div className="space-y-1 max-h-44 overflow-y-auto">
                    {(plan.items || []).map((it) => (
                      <ItemRow key={it.id} it={it} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NutritionReviewModal plan={reviewTarget} onClose={() => setReviewTarget(null)} />
      <PlanBuilderModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      <AddToIntakeModal
        plan={addTarget}
        onClose={() => setAddTarget(null)}
        onConfirm={(plan, portions) =>
          addToLog.mutate(
            { plan, date: todayISO(), multiplier: portions },
            {
              onSuccess: () => {
                toast.success(`${plan.name}${portions > 1 ? ` ×${portions}` : ""} added to today`);
                setAddTarget(null);
              },
              onError: (e) => toast.error(e.message),
            }
          )
        }
      />
    </div>
  );
}

function AddToIntakeModal({
  plan,
  onClose,
  onConfirm,
}: {
  plan: MealPlan | null;
  onClose: () => void;
  onConfirm: (plan: MealPlan, portions: number) => void;
}) {
  const [portions, setPortions] = useState(1);
  const [meal, setMeal] = useState("");
  const [initId, setInitId] = useState<string | null>(null);

  if (plan && initId !== plan.id) {
    setInitId(plan.id);
    setPortions(1);
    setMeal("");
  }

  if (!plan) return null;
  const isFullDay = plan.meal_type === "Full Day";
  const planMeals = isFullDay
    ? MEAL_SLOTS.filter((m) => (plan.items || []).some((it) => it.meal === m))
    : [];
  const mealLabel = meal ? plan.meal_labels?.[meal] || meal : "";
  // When a single meal of a Full Day plan is picked, log only that meal's items.
  const effectivePlan: MealPlan = {
    ...plan,
    name: meal ? `${plan.name} · ${mealLabel}` : plan.name,
    items: meal && isFullDay ? (plan.items || []).filter((it) => it.meal === meal) : plan.items || [],
  };
  const t = planTotals(effectivePlan);

  return (
    <Modal open={!!plan} onClose={onClose} title="Add to Daily Intake">
      <div className="space-y-4">
        <div>
          <div className="text-base font-semibold">{plan.name}</div>
          <Badge variant="teal">{plan.meal_type}</Badge>
        </div>

        {isFullDay && (
          <div>
            <label className="label">Which meal</label>
            <select value={meal} onChange={(e) => setMeal(e.target.value)}>
              <option value="">Whole day</option>
              {planMeals.map((m) => (
                <option key={m} value={m}>
                  {plan.meal_labels?.[m] || m}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Portions</label>
          <div className="flex items-center justify-center gap-4 bg-bg-2 rounded-xl border border-border py-4">
            <button
              className="btn btn-ghost !w-11 !h-11 !p-0 rounded-full"
              onClick={() => setPortions((p) => Math.max(1, p - 1))}
              disabled={portions <= 1}
            >
              <Minus size={20} />
            </button>
            <div className="text-3xl font-bold tabular-nums w-14 text-center">{portions}</div>
            <button
              className="btn btn-primary !w-11 !h-11 !p-0 rounded-full"
              onClick={() => setPortions((p) => Math.min(20, p + 1))}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <MacroPill label="Cal" value={Math.round(t.calories * portions)} tone="text-status-amber" icon />
          <MacroPill label="Protein" value={`${round(t.protein * portions)}g`} tone="text-accent" />
          <MacroPill label="Carbs" value={`${round(t.carbs * portions)}g`} tone="text-status-teal" />
          <MacroPill label="Fat" value={`${round(t.fat * portions)}g`} tone="text-status-coral" />
        </div>

        <div className="flex gap-2 pt-1">
          <button className="btn btn-primary flex-1" onClick={() => onConfirm(effectivePlan, portions)}>
            <CalendarPlus size={15} /> Add {meal ? mealLabel : "to today"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

type AIReview = {
  rating?: number;
  grade?: string;
  headline?: string;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  macro_balance?: string;
};

function ratingTone(rating: number): string {
  if (rating >= 8) return "#22d3a5";
  if (rating >= 6) return "#fbbf24";
  if (rating >= 4) return "#fb923c";
  return "#fb7185";
}

function NutritionReviewModal({
  plan,
  onClose,
}: {
  plan: MealPlan | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<AIReview | null>(null);
  const planId = plan?.id ?? null;

  // Fetch a fresh review whenever a new plan is opened.
  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    setReview(null);
    setError(null);
    setLoading(true);
    const payload = {
      plan: {
        name: plan.name,
        meal_type: plan.meal_type,
        notes: plan.notes,
        items: (plan.items || []).map((it) => ({
          name: it.name,
          meal: it.meal,
          quantity: Number(it.quantity),
          unit: it.quantity_unit,
          calories: Number(it.calories),
          protein: Number(it.protein),
          carbs: Number(it.carbs),
          fat: Number(it.fat),
        })),
      },
    };
    fetch("/api/nutrition-review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Review failed");
        if (!cancelled) setReview(data.review as AIReview);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  if (!plan) return null;

  const rating = Math.max(0, Math.min(10, Math.round(review?.rating ?? 0)));
  const tone = ratingTone(rating);

  return (
    <Modal open={!!plan} onClose={onClose} title="AI Nutritionist Review" wide>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-status-teal" />
          <span className="font-semibold">{plan.name}</span>
          <Badge variant="teal">{plan.meal_type}</Badge>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-text-3">
            <Loader2 size={28} className="animate-spin text-status-teal mb-3" />
            <div className="text-sm">Analyzing your meal plan…</div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 rounded-lg border border-status-amber/30 bg-status-amber/10 px-3 py-3 text-sm text-status-amber">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {review && !loading && (
          <div className="space-y-4 animate-fade-in">
            {/* Score */}
            <div className="flex items-center gap-4 rounded-xl border border-border bg-bg-2 p-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a2235" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={tone}
                    strokeWidth="3"
                    strokeDasharray={`${rating * 10} ${100 - rating * 10}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: tone }}>
                    {rating}
                  </span>
                  <span className="text-[9px] text-text-3">/ 10</span>
                </div>
              </div>
              <div className="min-w-0">
                {review.grade && (
                  <div className="text-2xl font-bold" style={{ color: tone }}>
                    {review.grade}
                  </div>
                )}
                {review.headline && (
                  <div className="text-sm font-medium text-text-1">{review.headline}</div>
                )}
                {review.macro_balance && (
                  <div className="text-[11px] text-text-3 mt-1">{review.macro_balance}</div>
                )}
              </div>
            </div>

            {review.summary && (
              <p className="text-sm text-text-2 leading-relaxed">{review.summary}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {!!review.strengths?.length && (
                <div className="card-sm">
                  <div className="text-[11px] uppercase tracking-wide text-status-green font-semibold mb-2 flex items-center gap-1.5">
                    <ThumbsUp size={12} /> Strengths
                  </div>
                  <ul className="space-y-1.5">
                    {review.strengths.map((s, i) => (
                      <li key={i} className="text-[13px] text-text-2 flex gap-2">
                        <span className="text-status-green">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!!review.improvements?.length && (
                <div className="card-sm">
                  <div className="text-[11px] uppercase tracking-wide text-status-amber font-semibold mb-2 flex items-center gap-1.5">
                    <AlertCircle size={12} /> Improvements
                  </div>
                  <ul className="space-y-1.5">
                    {review.improvements.map((s, i) => (
                      <li key={i} className="text-[13px] text-text-2 flex gap-2">
                        <span className="text-status-amber">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="text-[10px] text-text-3 text-center">
              AI-generated guidance — not medical advice.
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MacroPill({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  tone: string;
  icon?: boolean;
}) {
  return (
    <div className="bg-bg-2 rounded-lg px-2 py-1.5 text-center border border-border/50">
      <div className="text-[9px] uppercase tracking-wide text-text-3 flex items-center justify-center gap-0.5">
        {icon && <Flame size={9} />} {label}
      </div>
      <div className={cn("text-sm font-bold", tone)}>{value}</div>
    </div>
  );
}

type FormItem = {
  key: string;
  food_catalog_id: string | null;
  name: string;
  meal: MealType;
  quantity: string;
  quantity_unit: string;
  serving_size: string;
  serving_unit: string;
  per100: { calories: number; protein: number; carbs: number; fat: number } | null;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

const uid = () => Math.random().toString(36).slice(2, 10);

function itemMacros(it: FormItem) {
  if (it.per100) {
    return computeMacros(it.per100, parseFloat(it.quantity) || 0, it.quantity_unit);
  }
  return {
    calories: parseFloat(it.calories) || 0,
    protein: parseFloat(it.protein) || 0,
    carbs: parseFloat(it.carbs) || 0,
    fat: parseFloat(it.fat) || 0,
  };
}

function PlanBuilderModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: MealPlan | null;
}) {
  const { data: catalog = [] } = useFoodCatalog();
  const savePlan = useSaveMealPlan();

  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<MealPlan["meal_type"]>("Full Day");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<FormItem[]>([]);
  const [mealLabels, setMealLabels] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [initKey, setInitKey] = useState("");

  // initialize per open / editing change
  const sig = `${open}-${editing?.id ?? "new"}`;
  if (open && sig !== initKey) {
    setInitKey(sig);
    if (editing) {
      setName(editing.name);
      setMealType(editing.meal_type);
      setNotes(editing.notes || "");
      setItems(
        (editing.items || []).map((it) => ({
          key: uid(),
          food_catalog_id: it.food_catalog_id,
          name: it.name,
          meal: it.meal as MealType,
          quantity: String(it.quantity),
          quantity_unit: it.quantity_unit,
          serving_size: String(it.serving_size ?? 100),
          serving_unit: it.serving_unit ?? "g",
          per100: null,
          calories: String(it.calories),
          protein: String(it.protein),
          carbs: String(it.carbs),
          fat: String(it.fat),
        }))
      );
      setMealLabels(editing.meal_labels || {});
    } else {
      setName("");
      setMealType("Full Day");
      setNotes("");
      setItems([]);
      setMealLabels({});
    }
  }

  function addFromCatalog(food: FoodCatalogItem) {
    setItems((xs) => [
      ...xs,
      {
        key: uid(),
        food_catalog_id: food.id,
        name: food.name,
        meal: "Breakfast",
        quantity: "100",
        quantity_unit: "g",
        serving_size: "100",
        serving_unit: "g",
        per100: {
          calories: food.calories_per_100g,
          protein: food.protein_per_100g,
          carbs: food.carbs_per_100g,
          fat: food.fat_per_100g,
        },
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      },
    ]);
  }
  function addCustom() {
    setItems((xs) => [
      ...xs,
      {
        key: uid(),
        food_catalog_id: null,
        name: "",
        meal: "Breakfast",
        quantity: "1",
        quantity_unit: "serving",
        serving_size: "100",
        serving_unit: "g",
        per100: null,
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      },
    ]);
  }
  function patch(key: string, p: Partial<FormItem>) {
    setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...p } : x)));
  }
  function remove(key: string) {
    setItems((xs) => xs.filter((x) => x.key !== key));
  }

  const totals = useMemo(
    () =>
      items.reduce(
        (a, it) => {
          const m = itemMacros(it);
          return {
            calories: a.calories + m.calories,
            protein: a.protein + m.protein,
            carbs: a.carbs + m.carbs,
            fat: a.fat + m.fat,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [items]
  );

  function handleSave() {
    if (!name.trim()) return toast.error("Name your plan");
    if (items.length === 0) return toast.error("Add at least one food");
    if (items.some((it) => !it.name.trim())) return toast.error("Every food needs a name");

    // Keep only meaningful, non-default meal labels (Full Day plans only).
    const cleanedLabels: Record<string, string> = {};
    if (mealType === "Full Day") {
      for (const [k, v] of Object.entries(mealLabels)) {
        const val = (v || "").trim();
        if (val && val !== k) cleanedLabels[k] = val;
      }
    }

    const input: MealPlanInput = {
      name: name.trim(),
      meal_type: mealType,
      notes: notes || null,
      meal_labels: cleanedLabels,
      items: items.map((it) => {
        const m = itemMacros(it);
        return {
          food_catalog_id: it.food_catalog_id,
          name: it.name.trim(),
          meal: it.meal,
          quantity: parseFloat(it.quantity) || 0,
          quantity_unit: it.quantity_unit,
          serving_size: parseFloat(it.serving_size) || 100,
          serving_unit: it.serving_unit || "g",
          calories: round(m.calories),
          protein: round(m.protein),
          carbs: round(m.carbs),
          fat: round(m.fat),
        };
      }),
    };

    savePlan.mutate(
      { id: editing?.id, input },
      {
        onSuccess: () => {
          toast.success(editing ? "Plan updated" : "Plan created");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={editing ? "Edit Meal Plan" : "New Meal Plan"} wide>
        <div className="space-y-3">
          <div className="flex gap-2.5 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="label">Plan name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 3000 kcal Lean Bulk" />
            </div>
            <div className="w-44">
              <label className="label">Type</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value as MealPlan["meal_type"])}>
                {PLAN_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs bg-bg-2 rounded-lg px-3 py-2 border border-border">
            <span className="text-status-amber font-semibold">{Math.round(totals.calories)} cal</span>
            <span className="text-accent">{round(totals.protein)}p</span>
            <span className="text-status-teal">{round(totals.carbs)}c</span>
            <span className="text-status-coral">{round(totals.fat)}f</span>
            <span className="ml-auto text-text-3">{items.length} foods</span>
          </div>

          {mealType === "Full Day" &&
            (() => {
              const presentMeals = MEAL_SLOTS.filter((m) => items.some((it) => it.meal === m));
              if (presentMeals.length === 0) return null;
              return (
                <div className="rounded-lg border border-border bg-bg-2/50 p-2.5">
                  <div className="text-[11px] uppercase tracking-wide text-text-3 font-semibold mb-1.5">
                    Meal names — rename each meal (optional)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {presentMeals.map((m) => (
                      <div key={m} className="flex items-center gap-2">
                        <span className="text-[11px] text-text-3 w-24 shrink-0">{m}</span>
                        <input
                          value={mealLabels[m] || ""}
                          onChange={(e) => setMealLabels((s) => ({ ...s, [m]: e.target.value }))}
                          placeholder={m}
                          className="!py-1 !text-[12px] flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {items.map((it) => {
              const m = itemMacros(it);
              return (
                <div key={it.key} className="card-sm !p-2.5">
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      value={it.name}
                      onChange={(e) => patch(it.key, { name: e.target.value })}
                      placeholder="Food name"
                      className="!py-1 text-sm flex-1"
                    />
                    <select value={it.meal} onChange={(e) => patch(it.key, { meal: e.target.value as MealType })} className="!py-1 text-xs w-32">
                      {MEAL_SLOTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => remove(it.key)}>
                      <X size={13} />
                    </button>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      type="number"
                      value={it.quantity}
                      onChange={(e) => patch(it.key, { quantity: e.target.value })}
                      className="!py-1 text-sm w-20"
                    />
                    <select value={it.quantity_unit} onChange={(e) => patch(it.key, { quantity_unit: e.target.value })} className="!py-1 text-xs w-24">
                      {UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                    {it.quantity_unit === "serving" && (
                      <span className="flex items-center gap-1 text-[11px] text-text-3">
                        <span className="whitespace-nowrap">1 serving =</span>
                        <input
                          type="number"
                          value={it.serving_size}
                          onChange={(e) => patch(it.key, { serving_size: e.target.value })}
                          className="!py-1 text-xs w-14"
                          aria-label="Serving size"
                        />
                        <select
                          value={it.serving_unit}
                          onChange={(e) => patch(it.key, { serving_unit: e.target.value })}
                          className="!py-1 text-xs w-16"
                          aria-label="Serving unit"
                        >
                          {SERVING_UNITS.map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </span>
                    )}
                    {it.per100 ? (
                      <span className="text-xs tabular-nums flex items-center gap-1.5">
                        <span className="text-status-amber">{Math.round(m.calories)} cal</span>
                        <span className="text-accent">{round(m.protein)}p</span>
                        <span className="text-status-teal">{round(m.carbs)}c</span>
                        <span className="text-status-coral">{round(m.fat)}f</span>
                      </span>
                    ) : (
                      <div className="flex gap-1.5 items-center text-[11px]">
                        <MiniMacro label="cal" value={it.calories} onChange={(v) => patch(it.key, { calories: v })} />
                        <MiniMacro label="p" value={it.protein} onChange={(v) => patch(it.key, { protein: v })} />
                        <MiniMacro label="c" value={it.carbs} onChange={(v) => patch(it.key, { carbs: v })} />
                        <MiniMacro label="f" value={it.fat} onChange={(v) => patch(it.key, { fat: v })} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1 border border-dashed border-border" onClick={() => setPickerOpen(true)}>
              <Search size={14} /> From catalog
            </button>
            <button className="btn btn-ghost flex-1 border border-dashed border-border" onClick={addCustom}>
              <Plus size={14} /> Custom food
            </button>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Timing, prep, swaps..." />
          </div>

          <div className="flex gap-2 pt-1">
            <button className="btn btn-primary" onClick={handleSave}>{editing ? "Update Plan" : "Save Plan"}</button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </Modal>

      <FoodPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        catalog={catalog}
        onPick={(f) => {
          addFromCatalog(f);
          toast.success(`Added ${f.name}`);
        }}
      />
    </>
  );
}

function MiniMacro({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const labelColor =
    label === "p"
      ? "text-accent"
      : label === "c"
      ? "text-status-teal"
      : label === "f"
      ? "text-status-coral"
      : label === "cal"
      ? "text-status-amber"
      : "text-text-3";
  return (
    <span className="inline-flex items-center gap-0.5">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="!py-0.5 !px-1 w-12 text-[11px]"
        placeholder="0"
      />
      <span className={labelColor}>{label}</span>
    </span>
  );
}

function FoodPicker({
  open,
  onClose,
  catalog,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  catalog: FoodCatalogItem[];
  onPick: (f: FoodCatalogItem) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      catalog
        .filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 100),
    [catalog, search]
  );

  return (
    <Modal open={open} onClose={onClose} title="Add Food from Catalog" wide>
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods..." className="!pl-9" autoFocus />
        </div>
        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {filtered.map((f) => (
            <div key={f.id} className="flex items-center gap-2 bg-bg-2 hover:bg-bg-3 border border-border rounded-lg px-3 py-2 transition-all">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{f.name}</div>
                <div className="text-[10px] text-text-3">
                  {f.calories_per_100g} cal · {f.protein_per_100g}p {f.carbs_per_100g}c {f.fat_per_100g}f / 100g
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => onPick(f)}>
                <Plus size={13} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center text-text-3 text-sm py-6">No foods match.</div>}
        </div>
        <div className="flex justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  );
}
