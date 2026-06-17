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
  Footprints,
  Ruler,
  Droplets,
  Moon,
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
      { href: "/measurements", label: "Measurements", icon: Ruler },
      { href: "/steps", label: "Steps", icon: Footprints },
      { href: "/hydration", label: "Hydration", icon: Droplets },
      { href: "/sleep", label: "Sleep", icon: Moon },
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

function BodyTrackerLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="11" width="5" height="6" rx="1.5" fill="#2563eb" />
      <rect x="21" y="11" width="5" height="6" rx="1.5" fill="#2563eb" />
      <rect x="5" y="9" width="3" height="10" rx="1" fill="#3b82f6" />
      <rect x="20" y="9" width="3" height="10" rx="1" fill="#3b82f6" />
      <rect x="8" y="13" width="12" height="2" rx="1" fill="#1d4ed8" />
      <path d="M10 7 L12 4 L14 10 L16 7 L18 7" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
    <aside className="w-[220px] flex-shrink-0 bg-bg-1 border-r border-border flex flex-col py-4 h-screen sticky top-0">
      {/* Logo + brand */}
      <div className="px-4 pb-5 flex items-center gap-2.5">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-dim border border-accent/20">
          <BodyTrackerLogo />
        </div>
        <div>
          <span className="text-[15px] font-bold tracking-tight leading-none block">
            Body<span className="text-accent">Tracker</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-text-3 leading-none">
            Performance
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-4 pt-4 pb-1.5 text-[9px] uppercase tracking-widest text-text-3 font-semibold">
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
                    "flex items-center gap-2.5 px-3 py-2 mx-1 text-[13px] transition-all border-l-2 rounded-r-lg",
                    active
                      ? "text-accent bg-accent-dim border-accent font-medium"
                      : "text-text-2 border-transparent hover:text-text-1 hover:bg-bg-2"
                  )}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 mx-2 px-3 py-2.5 text-[13px] text-text-2 hover:text-status-red hover:bg-bg-2 rounded-lg transition-colors mt-2"
      >
        <LogOut size={15} />
        Log out
      </button>
    </aside>
  );
}
