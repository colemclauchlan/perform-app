import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// Handles both email-confirmation and password-recovery links. Supabase sends
// the user here with a one-time `code` (PKCE) which we exchange for a session,
// then forward to `next` (defaults to the dashboard; recovery links pass
// `next=/auth/reset-password`).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error_description") || searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );
    if (!exchangeError) {
      // Only allow same-origin relative redirects to avoid open-redirects.
      const safeNext = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent("Link expired or invalid")}`
  );
}
