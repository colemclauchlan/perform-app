import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCoachContext } from "@/lib/ai-context";
import { buildUserContext } from "@/lib/ai-user-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.COACH_MODEL || "claude-sonnet-4-6";

const OUTPUT_RULES = `You are an elite strength & physique coach building a training program inside a fitness app. Design a program that matches the requested split, weekly day count, goal, and experience level, tailored to the user's tracked lifts and body data from the context.

Rules:
- Honor the requested split and any muscle-group emphasis. Balance weekly volume; don't stack heavy work on the same muscle without recovery.
- Fit exercise selection to the stated equipment (default: full commercial gym). Order compounds before isolation. Give concrete set counts and rep ranges appropriate to the goal (strength 3-6 reps, hypertrophy 6-12, endurance 12-20).
- Use real, common exercise names. Typically 4-7 exercises per training day. Produce exactly the requested number of days.

Respond with ONLY a JSON object (no markdown fences, no prose) of exactly this shape:
{
  "name": "<program name>",
  "summary": "<2-3 sentence overview of the program and how it serves the goal>",
  "days": [
    {
      "day": "<e.g. Day 1 — Push>",
      "focus": "<muscles trained>",
      "exercises": [
        { "name": "<exercise>", "muscle_group": "<primary muscle>", "sets": <int>, "reps": "<e.g. 6-8>", "notes": "<short cue, may be empty>" }
      ]
    }
  ],
  "notes": "<weekly progression scheme + a cardio/conditioning note>"
}
Be specific and realistic. The number of day objects MUST equal the requested days per week.`;

const SYSTEM = `${getCoachContext()}\n\n${OUTPUT_RULES}`;

type Body = {
  split?: string;
  focus?: string;
  days?: number;
  goal?: string;
  experience?: string;
  equipment?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI workout generation is not configured yet. Add an ANTHROPIC_API_KEY to enable it." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const split = (body.split || "").trim();
  if (!split) {
    return NextResponse.json({ error: "Pick a training split." }, { status: 400 });
  }
  const days = Math.min(7, Math.max(1, Number(body.days) || 4));

  let userContext = "";
  try {
    userContext = await buildUserContext(user.id);
  } catch {
    userContext = "";
  }

  const userMsg = [
    userContext,
    "",
    `SPLIT: ${split}`,
    `DAYS PER WEEK: ${days}`,
    `GOAL: ${body.goal || "Hypertrophy"}`,
    `EXPERIENCE: ${body.experience || "Intermediate"}`,
    `EQUIPMENT: ${body.equipment || "Full commercial gym"}`,
    body.focus ? `EMPHASIS / MUSCLE FOCUS: ${body.focus}` : "",
    "",
    "Build the program now as the JSON object specified.",
  ]
    .filter(Boolean)
    .join("\n");

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
        max_tokens: 3000,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Workout service error (${res.status}).`, detail: detail.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text: string = Array.isArray(data?.content)
      ? data.content
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n")
      : "";

    let program: unknown = null;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        program = JSON.parse(match[0]);
      } catch {
        program = null;
      }
    }

    if (!program) {
      return NextResponse.json(
        { error: "Could not parse the generated program. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ program });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reach the workout service.", detail: e instanceof Error ? e.message : "" },
      { status: 502 }
    );
  }
}
