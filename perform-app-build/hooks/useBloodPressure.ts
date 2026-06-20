"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import { BloodPressureLog } from "@/types/database";

const supabase = createClient();

export type BPInput = {
  systolic: number;
  diastolic: number;
  pulse: number | null;
  logged_at: string;
  notes: string | null;
};

export function useBloodPressure() {
  return useQuery({
    queryKey: ["blood-pressure"],
    queryFn: async (): Promise<BloodPressureLog[]> => {
      const { data, error } = await supabase
        .from("blood_pressure_logs")
        .select("*")
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return (data || []) as BloodPressureLog[];
    },
  });
}

export function useAddBloodPressure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BPInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("blood_pressure_logs").insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blood-pressure"] }),
  });
}

export function useDeleteBloodPressure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blood_pressure_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blood-pressure"] }),
  });
}
