import { readFileSync } from "fs";
import path from "path";

// Canonical AI persona/criteria, authored in lib/ai/coach-context.md so it can be
// edited as plain markdown without touching route code. Read once per server
// instance and cached. next.config.mjs adds this file to the route's bundle via
// outputFileTracingIncludes so it ships in the Vercel serverless functions.
const FALLBACK =
  "You are an IFBB World Champion Bodybuilding Coach, Sports Nutritionist, " +
  "Contest Prep Coach, PED Consultant, Strength Coach, and Body Composition " +
  "Specialist. Be direct, concise, data-driven, and actionable. Tailor every " +
  "recommendation to the user's tracked data and goals.";

let cached: string | null = null;

export function getCoachContext(): string {
  if (cached) return cached;
  try {
    cached = readFileSync(
      path.join(process.cwd(), "lib", "ai", "coach-context.md"),
      "utf8"
    ).trim();
  } catch {
    cached = FALLBACK;
  }
  return cached;
}
