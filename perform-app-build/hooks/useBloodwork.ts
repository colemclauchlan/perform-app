"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import { BloodworkEntry, BloodworkMarker } from "@/types/database";

const supabase = createClient();

export type MarkerInput = Omit<
  BloodworkMarker,
  "id" | "entry_id" | "user_id" | "created_at"
>;

export interface EntryInput {
  drawn_date: string;
  lab_name: string | null;
  notes: string | null;
  markers: MarkerInput[];
}

// ─── ENTRIES (with markers joined) ──────────────────────────────────────────
export function useBloodwork() {
  return useQuery({
    queryKey: ["bloodwork"],
    queryFn: async (): Promise<BloodworkEntry[]> => {
      const { data, error } = await supabase
        .from("bloodwork_entries")
        .select("*, markers:bloodwork_markers(*)")
        .order("drawn_date", { ascending: true });
      if (error) throw error;
      return (data || []) as BloodworkEntry[];
    },
  });
}

export function useAddBloodwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EntryInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: entry, error: entryErr } = await supabase
        .from("bloodwork_entries")
        .insert({
          user_id: user.id,
          drawn_date: input.drawn_date,
          lab_name: input.lab_name,
          notes: input.notes,
        })
        .select()
        .single();
      if (entryErr) throw entryErr;

      if (input.markers.length) {
        const rows = input.markers.map((m) => ({
          ...m,
          entry_id: entry.id,
          user_id: user.id,
        }));
        const { error: markerErr } = await supabase
          .from("bloodwork_markers")
          .insert(rows);
        if (markerErr) throw markerErr;
      }
      return entry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bloodwork"] }),
  });
}

export function useUpdateBloodwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: EntryInput }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updErr } = await supabase
        .from("bloodwork_entries")
        .update({
          drawn_date: input.drawn_date,
          lab_name: input.lab_name,
          notes: input.notes,
        })
        .eq("id", id);
      if (updErr) throw updErr;

      // replace markers
      const { error: delErr } = await supabase
        .from("bloodwork_markers")
        .delete()
        .eq("entry_id", id);
      if (delErr) throw delErr;

      if (input.markers.length) {
        const rows = input.markers.map((m) => ({
          ...m,
          entry_id: id,
          user_id: user.id,
        }));
        const { error: insErr } = await supabase
          .from("bloodwork_markers")
          .insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bloodwork"] }),
  });
}

export function useDeleteBloodwork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bloodwork_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bloodwork"] }),
  });
}
