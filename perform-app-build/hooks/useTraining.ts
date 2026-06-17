"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import {
  ExerciseCatalogItem,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
  TemplateExercise,
  ExerciseFavorite,
  SetType,
  BodyWeightLog,
  StepLog,
} from "@/types/database";
import { epley1RM } from "@/lib/utils";

const supabase = createClient();

export type SetInput = {
  exercise_name: string;
  exercise_catalog_id?: string | null;
  set_number: number;
  position: number;
  reps: string;
  weight: number | null;
  weight_unit: string;
  rpe?: number | null;
  rest_seconds?: number | null;
  set_type?: SetType;
  superset_group?: string | null;
  notes?: string;
};

export type WorkoutInput = {
  name: string;
  session_date: string;
  duration_minutes?: number | null;
  notes?: string | null;
  sets: SetInput[];
};

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

function buildSetRows(sets: SetInput[], sessionId: string, userId: string) {
  return sets.map((s) => ({
    session_id: sessionId,
    user_id: userId,
    exercise_catalog_id: s.exercise_catalog_id ?? null,
    exercise_name: s.exercise_name,
    set_number: s.set_number,
    position: s.position,
    reps: s.reps,
    weight: s.weight,
    weight_unit: s.weight_unit,
    rpe: s.rpe ?? null,
    rest_seconds: s.rest_seconds ?? null,
    set_type: s.set_type ?? "Working",
    superset_group: s.superset_group ?? null,
    e1rm: epley1RM(s.weight, s.reps) || null,
    notes: s.notes ?? null,
  }));
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: WorkoutInput) => {
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
          duration_minutes: payload.duration_minutes ?? null,
          notes: payload.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      const setRows = buildSetRows(payload.sets, session.id, user.id);
      if (setRows.length) {
        const { error: sErr } = await supabase.from("workout_sets").insert(setRows);
        if (sErr) throw sErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["lift-progression"] });
    },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: WorkoutInput }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("workout_sessions")
        .update({
          name: input.name,
          session_date: input.session_date,
          duration_minutes: input.duration_minutes ?? null,
          notes: input.notes ?? null,
        })
        .eq("id", id);
      if (error) throw error;

      await supabase.from("workout_sets").delete().eq("session_id", id);
      const setRows = buildSetRows(input.sets, id, user.id);
      if (setRows.length) {
        const { error: sErr } = await supabase.from("workout_sets").insert(setRows);
        if (sErr) throw sErr;
      }
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

export type LiftEntry = { weight: number; date: string; reps: string; e1rm: number };
export type LiftProgression = {
  name: string;
  unit: string;
  sessions: number;
  pr: number;
  e1rmPR: number;
  bestReps: string;
  latest: number;
  delta: number;
  history: LiftEntry[];
};

// Lift progression — aggregate best & latest per exercise, including e1RM PRs
export function useLiftProgression() {
  return useQuery({
    queryKey: ["lift-progression"],
    queryFn: async (): Promise<LiftProgression[]> => {
      const { data, error } = await supabase
        .from("workout_sets")
        .select("exercise_name, weight, weight_unit, reps, e1rm, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const byExercise: Record<
        string,
        { entries: LiftEntry[]; unit: string }
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
          e1rm: Number(set.e1rm) || epley1RM(set.weight, set.reps),
        });
      });

      return Object.entries(byExercise).map(([name, info]) => {
        const weights = info.entries.map((e) => e.weight);
        const pr = Math.max(...weights);
        const e1rmPR = Math.max(...info.entries.map((e) => e.e1rm));
        const bestSet = info.entries.reduce((a, b) => (b.e1rm > a.e1rm ? b : a));
        const latest = info.entries[info.entries.length - 1];
        const first = info.entries[0];
        return {
          name,
          unit: info.unit,
          sessions: info.entries.length,
          pr,
          e1rmPR,
          bestReps: `${bestSet.weight} x ${bestSet.reps}`,
          latest: latest.weight,
          delta: Math.round((latest.weight - first.weight) * 10) / 10,
          history: info.entries,
        };
      });
    },
  });
}

// ─── WORKOUT TEMPLATES ──────────────────────────────────────────────────────
export function useTemplates() {
  return useQuery({
    queryKey: ["workout-templates"],
    queryFn: async (): Promise<WorkoutTemplate[]> => {
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      name: string;
      notes?: string | null;
      data: TemplateExercise[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (payload.id) {
        const { error } = await supabase
          .from("workout_templates")
          .update({
            name: payload.name,
            notes: payload.notes ?? null,
            data: payload.data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("workout_templates").insert({
          user_id: user.id,
          name: payload.name,
          notes: payload.notes ?? null,
          data: payload.data,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workout-templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workout-templates"] }),
  });
}

// ─── EXERCISE FAVORITES ─────────────────────────────────────────────────────
export function useFavorites() {
  return useQuery({
    queryKey: ["exercise-favorites"],
    queryFn: async (): Promise<ExerciseFavorite[]> => {
      const { data, error } = await supabase.from("exercise_favorites").select("*");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exercise_name, on }: { exercise_name: string; on: boolean }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (on) {
        const { error } = await supabase
          .from("exercise_favorites")
          .insert({ user_id: user.id, exercise_name });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("exercise_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("exercise_name", exercise_name);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercise-favorites"] }),
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
