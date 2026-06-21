"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import { MealPlan, MealPlanItem, MealType } from "@/types/database";

const supabase = createClient();

export type PlanItemInput = Omit<
  MealPlanItem,
  "id" | "meal_plan_id" | "user_id" | "created_at"
>;

export type MealPlanInput = {
  name: string;
  meal_type: MealPlan["meal_type"];
  notes: string | null;
  meal_labels?: Record<string, string>;
  items: PlanItemInput[];
};

export function useMealPlans() {
  return useQuery({
    queryKey: ["meal-plans"],
    queryFn: async (): Promise<MealPlan[]> => {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*, items:meal_plan_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSaveMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: MealPlanInput }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let planId = id;
      if (id) {
        const { error } = await supabase
          .from("meal_plans")
          .update({
            name: input.name,
            meal_type: input.meal_type,
            notes: input.notes,
            meal_labels: input.meal_labels ?? {},
          })
          .eq("id", id);
        if (error) throw error;
        await supabase.from("meal_plan_items").delete().eq("meal_plan_id", id);
      } else {
        const { data, error } = await supabase
          .from("meal_plans")
          .insert({
            user_id: user.id,
            name: input.name,
            meal_type: input.meal_type,
            notes: input.notes,
            meal_labels: input.meal_labels ?? {},
          })
          .select()
          .single();
        if (error) throw error;
        planId = data.id;
      }

      if (input.items.length) {
        const rows = input.items.map((it) => ({
          ...it,
          meal_plan_id: planId,
          user_id: user.id,
        }));
        const { error: iErr } = await supabase.from("meal_plan_items").insert(rows);
        if (iErr) throw iErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal-plans"] }),
  });
}

export function useDeleteMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal-plans"] }),
  });
}

// Update just the custom meal-group labels of a Full Day plan.
export function useUpdatePlanMealLabels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, meal_labels }: { id: string; meal_labels: Record<string, string> }) => {
      const { error } = await supabase.from("meal_plans").update({ meal_labels }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meal-plans"] }),
  });
}

// Add every item of a plan to a day's food log.
export function useAddPlanToLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ plan, date, multiplier = 1 }: { plan: MealPlan; date: string; multiplier?: number }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const items = plan.items || [];
      if (!items.length) throw new Error("This plan has no foods yet");
      const m = multiplier || 1;
      const rows = items.map((it) => ({
        user_id: user.id,
        food_catalog_id: it.food_catalog_id,
        name: it.name,
        meal: it.meal as MealType,
        logged_date: date,
        quantity: Number(it.quantity) * m,
        quantity_unit: it.quantity_unit,
        calories: Number(it.calories) * m,
        protein: Number(it.protein) * m,
        carbs: Number(it.carbs) * m,
        fat: Number(it.fat) * m,
      }));
      const { error } = await supabase.from("food_log").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food-log"] });
      qc.invalidateQueries({ queryKey: ["weekly-calories"] });
      qc.invalidateQueries({ queryKey: ["weekly-macros"] });
    },
  });
}
