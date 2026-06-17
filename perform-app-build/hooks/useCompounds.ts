"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import {
  CompoundCatalogItem,
  CompoundProtocol,
  ProtocolCompound,
  DoseLog,
  CompoundType,
} from "@/types/database";

const supabase = createClient();

// ─── FAVORITES (stored in profiles.preferences.favorite_compounds) ──────────
export function useFavoriteCompounds() {
  return useQuery({
    queryKey: ["favorite-compounds"],
    queryFn: async (): Promise<string[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();
      return (data?.preferences?.favorite_compounds as string[] | undefined) ?? [];
    },
  });
}

export function useToggleFavoriteCompound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (catalogId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();
      const prefs = data?.preferences ?? {};
      const favs: string[] = prefs.favorite_compounds ?? [];
      const next = favs.includes(catalogId)
        ? favs.filter((x) => x !== catalogId)
        : [...favs, catalogId];
      const { error } = await supabase
        .from("profiles")
        .update({ preferences: { ...prefs, favorite_compounds: next } })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorite-compounds"] }),
  });
}

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocols"] });
      qc.invalidateQueries({ queryKey: ["all-doses"] });
      qc.invalidateQueries({ queryKey: ["dose-history"] });
    },
  });
}

export function useUpdateDose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<DoseLog>) => {
      const { error } = await supabase
        .from("dose_logs")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocols"] });
      qc.invalidateQueries({ queryKey: ["all-doses"] });
      qc.invalidateQueries({ queryKey: ["dose-history"] });
    },
  });
}

export function useDeleteDose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dose_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocols"] });
      qc.invalidateQueries({ queryKey: ["all-doses"] });
      qc.invalidateQueries({ queryKey: ["dose-history"] });
    },
  });
}

export type EnrichedDose = DoseLog & {
  compound_type: CompoundType | null;
  half_life_hours: number | null;
};

// All dose logs for the user, enriched with compound type + half-life so we can
// model blood concentration over time (used by the weight chart overlay).
export function useAllDoses() {
  return useQuery({
    queryKey: ["all-doses"],
    queryFn: async (): Promise<EnrichedDose[]> => {
      const { data: doses, error } = await supabase
        .from("dose_logs")
        .select("*")
        .order("logged_at", { ascending: true });
      if (error) throw error;
      if (!doses?.length) return [];

      const [{ data: catalog }, { data: pcs }] = await Promise.all([
        supabase.from("compound_catalog").select("name,type,half_life_hours"),
        supabase.from("protocol_compounds").select("id,half_life_hours,compound_name"),
      ]);

      const typeByName = new Map<string, CompoundType>();
      const halfByName = new Map<string, number | null>();
      (catalog || []).forEach((c: { name: string; type: CompoundType; half_life_hours: number | null }) => {
        typeByName.set(c.name.toLowerCase(), c.type);
        halfByName.set(c.name.toLowerCase(), c.half_life_hours);
      });
      const halfByPc = new Map<string, number | null>();
      (pcs || []).forEach((p: { id: string; half_life_hours: number | null; compound_name: string }) => {
        halfByPc.set(p.id, p.half_life_hours);
      });

      return (doses as DoseLog[]).map((d) => ({
        ...d,
        compound_type: typeByName.get(d.compound_name.toLowerCase()) ?? null,
        half_life_hours:
          (d.protocol_compound_id ? halfByPc.get(d.protocol_compound_id) : null) ??
          halfByName.get(d.compound_name.toLowerCase()) ??
          null,
      }));
    },
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
