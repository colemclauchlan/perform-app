"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Salad,
  Activity,
  Dumbbell,
  Sparkles,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Health", icon: LayoutDashboard },
  { href: "/gym", label: "Gym", icon: Activity },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/nutrition", label: "Food", icon: Salad },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-1/85 backdrop-blur-xl border-t border-border flex justify-around items-center h-16 z-50 pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 text-[10px] flex-1 py-2 transition-colors",
              active ? "text-accent" : "text-text-3 hover:text-text-2"
            )}
          >
            {active && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent-gradient" />
            )}
            <div className={cn(
              "w-9 h-8 flex items-center justify-center rounded-lg transition-all duration-200",
              active ? "bg-accent-dim scale-105" : "active:scale-90"
            )}>
              <Icon size={18} />
            </div>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
