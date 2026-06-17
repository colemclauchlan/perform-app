import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MODEL = process.env.COACH_MODEL || "claude-sonnet-4-6";

function num(n: unknown): number {
  return Number(n) || 0;
}

async function buildContext(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [{ data: profile }, { data: sessions }, { data: protocols }, { data: foodToday }, { data: weights }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("workout_sessions")
        .select("name, session_date")
        .order("session_date", { ascending: false })
        .limit(6),
      supabase.from("compound_protocols").select("name, is_active, start_date, end_date").eq("is_active", true),
      supabase.from("food_log").select("calories, protein, carbs, fat").eq("logged_date", today),
      supabase.from("body_weight_logs").select("weight, unit, logged_date").order("logged_date", { ascending: false }).limit(1),
    ]);

  const { data: weekSets } = await supabase
    .from("workout_sets")
    .select("exercise_name, weight, reps, e1rm, weight_unit, created_at")
    .gte("created_at", `${weekAgo}T00:00:00`)
    .order("e1rm", { ascending: false })
    .limit(40);

  const macroTotals = (foodToday || []).reduce(
    (a, f) => ({
      cal: a.cal + num(f.calories),
      p: a.p + num(f.protein),
      c: a.c + num(f.carbs),
      ff: a.ff + num(f.fat),
    }),
    { cal: 0, p: 0, c: 0, ff: 0 }
  );

  // best e1rm per lift this week
  const bestByLift: Record<string, { e1rm: number; unit: string }> = {};
  (weekSets || []).forEach((s) => {
    const e = num(s.e1rm);
    if (!bestByLift[s.exercise_name] || e > bestByLift[s.exercise_name].e1rm) {
      bestByLift[s.exercise_name] = { e1rm: e, unit: s.weight_unit };
    }
  });
  const topLifts = Object.entries(bestByLift)
    .sort((a, b) => b[1].e1rm - a[1].e1rm)
    .slice(0, 6)
    .map(([n, v]) => `${n}: ~${v.e1rm}${v.unit} e1RM`)
    .join("; ");

  const wu = profile?.weight_unit || "lbs";
  const latestW = weights?.[0];

  const lines: string[] = ["The user's current tracked data:"];
  if (profile) {
    lines.push(
      `- Targets: ${profile.target_calories} kcal, ${profile.target_protein}g protein, ${profile.target_carbs}g carbs, ${profile.target_fat}g fat. Preferred weight unit: ${wu}.`
    );
  }
  if (latestW) lines.push(`- Latest body weight: ${latestW.weight} ${latestW.unit} (${latestW.logged_date}).`);
  lines.push(
    `- Today's intake so far: ${Math.round(macroTotals.cal)} kcal, ${Math.round(macroTotals.p)}g protein, ${Math.round(
      macroTotals.c
    )}g carbs, ${Math.round(macroTotals.ff)}g fat.`
  );
  if (sessions?.length) {
    lines.push(`- Recent workouts: ${sessions.map((s) => `${s.name} (${s.session_date})`).join(", ")}.`);
  } else {
    lines.push("- No workouts logged yet.");
  }
  if (topLifts) lines.push(`- Top lifts in the last 7 days: ${topLifts}.`);
  if (protocols?.length) {
    lines.push(`- Active protocols: ${protocols.map((p) => p.name).join(", ")}.`);
  }
  return lines.join("\n");
}

const SYSTEM_BASE = `You are BodyTracker's built-in AI coach: an expert, no-nonsense strength, hypertrophy, and nutrition coach embedded in the user's fitness tracking app.

Guidelines:
- Be concise, practical, and specific. Prefer actionable steps, concrete numbers, and short paragraphs or tight bullet lists.
- Reference the user's tracked data when it is relevant (lifts, macros, body weight, protocols).
- For training: give programming, progression, technique, and recovery advice grounded in evidence.
- For nutrition: work from their macro targets; suggest foods and adjustments.
- The app also tracks performance-enhancing compounds and peptides. You may discuss dosing protocols, half-lives, timing, and bloodwork from a harm-reduction, educational standpoint. Always note you are not a doctor and recommend medical supervision and regular bloodwork. Never encourage unsafe or illegal use, and refuse clearly dangerous requests.
- If you lack data to answer well, say what to log so future advice is better.
- Use markdown for structure when helpful.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI Coach is not configured yet. Add an ANTHROPIC_API_KEY to enable it." },
      { status: 503 }
    );
  }

  // Require an authenticated user (defense in depth — also avoids abuse of the
  // shared Anthropic key by unauthenticated callers).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = (body.messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-16);
  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  let context = "";
  try {
    context = await buildContext();
  } catch {
    context = "";
  }

  const system = context ? `${SYSTEM_BASE}\n\n${context}` : SYSTEM_BASE;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Coach service error (${res.status}).`, detail: detail.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply =
      Array.isArray(data?.content)
        ? data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n")
        : "";

    return NextResponse.json({ reply: reply || "(no response)" });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reach the coach service.", detail: e instanceof Error ? e.message : "" },
      { status: 502 }
    );
  }
}
