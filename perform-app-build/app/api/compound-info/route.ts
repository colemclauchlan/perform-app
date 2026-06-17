import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.COACH_MODEL || "claude-sonnet-4-6";

const SYSTEM = `You are a harm-reduction educator describing performance, health, and longevity compounds (anabolic steroids, peptides, GLP-1 agonists, SARMs, ancillaries, AI/SERMs, supplements) for an informed adult audience inside a personal tracking app.

Write a concise, factual profile in markdown with these short sections (omit any you lack data for):
- **What it is** — drug class, mechanism in one or two sentences.
- **Common use** — typical purpose and dosing range/frequency, with units.
- **Half-life** — approximate elimination half-life if known.
- **Key considerations** — side effects, interactions, what bloodwork to monitor.
- **Safety** — one line.

Rules: Be neutral and educational, not promotional. Never encourage illegal or unsafe use. Always end with: "Not medical advice — consult a physician and get regular bloodwork." Keep it under 200 words.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI descriptions are not configured yet. Add an ANTHROPIC_API_KEY to enable them." },
      { status: 503 }
    );
  }

  let body: { id?: string; name?: string; type?: string; refresh?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = body.id;
  const name = (body.name || "").trim();
  if (!id || !name) {
    return NextResponse.json({ error: "Missing compound." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Return cached description unless a refresh was requested.
  if (!body.refresh) {
    const { data: existing } = await supabase
      .from("compound_catalog")
      .select("ai_description")
      .eq("id", id)
      .maybeSingle();
    if (existing?.ai_description) {
      return NextResponse.json({ description: existing.ai_description, cached: true });
    }
  }

  const prompt = `Compound: ${name}${body.type ? ` (type: ${body.type})` : ""}. Write its profile.`;

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
        max_tokens: 600,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `AI service error (${res.status}).`, detail: detail.slice(0, 300) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const description = Array.isArray(data?.content)
      ? data.content
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n")
          .trim()
      : "";

    if (!description) {
      return NextResponse.json({ error: "Empty response from AI." }, { status: 502 });
    }

    // Cache it (best-effort; only updatable rows the user owns or global via RLS).
    await supabase.from("compound_catalog").update({ ai_description: description }).eq("id", id);

    return NextResponse.json({ description, cached: false });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reach the AI service.", detail: e instanceof Error ? e.message : "" },
      { status: 502 }
    );
  }
}
