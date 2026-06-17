"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import {
  CompoundCatalogItem,
  CompoundProtocol,
  ProtocolCompound,
  DoseLog,
} from "@/types/database";

const supabase = createClient();

// ─── COMPOUND CATALOG ───────────────────────────────────────────────────────
export function useCompoundCatalog(search?: string) {
  return useQuery({
    queryKey: ["compound-catalog", search],
    queryFn: async (): Promise<CompoundCatalogItem[]> => {
      let query = supabase.from("compound_catalog").select("*").order("name");
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddCompound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (compound: Partial<CompoundCatalogItem>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("compound_catalog")
        .insert({ ...compound, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compound-catalog"] }),
  });
}

export function useDeleteCompound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("compound_catalog")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compound-catalog"] }),
  });
}

// ─── PROTOCOLS ──────────────────────────────────────────────────────────────
export function useProtocols() {
  return useQuery({
    queryKey: ["protocols"],
    queryFn: async (): Promise<CompoundProtocol[]> => {
      const { data: protocols, error } = await supabase
        .from("compound_protocols")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch compounds + last dose for each protocol
      const enriched = await Promise.all(
        (protocols || []).map(async (p) => {
          const { data: compounds } = await supabase
            .from("protocol_compounds")
            .select("*")
            .eq("protocol_id", p.id);

          const withDoses = await Promise.all(
            (compounds || []).map(async (c: ProtocolCompound) => {
              const { data: lastDose } = await supabase
                .from("dose_logs")
                .select("*")
                .eq("protocol_id", p.id)
                .eq("compound_name", c.compound_name)
                .order("logged_at", { ascending: false })
                .limit(1)
                .maybeSingle();
              return { ...c, last_dose: lastDose };
            })
          );
          return { ...p, compounds: withDoses };
        })
      );
      return enriched;
    },
  });
}

export function useCreateProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      start_date: string;
      end_date: string | null;
      compounds: Array<{
        compound_catalog_id: string | null;
        compound_name: string;
        compound_unit: string;
        half_life_hours: number | null;
        dose: number;
        frequency: string;
        scheduled_time: string;
      }>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: protocol, error } = await supabase
        .from("compound_protocols")
        .insert({
          user_id: user.id,
          name: payload.name,
          start_date: payload.start_date,
          end_date: payload.end_date,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;

      const compoundRows = payload.compounds.map((c) => ({
        ...c,
        protocol_id: protocol.id,
        user_id: user.id,
      }));
      const { error: cErr } = await supabase
        .from("protocol_compounds")
        .insert(compoundRows);
      if (cErr) throw cErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocols"] }),
  });
}

export function useToggleProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("compound_protocols")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocols"] }),
  });
}

export function useDeleteProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("compound_protocols")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocols"] }),
  });
}

// ─── DOSE LOGS ──────────────────────────────────────────────────────────────
export function useLogDose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dose: Partial<DoseLog>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("dose_logs")
        .insert({ ...dose, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocols"] }),
  });
}

export function useDoseHistory(protocolId: string) {
  return useQuery({
    queryKey: ["dose-history", protocolId],
    queryFn: async (): Promise<DoseLog[]> => {
      const { data, error } = await supabase
        .from("dose_logs")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("logged_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!protocolId,
  });
}
