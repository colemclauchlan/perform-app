"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Activity, Syringe } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Health", icon: LayoutDashboard },
  { href: "/gym", label: "Gym", icon: Activity },
  { href: "/ped-dashboard", label: "PEDs", icon: Syringe },
];

export function DashboardSwitcher() {
  const pathname = usePathname();
  return (
    <div className="inline-flex gap-1 mb-5 bg-bg-2 p-1 rounded-xl border border-border">
      {TABS.map((t) => {
        const active = pathname === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
              active
                ? "bg-accent text-white shadow-sm"
                : "text-text-2 hover:text-text-1"
            )}
          >
            <Icon size={14} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
