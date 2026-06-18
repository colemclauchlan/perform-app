"use client";

import { isNative } from "@/lib/native";

// Apple HealthKit wrapper (read). All plugin specifics live here so the rest of
// the app deals only in clean { date, value } arrays. Native-guarded + dynamic
// import → safe to import on web, where every reader returns [].
//
// Uses @perfood/capacitor-healthkit. HealthKit requires native capability +
// Info.plist usage strings, configured on the Mac (see docs/LAUNCH_CHECKLIST.md).

const READ_TYPES = [
  "steps",
  "calories",
  "distance",
  "duration",
  "weight",
  "height",
  "sleep",
];

function localDay(iso: string): string {
  const d = new Date(iso);
  // Local-time YYYY-MM-DD
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function rangeISO(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

async function plugin() {
  const mod = await import("@perfood/capacitor-healthkit");
  return mod.CapacitorHealthkit;
}

export async function isHealthAvailable(): Promise<boolean> {
  return isNative();
}

export async function requestHealthAuth(): Promise<boolean> {
  if (!(await isNative())) return false;
  try {
    const hk = await plugin();
    await hk.requestAuthorization({ all: [""], read: READ_TYPES, write: [""] });
    return true;
  } catch {
    return false;
  }
}

async function query(sampleName: string, days: number): Promise<any[]> {
  if (!(await isNative())) return [];
  try {
    const hk = await plugin();
    const { startDate, endDate } = rangeISO(days);
    const res: any = await hk.queryHKitSampleType({
      sampleName,
      startDate,
      endDate,
      limit: 0,
    });
    return res?.resultData ?? [];
  } catch {
    return [];
  }
}

// Daily step totals.
export async function readDailySteps(
  days = 30
): Promise<{ date: string; steps: number }[]> {
  const rows = await query("stepCount", days);
  const byDay: Record<string, number> = {};
  for (const r of rows) {
    const d = localDay(r.startDate);
    byDay[d] = (byDay[d] || 0) + Number(r.value || 0);
  }
  return Object.entries(byDay).map(([date, steps]) => ({
    date,
    steps: Math.round(steps),
  }));
}

// Latest body-mass reading per day, in kilograms.
export async function readDailyWeightKg(
  days = 90
): Promise<{ date: string; kg: number }[]> {
  const rows = await query("weight", days);
  const latest: Record<string, { ts: number; kg: number }> = {};
  for (const r of rows) {
    const d = localDay(r.startDate);
    const ts = new Date(r.startDate).getTime();
    const kg = Number(r.value || 0);
    if (!kg) continue;
    if (!latest[d] || ts > latest[d].ts) latest[d] = { ts, kg };
  }
  return Object.entries(latest).map(([date, v]) => ({
    date,
    kg: Math.round(v.kg * 10) / 10,
  }));
}

// Sleep aggregated per wake day (duration of "asleep" samples).
export async function readDailySleep(
  days = 30
): Promise<{ date: string; hours: number; start: string; end: string }[]> {
  const rows = await query("sleepAnalysis", days);
  const agg: Record<
    string,
    { ms: number; start: number; end: number }
  > = {};
  for (const r of rows) {
    // value 0 = inBed, 1+ = asleep stages depending on iOS version.
    const asleep = Number(r.value) >= 1;
    if (!asleep) continue;
    const startMs = new Date(r.startDate).getTime();
    const endMs = new Date(r.endDate).getTime();
    if (!(endMs > startMs)) continue;
    const d = localDay(r.endDate);
    if (!agg[d]) agg[d] = { ms: 0, start: startMs, end: endMs };
    agg[d].ms += endMs - startMs;
    agg[d].start = Math.min(agg[d].start, startMs);
    agg[d].end = Math.max(agg[d].end, endMs);
  }
  return Object.entries(agg).map(([date, v]) => ({
    date,
    hours: Math.round((v.ms / 3_600_000) * 10) / 10,
    start: new Date(v.start).toISOString(),
    end: new Date(v.end).toISOString(),
  }));
}
