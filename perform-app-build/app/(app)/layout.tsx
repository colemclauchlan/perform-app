import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { PageTransition } from "@/components/PageTransition";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Top bar — brand logo pinned to the top right of every page */}
        <div className="sticky top-0 z-20 flex justify-end px-6 py-3 bg-bg-0/80 backdrop-blur-sm border-b border-border">
          <Link href="/dashboard" className="transition-transform hover:scale-105">
            <Logo variant="icon" size={56} className="rounded-lg" />
          </Link>
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
      <MobileNav />
    </div>
  );
}
