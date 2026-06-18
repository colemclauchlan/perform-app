"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import { BodyMeasurement, HydrationLog, SleepLog } from "@/types/database";
import { localISO } from "@/lib/utils";

// ─── BODY MEASUREMENTS ────────────────────────────────────────────────────────
export function useBodyMeasurements() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["body_measurements"],
    queryFn: async (): Promise<BodyMeasurement[]> => {
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .order("logged_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddBodyMeasurement() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<BodyMeasurement>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("body_measurements").insert({ ...m, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body_measurements"] }),
  });
}

export function useUpdateBodyMeasurement() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BodyMeasurement> }) => {
      const { error } = await supabase.from("body_measurements").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body_measurements"] }),
  });
}

export function useDeleteBodyMeasurement() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("body_measurements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body_measurements"] }),
  });
}

// ─── HYDRATION ────────────────────────────────────────────────────────────────
export function useHydrationLogs(date?: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["hydration_logs", date],
    queryFn: async (): Promise<HydrationLog[]> => {
      let q = supabase.from("hydration_logs").select("*").order("created_at", { ascending: true });
      if (date) q = q.eq("logged_date", date);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddHydration() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<HydrationLog>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("hydration_logs").insert({ ...log, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hydration_logs"] });
      qc.invalidateQueries({ queryKey: ["weekly_hydration"] });
    },
  });
}

export function useUpdateHydration() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HydrationLog> }) => {
      const { error } = await supabase.from("hydration_logs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hydration_logs"] });
      qc.invalidateQueries({ queryKey: ["weekly_hydration"] });
    },
  });
}

export function useDeleteHydration() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hydration_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hydration_logs"] });
      qc.invalidateQueries({ queryKey: ["weekly_hydration"] });
    },
  });
}

export function useWeeklyHydration() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["weekly_hydration"],
    queryFn: async (): Promise<{ date: string; total_ml: number }[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      const { data, error } = await supabase
        .from("hydration_logs")
        .select("logged_date, amount_ml")
        .gte("logged_date", localISO(since))
        .order("logged_date");
      if (error) throw error;
      const grouped: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        grouped[r.logged_date] = (grouped[r.logged_date] || 0) + r.amount_ml;
      });
      return Object.entries(grouped).map(([date, total_ml]) => ({ date, total_ml }));
    },
  });
}

// ─── SLEEP ───────────────────────────────────────────────────────────────────
export function useSleepLogs() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["sleep_logs"],
    queryFn: async (): Promise<SleepLog[]> => {
      const { data, error } = await supabase
        .from("sleep_logs")
        .select("*")
        .order("logged_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddSleepLog() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<SleepLog>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("sleep_logs").insert({ ...log, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep_logs"] }),
  });
}

export function useUpdateSleepLog() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SleepLog> }) => {
      const { error } = await supabase.from("sleep_logs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep_logs"] }),
  });
}

export function useDeleteSleepLog() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sleep_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep_logs"] }),
  });
}
