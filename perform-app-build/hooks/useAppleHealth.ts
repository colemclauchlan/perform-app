"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-client";
import {
  requestHealthAuth,
  readDailySteps,
  readDailyWeightKg,
  readDailySleep,
} from "@/lib/health";

// Reads from Apple Health and writes into the same per-user tables the rest of
// the app uses. Steps upsert by day (source apple_health); weight and sleep are
// de-duped against existing dates so re-syncing never creates duplicates.
export function useAppleHealth() {
  const supabase = createClient();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  async function uid(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  async function syncSteps(days = 30): Promise<number> {
    const data = await readDailySteps(days);
    if (!data.length) return 0;
    const user_id = await uid();
    const rows = data.map((d) => ({
      user_id,
      logged_date: d.date,
      step_count: d.steps,
      source: "apple_health" as const,
    }));
    const { error } = await supabase
      .from("step_logs")
      .upsert(rows, { onConflict: "user_id,logged_date" });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["steps"] });
    return rows.length;
  }

  async function syncWeight(days = 90): Promise<number> {
    const data = await readDailyWeightKg(days);
    if (!data.length) return 0;
    const user_id = await uid();
    const { data: existing } = await supabase
      .from("body_weight_logs")
      .select("logged_date");
    const have = new Set((existing ?? []).map((r) => r.logged_date));
    const rows = data
      .filter((d) => !have.has(d.date))
      .map((d) => ({
        user_id,
        weight: d.kg,
        unit: "kg" as const,
        logged_date: d.date,
        notes: "Apple Health",
      }));
    if (!rows.length) return 0;
    const { error } = await supabase.from("body_weight_logs").insert(rows);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["body-weights"] });
    return rows.length;
  }

  async function syncSleep(days = 30): Promise<number> {
    const data = await readDailySleep(days);
    if (!data.length) return 0;
    const user_id = await uid();
    const { data: existing } = await supabase
      .from("sleep_logs")
      .select("logged_date");
    const have = new Set((existing ?? []).map((r) => r.logged_date));
    const rows = data
      .filter((d) => !have.has(d.date))
      .map((d) => ({
        user_id,
        logged_date: d.date,
        sleep_start: d.start,
        sleep_end: d.end,
        duration_hours: d.hours,
      }));
    if (!rows.length) return 0;
    const { error } = await supabase.from("sleep_logs").insert(rows);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["sleep_logs"] });
    return rows.length;
  }

  async function syncAll(): Promise<{
    steps: number;
    weight: number;
    sleep: number;
  }> {
    setSyncing(true);
    try {
      await requestHealthAuth();
      const steps = await syncSteps();
      const weight = await syncWeight();
      const sleep = await syncSleep();
      return { steps, weight, sleep };
    } finally {
      setSyncing(false);
    }
  }

  return { connect: requestHealthAuth, syncSteps, syncWeight, syncSleep, syncAll, syncing };
}
