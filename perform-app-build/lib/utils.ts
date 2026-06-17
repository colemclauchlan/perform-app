import { Frequency } from "@/types/database";

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[+m - 1]} ${+d}, ${y}`;
}

export function round(n: number, places = 1): number {
  const factor = Math.pow(10, places);
  return Math.round(n * factor) / factor;
}

// Estimated 1-rep max (Epley). Parses rep strings like "8-12" / "AMRAP" loosely.
export function epley1RM(weight: number | null, reps: string | number | null): number {
  const w = Number(weight) || 0;
  let r: number;
  if (typeof reps === "number") r = reps;
  else {
    const m = String(reps || "").match(/\d+/);
    r = m ? parseInt(m[0], 10) : 0;
  }
  if (w <= 0 || r <= 0) return 0;
  if (r === 1) return w;
  return round(w * (1 + r / 30));
}

export function parseReps(reps: string | null): number {
  const m = String(reps || "").match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

export function formatRelativeDays(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Muscle group → accent color, shared across workout + exercise library.
export const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#2563eb",
  Back: "#22d3a5",
  Shoulders: "#f6ad55",
  Biceps: "#a78bfa",
  Triceps: "#fc8181",
  Forearms: "#c084fc",
  Legs: "#34d399",
  Quads: "#34d399",
  Hamstrings: "#10b981",
  Glutes: "#fb923c",
  Calves: "#4ade80",
  Core: "#60a5fa",
  Abs: "#60a5fa",
  "Full Body": "#818cf8",
  Cardio: "#e879f9",
  Other: "#94a3b8",
};

export function muscleColor(muscle: string | null | undefined): string {
  return MUSCLE_COLORS[muscle || "Other"] || MUSCLE_COLORS.Other;
}

// Frequency to hours between doses
export const FREQUENCY_HOURS: Record<Frequency, number> = {
  Daily: 24,
  EOD: 48,
  E3D: 72,
  "Twice/week": 84,
  Weekly: 168,
  "Twice/day": 12,
};

// Compute next dose timing
export function getNextDoseInfo(
  lastDoseISO: string | null,
  frequency: Frequency
): { label: string; status: "ok" | "urgent" | "overdue" | "none" } {
  if (!lastDoseISO) return { label: "No doses logged", status: "none" };
  const hours = FREQUENCY_HOURS[frequency] || 24;
  const next = new Date(lastDoseISO);
  next.setHours(next.getHours() + hours);
  const diff = next.getTime() - Date.now();
  const hrs = Math.floor(Math.abs(diff) / 3600000);
  const mins = Math.floor((Math.abs(diff) % 3600000) / 60000);
  if (diff < 0) {
    return { label: `Overdue ${hrs}h ${mins}m`, status: "overdue" };
  }
  if (hrs < 4) {
    return { label: `${hrs}h ${mins}m`, status: "urgent" };
  }
  if (hrs < 24) {
    return { label: `${hrs}h ${mins}m`, status: "ok" };
  }
  const days = Math.floor(hrs / 24);
  return { label: `${days}d ${hrs % 24}h`, status: "ok" };
}

// Compute macro totals from a quantity given per-100g values
export function computeMacros(
  per100: { calories: number; protein: number; carbs: number; fat: number },
  quantity: number,
  unit: string
): { calories: number; protein: number; carbs: number; fat: number } {
  let mult: number;
  switch (unit) {
    case "oz":
      mult = (quantity * 28.35) / 100;
      break;
    case "cup":
      mult = (quantity * 240) / 100;
      break;
    case "serving":
      mult = quantity;
      break;
    default: // grams
      mult = quantity / 100;
  }
  return {
    calories: round(per100.calories * mult),
    protein: round(per100.protein * mult),
    carbs: round(per100.carbs * mult),
    fat: round(per100.fat * mult),
  };
}
