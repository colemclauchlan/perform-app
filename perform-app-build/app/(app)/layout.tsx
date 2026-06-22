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
      <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Mobile top bar — brand logo on the left (tap to go home). Desktop uses
            the sidebar logo, so this is hidden there. */}
        <div className="md:hidden sticky top-0 z-20 flex justify-start px-5 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] bg-bg-0/70 backdrop-blur-xl border-b border-border/80">
          <Link href="/dashboard" className="transition-transform active:scale-95" aria-label="Go to Health Dashboard">
            <Logo variant="icon" size={40} className="rounded-lg" />
          </Link>
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
      <MobileNav />
    </div>
  );
}
