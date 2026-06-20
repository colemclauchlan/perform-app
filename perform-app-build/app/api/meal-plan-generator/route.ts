import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCoachContext } from "@/lib/ai-context";
import { buildUserContext } from "@/lib/ai-user-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.COACH_MODEL || "claude-sonnet-4-6";

const OUTPUT_RULES = `You are the AI Chef + meal-plan builder inside a fitness tracking app. Build a meal plan tailored to the user's stated goal and their tracked stats (body weight, training, calorie/macro targets and recent intake from the profile context).

Rules:
- CALORIE SCALING IS CRITICAL. The user's daily calorie/macro targets are for a FULL DAY (Breakfast + Lunch + Dinner + a snack). Size this plan to ONLY the meals the user requested — do NOT put a full day's calories into a single meal. Approximate share of the daily total per meal: Breakfast ~25%, Lunch ~30%, Dinner ~35%, Snack ~10%, Pre-workout ~10%, Post-workout ~15%. Sum the shares of the REQUESTED meals and target that fraction of the daily calories and macros. Only when the request covers a full day (all main meals) should the plan reach the full daily targets. The "targets" you return MUST be the total for the SELECTED meals only.
- If the user restricted the plan to specific ingredients, use ONLY those foods/ingredients — do not introduce anything else. If they did not restrict, recommend whatever best fits the goal.
- Build the requested meals only. Hit the protein target first, then calories, then a sensible carb/fat split for the goal.
- Use realistic portion sizes and accurate per-portion macros. Prefer whole, practical foods.

Respond with ONLY a JSON object (no markdown fences, no prose) of exactly this shape:
{
  "name": "<short plan name>",
  "summary": "<2-3 sentence overview of how this plan serves the goal>",
  "targets": { "calories": <int>, "protein": <int>, "carbs": <int>, "fat": <int> },
  "meals": [
    {
      "meal": "<Breakfast|Lunch|Dinner|Snack|Pre-workout|Post-workout>",
      "items": [
        { "name": "<food>", "quantity": <number>, "unit": "<g|oz|cup|serving|ml>", "calories": <int>, "protein": <int>, "carbs": <int>, "fat": <int> }
      ]
    }
  ],
  "notes": "<one short tip — timing, prep, or substitution>"
}
Keep it realistic and specific. Every item needs accurate macros. Do not invent foods outside the user's restriction if one was given.`;

const SYSTEM = `${getCoachContext()}\n\n${OUTPUT_RULES}`;

type Body = {
  goal?: string;
  mode?: "anything" | "restricted";
  ingredients?: string;
  meals?: string;
  notes?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI meal-plan generation is not configured yet. Add an ANTHROPIC_API_KEY to enable it.",
      },
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

  const goal = (body.goal || "").trim();
  if (!goal) {
    return NextResponse.json(
      { error: "Tell the coach your goal so it can build the plan." },
      { status: 400 }
    );
  }
  const mode = body.mode === "restricted" ? "restricted" : "anything";
  const ingredients = (body.ingredients || "").trim();
  if (mode === "restricted" && !ingredients) {
    return NextResponse.json(
      { error: "List the ingredients you want the plan built from." },
      { status: 400 }
    );
  }

  let userContext = "";
  try {
    userContext = await buildUserContext(user.id);
  } catch {
    userContext = "";
  }

  const userMsg = [
    userContext,
    "",
    `GOAL / INTENTION: ${goal}`,
    `MEALS PER DAY: ${body.meals || "Breakfast, Lunch, Dinner, Snack"}`,
    mode === "restricted"
      ? `INGREDIENT RESTRICTION: build the plan using ONLY these foods — ${ingredients}`
      : "INGREDIENTS: no restriction — recommend whatever best fits the goal.",
    body.notes ? `EXTRA PREFERENCES: ${body.notes}` : "",
    "",
    "Build the meal plan now as the JSON object specified.",
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
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Meal-plan service error (${res.status}).`, detail: detail.slice(0, 500) },
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

    let plan: unknown = null;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        plan = JSON.parse(match[0]);
      } catch {
        plan = null;
      }
    }

    if (!plan) {
      return NextResponse.json(
        { error: "Could not parse the generated plan. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ plan });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to reach the meal-plan service.",
        detail: e instanceof Error ? e.message : "",
      },
      { status: 502 }
    );
  }
}
