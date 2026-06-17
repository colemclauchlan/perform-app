"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import {
  FoodCatalogItem,
  FoodLogEntry,
  Profile,
} from "@/types/database";

const supabase = createClient();

// ─── PROFILE ────────────────────────────────────────────────────────────────
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

// ─── FOOD CATALOG ───────────────────────────────────────────────────────────
export function useFoodCatalog(search?: string) {
  return useQuery({
    queryKey: ["food-catalog", search],
    queryFn: async (): Promise<FoodCatalogItem[]> => {
      let query = supabase.from("food_catalog").select("*").order("name");
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (food: Partial<FoodCatalogItem>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("food_catalog")
        .insert({ ...food, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food-catalog"] }),
  });
}

export function useDeleteFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food-catalog"] }),
  });
}

// ─── FOOD LOG ───────────────────────────────────────────────────────────────
export function useFoodLog(date: string) {
  return useQuery({
    queryKey: ["food-log", date],
    queryFn: async (): Promise<FoodLogEntry[]> => {
      const { data, error } = await supabase
        .from("food_log")
        .select("*")
        .eq("logged_date", date)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

// Get last 7 days of calorie totals
export function useWeeklyCalories() {
  return useQuery({
    queryKey: ["weekly-calories"],
    queryFn: async () => {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      const startISO = start.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("food_log")
        .select("logged_date, calories")
        .gte("logged_date", startISO);
      if (error) throw error;
      // Aggregate by date
      const byDate: Record<string, number> = {};
      (data || []).forEach((row) => {
        byDate[row.logged_date] = (byDate[row.logged_date] || 0) + Number(row.calories);
      });
      const result: { date: string; calories: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        result.push({ date: ds, calories: Math.round(byDate[ds] || 0) });
      }
      return result;
    },
  });
}

export function useAddFoodLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Partial<FoodLogEntry>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("food_log")
        .insert({ ...entry, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food-log"] });
      qc.invalidateQueries({ queryKey: ["weekly-calories"] });
    },
  });
}

export function useDeleteFoodLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food-log"] });
      qc.invalidateQueries({ queryKey: ["weekly-calories"] });
    },
  });
}
