import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A capable vision model for OCR/extraction.
const MODEL = process.env.COACH_MODEL || "claude-sonnet-4-6";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const PROMPT = `You are extracting structured data from a blood test / lab report (this may be a photo, screenshot, or PDF). Read EVERY marker line and transcribe it faithfully — do not invent, omit, or guess values that aren't shown.

Return ONLY a JSON object (no markdown fences, no prose) of exactly this shape:
{
  "drawn_date": "<YYYY-MM-DD or null>",
  "lab_name": "<lab/clinic name or null>",
  "markers": [
    { "marker": "<name>", "value": <number or null>, "unit": "<unit or null>", "ref_low": <number or null>, "ref_high": <number or null>, "category": "<category>" }
  ]
}
- Use the reference range printed on the report for ref_low/ref_high (parse "X - Y", "< Y", "> X" appropriately; use null when not shown).
- "value" must be the numeric result only (no unit, no flag text).
- "category" is one of: Hormones, Lipids, Metabolic, CBC, Liver, Kidney, Thyroid, Vitamins, Other.
- Include every numeric marker you can read. If the image is unreadable, return an empty markers array.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI import is not configured yet. Add an ANTHROPIC_API_KEY to enable it." },
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

  let body: { fileBase64?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = (body.fileBase64 || "").trim();
  const mediaType = (body.mediaType || "").trim();
  if (!data) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  const isPdf = mediaType === "application/pdf";
  if (!isPdf && !IMAGE_TYPES.has(mediaType)) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a JPG/PNG/WEBP photo or a PDF." },
      { status: 400 }
    );
  }

  const fileBlock = isPdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
    : { type: "image", source: { type: "base64", media_type: mediaType, data } };

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
        messages: [{ role: "user", content: [fileBlock, { type: "text", text: PROMPT }] }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Import service error (${res.status}).`, detail: detail.slice(0, 500) },
        { status: 502 }
      );
    }

    const json = await res.json();
    const text: string = Array.isArray(json?.content)
      ? json.content
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n")
      : "";

    let result: unknown = null;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        result = JSON.parse(match[0]);
      } catch {
        result = null;
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: "Could not read the report. Try a clearer photo or a PDF." },
        { status: 502 }
      );
    }

    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reach the import service.", detail: e instanceof Error ? e.message : "" },
      { status: 502 }
    );
  }
}
