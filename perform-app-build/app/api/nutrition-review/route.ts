import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.COACH_MODEL || "claude-sonnet-4-6";

type ReviewItem = {
  name: string;
  meal: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type ReviewPlan = {
  name: string;
  meal_type: string;
  notes?: string | null;
  items: ReviewItem[];
};

function num(n: unknown): number {
  return Number(n) || 0;
}

const SYSTEM = `You are an expert sports-nutrition coach reviewing a single saved meal plan inside a fitness tracking app.

Critique the plan against the user's macro targets and sound nutrition principles (protein adequacy, fiber/micronutrient quality, meal balance, sugar/processed load, food variety, practicality).

Respond with ONLY a JSON object (no markdown fences, no prose around it) of exactly this shape:
{
  "rating": <integer 1-10>,
  "grade": "<letter grade A+ … F>",
  "headline": "<one punchy sentence verdict>",
  "summary": "<2-3 sentence overview>",
  "strengths": ["<short bullet>", ...],
  "improvements": ["<short, specific, actionable bullet>", ...],
  "macro_balance": "<one sentence on how the macros line up vs the user's targets>"
}
Keep bullets concise. Be honest and specific; do not invent foods that are not in the plan.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI Nutritionist Review is not configured yet. Add an ANTHROPIC_API_KEY to enable it.",
      },
      { status: 503 }
    );
  }

  let body: { plan?: ReviewPlan };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const plan = body.plan;
  if (!plan || !Array.isArray(plan.items) || plan.items.length === 0) {
    return NextResponse.json(
      { error: "A meal plan with at least one food is required." },
      { status: 400 }
    );
  }

  const totals = plan.items.reduce(
    (a, it) => ({
      cal: a.cal + num(it.calories),
      p: a.p + num(it.protein),
      c: a.c + num(it.carbs),
      f: a.f + num(it.fat),
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  // Pull the user's targets for context (best-effort).
  let targetLine = "";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "target_calories, target_protein, target_carbs, target_fat"
        )
        .eq("id", user.id)
        .single();
      if (profile) {
        targetLine = `User's daily targets: ${num(profile.target_calories)} kcal, ${num(
          profile.target_protein
        )}g protein, ${num(profile.target_carbs)}g carbs, ${num(
          profile.target_fat
        )}g fat.`;
      }
    }
  } catch {
    targetLine = "";
  }

  const itemLines = plan.items
    .map(
      (it) =>
        `- ${it.name} (${it.meal}, ${num(it.quantity)}${it.unit}): ${Math.round(
          num(it.calories)
        )} kcal, ${Math.round(num(it.protein))}p / ${Math.round(
          num(it.carbs)
        )}c / ${Math.round(num(it.fat))}f`
    )
    .join("\n");

  const userMsg = [
    `Meal plan: "${plan.name}" (type: ${plan.meal_type}).`,
    plan.notes ? `Notes: ${plan.notes}` : "",
    targetLine,
    `Plan totals: ${Math.round(totals.cal)} kcal, ${Math.round(
      totals.p
    )}g protein, ${Math.round(totals.c)}g carbs, ${Math.round(totals.f)}g fat.`,
    "",
    "Foods:",
    itemLines,
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
        max_tokens: 1000,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Review service error (${res.status}).`, detail: detail.slice(0, 500) },
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

    // Parse the JSON the model returned (tolerate stray fences/prose).
    let review: unknown = null;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        review = JSON.parse(match[0]);
      } catch {
        review = null;
      }
    }

    if (!review) {
      return NextResponse.json(
        { error: "Could not parse the review. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      review,
      totals: {
        calories: Math.round(totals.cal),
        protein: Math.round(totals.p),
        carbs: Math.round(totals.c),
        fat: Math.round(totals.f),
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Failed to reach the review service.",
        detail: e instanceof Error ? e.message : "",
      },
      { status: 502 }
    );
  }
}
