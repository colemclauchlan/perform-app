"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useFoodCatalog } from "@/hooks/useNutrition";
import {
  useMealPlans,
  useSaveMealPlan,
  useDeleteMealPlan,
  useAddPlanToLog,
  MealPlanInput,
} from "@/hooks/useMealPlans";
import { MealPlan, MealType, FoodCatalogItem } from "@/types/database";
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

export default function MealPlansPage() {
  const { data: plans = [] } = useMealPlans();
  const deletePlan = useDeleteMealPlan();
  const addToLog = useAddPlanToLog();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MealPlan | null>(null);
  const [addTarget, setAddTarget] = useState<MealPlan | null>(null);

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
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> New Plan
          </button>
        }
      />

      {plans.length === 0 ? (
        <div className="card text-center py-12">
          <UtensilsCrossed size={28} className="mx-auto text-text-3 mb-3" />
          <div className="text-text-2 mb-1">No meal plans yet</div>
          <div className="text-sm text-text-3 mb-4">Build a reusable plan from your food catalog.</div>
          <button className="btn btn-primary mx-auto" onClick={openNew}>
            <Plus size={16} /> Create your first plan
          </button>
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

                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {(plan.items || []).map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-[13px] bg-bg-2 rounded-lg px-2.5 py-1.5 border border-border/50">
                      <div className="min-w-0">
                        <span className="font-medium truncate">{it.name}</span>
                        <span className="text-text-3 ml-1.5 text-[11px]">{it.meal} · {round(Number(it.quantity))}{it.quantity_unit}</span>
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
                  ))}
                  {(plan.items || []).length === 0 && (
                    <div className="text-xs text-text-3 text-center py-2">No foods in this plan.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
  const [initId, setInitId] = useState<string | null>(null);

  if (plan && initId !== plan.id) {
    setInitId(plan.id);
    setPortions(1);
  }

  if (!plan) return null;
  const t = planTotals(plan);

  return (
    <Modal open={!!plan} onClose={onClose} title="Add to Daily Intake">
      <div className="space-y-4">
        <div>
          <div className="text-base font-semibold">{plan.name}</div>
          <Badge variant="teal">{plan.meal_type}</Badge>
        </div>

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
          <button className="btn btn-primary flex-1" onClick={() => onConfirm(plan, portions)}>
            <CalendarPlus size={15} /> Add to today
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
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
          per100: null,
          calories: String(it.calories),
          protein: String(it.protein),
          carbs: String(it.carbs),
          fat: String(it.fat),
        }))
      );
    } else {
      setName("");
      setMealType("Full Day");
      setNotes("");
      setItems([]);
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

    const input: MealPlanInput = {
      name: name.trim(),
      meal_type: mealType,
      notes: notes || null,
      items: items.map((it) => {
        const m = itemMacros(it);
        return {
          food_catalog_id: it.food_catalog_id,
          name: it.name.trim(),
          meal: it.meal,
          quantity: parseFloat(it.quantity) || 0,
          quantity_unit: it.quantity_unit,
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
                    {it.per100 ? (
                      <span className="text-xs text-text-3">
                        {Math.round(m.calories)} cal · {round(m.protein)}p {round(m.carbs)}c {round(m.fat)}f
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
  return (
    <span className="inline-flex items-center gap-0.5">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="!py-0.5 !px-1 w-12 text-[11px]"
        placeholder="0"
      />
      <span className="text-text-3">{label}</span>
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
