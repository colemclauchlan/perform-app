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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-1 border-t border-border flex justify-around items-center h-16 z-50 pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] flex-1 py-2 transition-colors",
              active ? "text-accent" : "text-text-3"
            )}
          >
            <div className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
              active ? "bg-accent-dim" : ""
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
