"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Salad,
  FlaskConical,
  Dumbbell,
  Scale,
  BookOpen,
  Pill,
  ListChecks,
  Settings,
  LogOut,
  Activity,
  Footprints,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Track",
    items: [
      { href: "/nutrition", label: "Nutrition", icon: Salad },
      { href: "/compounds", label: "Compounds", icon: FlaskConical },
      { href: "/workouts", label: "Workouts", icon: Dumbbell },
      { href: "/weight", label: "Body Weight", icon: Scale },
      { href: "/steps", label: "Steps", icon: Footprints },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/catalog/food", label: "Food Catalog", icon: BookOpen },
      { href: "/catalog/compounds", label: "Compound Catalog", icon: Pill },
      { href: "/catalog/exercises", label: "Exercises", icon: ListChecks },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside className="w-[210px] flex-shrink-0 bg-bg-1 border-r border-border flex flex-col py-4 h-screen sticky top-0">
      <div className="px-4 pb-5 flex items-center gap-2">
        <Activity className="text-accent" size={20} />
        <span className="text-[15px] font-semibold tracking-wide">
          PERF<span className="text-accent">ORM</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-4 pt-4 pb-1.5 text-[10px] uppercase tracking-widest text-text-3">
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all border-l-2",
                    active
                      ? "text-accent bg-accent-dim border-accent"
                      : "text-text-2 border-transparent hover:text-text-1 hover:bg-bg-2"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-text-2 hover:text-status-red transition-colors mt-2"
      >
        <LogOut size={16} />
        Log out
      </button>
    </aside>
  );
}
