import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCoachContext } from "@/lib/ai-context";
import { buildUserContext } from "@/lib/ai-user-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.COACH_MODEL || "claude-sonnet-4-6";

type Marker = {
  marker: string;
  value: number | null;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  category?: string | null;
  flag?: string | null;
};

const OUTPUT_RULES = `You are analyzing a single blood panel inside a health/fitness tracking app, for an athlete who may be natural or enhanced. Interpret every marker in the context of the user's profile (sex, body composition, training, and any active compound/PED protocols supplied in the context).

For each out-of-range, borderline, or notably suboptimal marker, explain in plain language what it means and the likely drivers given the user's context (e.g. anabolic effects on lipids / hematocrit / HPTA, hydration, training load, liver or kidney stress). Distinguish "in range" from "optimal for an athlete" where relevant.

Respond with ONLY a JSON object (no markdown fences, no prose around it) of exactly this shape:
{
  "headline": "<one-line verdict>",
  "summary": "<2-4 sentence overview of the panel>",
  "flagged": [
    { "marker": "<name>", "value": "<value + unit>", "status": "high|low|borderline|optimal", "note": "<plain-language meaning + likely driver>" }
  ],
  "optimize": ["<specific, actionable, safety-first bullet>", ...],
  "retest": "<what and roughly when to retest>",
  "disclaimer": "Educational only — not medical advice. Consult a physician and get regular bloodwork."
}
Only include markers that genuinely warrant attention in "flagged" (out of range, borderline, or clearly suboptimal). Be specific, honest, and safety-first. NEVER give compound dosing instructions.`;

const SYSTEM = `${getCoachContext()}\n\n${OUTPUT_RULES}`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI bloodwork analysis is not configured yet. Add an ANTHROPIC_API_KEY to enable it." },
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

  let body: { entry?: { drawn_date?: string; lab_name?: string | null; markers?: Marker[] } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const entry = body.entry;
  if (!entry || !Array.isArray(entry.markers) || entry.markers.length === 0) {
    return NextResponse.json(
      { error: "A blood panel with at least one marker is required." },
      { status: 400 }
    );
  }

  let userContext = "";
  try {
    userContext = await buildUserContext(user.id);
  } catch {
    userContext = "";
  }

  const markerLines = entry.markers
    .map((m) => {
      const range =
        m.ref_low != null || m.ref_high != null
          ? ` (ref ${m.ref_low ?? "–"}–${m.ref_high ?? "–"})`
          : "";
      const flag = m.flag ? ` [${m.flag}]` : "";
      return `- ${m.marker}: ${m.value ?? "?"}${m.unit ? " " + m.unit : ""}${range}${flag}${m.category ? ` · ${m.category}` : ""}`;
    })
    .join("\n");

  const userMsg = [
    userContext,
    "",
    `BLOOD PANEL drawn ${entry.drawn_date || "(date unknown)"}${entry.lab_name ? ` at ${entry.lab_name}` : ""}:`,
    markerLines,
    "",
    "Analyze this panel now as the JSON object specified.",
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
        max_tokens: 1400,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Analysis service error (${res.status}).`, detail: detail.slice(0, 500) },
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

    let analysis: unknown = null;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        analysis = JSON.parse(match[0]);
      } catch {
        analysis = null;
      }
    }

    if (!analysis) {
      return NextResponse.json(
        { error: "Could not parse the analysis. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reach the analysis service.", detail: e instanceof Error ? e.message : "" },
      { status: 502 }
    );
  }
}
