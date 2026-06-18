import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  // Logged-out visitors get the public marketing landing page.
  return <LandingPage />;
}
