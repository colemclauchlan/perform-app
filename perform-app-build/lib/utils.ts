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
