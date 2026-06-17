"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import { CheckinPhoto } from "@/types/database";

const supabase = createClient();
const BUCKET = "checkins";

export type CheckinView = CheckinPhoto & {
  front_signed: string | null;
  side_signed: string | null;
  back_signed: string | null;
};

export function useCheckins() {
  return useQuery({
    queryKey: ["checkins"],
    queryFn: async (): Promise<CheckinView[]> => {
      const { data: rows, error } = await supabase
        .from("checkin_photos")
        .select("*")
        .order("taken_date", { ascending: true });
      if (error) throw error;

      const paths: string[] = [];
      (rows || []).forEach((r) => {
        [r.front_url, r.side_url, r.back_url].forEach((p) => {
          if (p) paths.push(p);
        });
      });

      const signed: Record<string, string> = {};
      if (paths.length) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
        (data || []).forEach((d) => {
          if (d.path && d.signedUrl) signed[d.path] = d.signedUrl;
        });
      }

      return (rows || []).map((r) => ({
        ...r,
        front_signed: r.front_url ? signed[r.front_url] ?? null : null,
        side_signed: r.side_url ? signed[r.side_url] ?? null : null,
        back_signed: r.back_url ? signed[r.back_url] ?? null : null,
      }));
    },
  });
}

async function uploadOne(file: File, userId: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export type CheckinUpload = {
  taken_date: string;
  weight: number | null;
  body_fat: number | null;
  notes: string | null;
  front?: File | null;
  side?: File | null;
  back?: File | null;
};

export function useAddCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckinUpload) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [front_url, side_url, back_url] = await Promise.all([
        input.front ? uploadOne(input.front, user.id) : Promise.resolve(null),
        input.side ? uploadOne(input.side, user.id) : Promise.resolve(null),
        input.back ? uploadOne(input.back, user.id) : Promise.resolve(null),
      ]);

      const { error } = await supabase.from("checkin_photos").insert({
        user_id: user.id,
        taken_date: input.taken_date,
        weight: input.weight,
        body_fat: input.body_fat,
        notes: input.notes,
        front_url,
        side_url,
        back_url,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}

export type CheckinUpdate = {
  id: string;
  taken_date: string;
  weight: number | null;
  body_fat: number | null;
  notes: string | null;
  // existing stored paths (kept if no replacement)
  front_url: string | null;
  side_url: string | null;
  back_url: string | null;
  // new files replacing the matching slot
  front?: File | null;
  side?: File | null;
  back?: File | null;
};

export function useUpdateCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckinUpdate) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const removePaths: string[] = [];
      async function resolveSlot(file: File | null | undefined, existing: string | null) {
        if (file) {
          const path = await uploadOne(file, user!.id);
          if (existing) removePaths.push(existing);
          return path;
        }
        return existing;
      }

      const [front_url, side_url, back_url] = await Promise.all([
        resolveSlot(input.front, input.front_url),
        resolveSlot(input.side, input.side_url),
        resolveSlot(input.back, input.back_url),
      ]);

      const { error } = await supabase
        .from("checkin_photos")
        .update({
          taken_date: input.taken_date,
          weight: input.weight,
          body_fat: input.body_fat,
          notes: input.notes,
          front_url,
          side_url,
          back_url,
        })
        .eq("id", input.id);
      if (error) throw error;

      if (removePaths.length) await supabase.storage.from(BUCKET).remove(removePaths);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}

export function useDeleteCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: CheckinPhoto) => {
      const paths = [row.front_url, row.side_url, row.back_url].filter(Boolean) as string[];
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      const { error } = await supabase.from("checkin_photos").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}
