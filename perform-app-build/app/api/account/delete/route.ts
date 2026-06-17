import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Permanently deletes the authenticated user's account and all data.
// Apple requires in-app account deletion for apps with account creation, so
// this is a hard requirement for App Store submission.
//
// Row-level-security cascade: every user-owned table references auth.users with
// ON DELETE CASCADE, so removing the auth user removes all their rows. Deleting
// an auth user requires the service-role key, which is only ever used here
// (server-side) and never shipped to the client.
export async function POST() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !url) {
    return NextResponse.json(
      {
        error:
          "Account deletion is not configured. Add SUPABASE_SERVICE_ROLE_KEY to enable it.",
      },
      { status: 503 }
    );
  }

  // Identify the caller from their session cookie (never trust a client-passed id).
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account.", detail: error.message },
      { status: 500 }
    );
  }

  // Clear the local session so the client is logged out cleanly.
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
