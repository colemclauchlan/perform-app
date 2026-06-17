"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import {
  ExerciseCatalogItem,
  WorkoutSession,
  WorkoutSet,
  BodyWeightLog,
  StepLog,
} from "@/types/database";

const supabase = createClient();

// ─── EXERCISE CATALOG ───────────────────────────────────────────────────────
export function useExercises(search?: string) {
  return useQuery({
    queryKey: ["exercises", search],
    queryFn: async (): Promise<ExerciseCatalogItem[]> => {
      let query = supabase.from("exercise_catalog").select("*").order("name");
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ex: Partial<ExerciseCatalogItem>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("exercise_catalog")
        .insert({ ...ex, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("exercise_catalog")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

// ─── WORKOUT SESSIONS ───────────────────────────────────────────────────────
export function useWorkouts() {
  return useQuery({
    queryKey: ["workouts"],
    queryFn: async (): Promise<WorkoutSession[]> => {
      const { data: sessions, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .order("session_date", { ascending: false });
      if (error) throw error;

      const enriched = await Promise.all(
        (sessions || []).map(async (s) => {
          const { data: sets } = await supabase
            .from("workout_sets")
            .select("*")
            .eq("session_id", s.id)
            .order("set_number");
          return { ...s, sets: sets || [] };
        })
      );
      return enriched;
    },
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      session_date: string;
      sets: Array<{
        exercise_name: string;
        set_number: number;
        reps: string;
        weight: number;
        weight_unit: string;
        notes: string;
      }>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: session, error } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: user.id,
          name: payload.name,
          session_date: payload.session_date,
        })
        .select()
        .single();
      if (error) throw error;

      const setRows = payload.sets.map((s) => ({
        ...s,
        session_id: session.id,
        user_id: user.id,
      }));
      const { error: sErr } = await supabase.from("workout_sets").insert(setRows);
      if (sErr) throw sErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["lift-progression"] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workout_sessions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["lift-progression"] });
    },
  });
}

// Lift progression — aggregate best & latest per exercise
export function useLiftProgression() {
  return useQuery({
    queryKey: ["lift-progression"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_name, weight, weight_unit, reps, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const byExercise: Record<
        string,
        { entries: { weight: number; date: string; reps: string }[]; unit: string }
      > = {};
      (data || []).forEach((set) => {
        if (set.weight == null) return;
        if (!byExercise[set.exercise_name]) {
          byExercise[set.exercise_name] = { entries: [], unit: set.weight_unit };
        }
        byExercise[set.exercise_name].entries.push({
          weight: Number(set.weight),
          date: set.created_at,
          reps: set.reps || "",
        });
      });

      return Object.entries(byExercise).map(([name, info]) => {
        const weights = info.entries.map((e) => e.weight);
        const pr = Math.max(...weights);
        const latest = info.entries[info.entries.length - 1];
        const first = info.entries[0];
        return {
          name,
          unit: info.unit,
          sessions: info.entries.length,
          pr,
          latest: latest.weight,
          delta: Math.round((latest.weight - first.weight) * 10) / 10,
          history: info.entries,
        };
      });
    },
  });
}

// ─── BODY WEIGHT ────────────────────────────────────────────────────────────
export function useBodyWeights() {
  return useQuery({
    queryKey: ["body-weights"],
    queryFn: async (): Promise<BodyWeightLog[]> => {
      const { data, error } = await supabase
        .from("body_weight_logs")
        .select("*")
        .order("logged_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddBodyWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Partial<BodyWeightLog>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("body_weight_logs")
        .insert({ ...entry, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body-weights"] }),
  });
}

export function useDeleteBodyWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("body_weight_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body-weights"] }),
  });
}

// ─── STEPS ──────────────────────────────────────────────────────────────────
export function useSteps() {
  return useQuery({
    queryKey: ["steps"],
    queryFn: async (): Promise<StepLog[]> => {
      const { data, error } = await supabase
        .from("step_logs")
        .select("*")
        .order("logged_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      logged_date: string;
      step_count: number;
      source?: "apple_health" | "manual";
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("step_logs").upsert(
        {
          user_id: user.id,
          logged_date: entry.logged_date,
          step_count: entry.step_count,
          source: entry.source || "manual",
        },
        { onConflict: "user_id,logged_date" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["steps"] }),
  });
}
