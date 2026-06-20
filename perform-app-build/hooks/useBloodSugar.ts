"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import { BloodSugarLog } from "@/types/database";

const supabase = createClient();

export type SugarInput = {
  value: number;
  fasted: boolean;
  logged_at: string;
  notes: string | null;
};

export function useBloodSugar() {
  return useQuery({
    queryKey: ["blood-sugar"],
    queryFn: async (): Promise<BloodSugarLog[]> => {
      const { data, error } = await supabase
        .from("blood_sugar_logs")
        .select("*")
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return (data || []) as BloodSugarLog[];
    },
  });
}

export function useAddBloodSugar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SugarInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("blood_sugar_logs").insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blood-sugar"] }),
  });
}

export function useDeleteBloodSugar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blood_sugar_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blood-sugar"] }),
  });
}
