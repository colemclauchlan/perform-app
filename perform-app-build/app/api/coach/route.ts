import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCoachContext } from "@/lib/ai-context";
import { buildUserContext } from "@/lib/ai-user-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MODEL = process.env.COACH_MODEL || "claude-sonnet-4-6";

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
    context = await buildUserContext(user.id);
  } catch {
    context = "";
  }

  const base = getCoachContext();
  const system = context ? `${base}\n\n${context}` : base;

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
