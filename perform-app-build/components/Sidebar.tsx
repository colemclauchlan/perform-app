"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { PulseLine } from "@/components/ui/PulseLine";
import {
  LayoutDashboard, HeartPulse, Dumbbell, FlaskConical, Sparkles, Salad,
  Utensils, ClipboardList, Droplets, Camera, ListChecks, Calculator,
  TestTubes, Droplet, Activity, Scale, Ruler, Moon, Footprints, BookOpen,
  Apple, Pill, Settings, ChevronDown, LogOut,
} from "lucide-react";

type Leaf = { href: string; label: string; icon: React.ComponentType<{ size?: number }> };
type Parent = { id: string; label: string; icon: React.ComponentType<{ size?: number }>; href?: string; children?: Leaf[] };
type Group = { group: string; items: Parent[] };

// Grouped, expandable nav — mirrors the Vital Signal kit shell, mapped to the
// app's real routes.
const NAV: Group[] = [
  {
    group: "Overview",
    items: [
      {
        id: "dashboards", label: "Dashboards", icon: LayoutDashboard,
        children: [
          { href: "/dashboard", label: "Health", icon: HeartPulse },
          { href: "/gym", label: "Gym", icon: Dumbbell },
          { href: "/ped-dashboard", label: "PED", icon: FlaskConical },
          { href: "/coach", label: "AI Coach", icon: Sparkles },
        ],
      },
    ],
  },
  {
    group: "Track",
    items: [
      {
        id: "nutrition", label: "Nutrition", icon: Salad,
        children: [
          { href: "/nutrition", label: "Food & Meal Log", icon: Utensils },
          { href: "/meal-plans", label: "Meal Plans", icon: ClipboardList },
          { href: "/hydration", label: "Hydration", icon: Droplets },
        ],
      },
      {
        id: "training", label: "Training", icon: Dumbbell,
        children: [
          { href: "/workouts", label: "Log a Workout", icon: ClipboardList },
          { href: "/checkin", label: "Check-ins", icon: Camera },
          { href: "/catalog/exercises", label: "Exercise Library", icon: ListChecks },
        ],
      },
      {
        id: "compounds", label: "Compounds", icon: FlaskConical,
        children: [
          { href: "/compounds", label: "Protocols", icon: FlaskConical },
          { href: "/peptide-calculator", label: "Peptide Calculator", icon: Calculator },
        ],
      },
      {
        id: "bloodwork", label: "Bloodwork", icon: Activity,
        children: [
          { href: "/bloodwork", label: "Blood Panels", icon: TestTubes },
          { href: "/blood-pressure", label: "Blood Pressure", icon: HeartPulse },
          { href: "/blood-sugar", label: "Blood Sugar", icon: Droplet },
        ],
      },
      {
        id: "vitals", label: "Health & Vitals", icon: HeartPulse,
        children: [
          { href: "/weight", label: "Body Weight", icon: Scale },
          { href: "/measurements", label: "Measurements", icon: Ruler },
          { href: "/sleep", label: "Sleep", icon: Moon },
          { href: "/steps", label: "Steps", icon: Footprints },
        ],
      },
    ],
  },
  {
    group: "Manage",
    items: [
      {
        id: "catalogs", label: "Catalogs", icon: BookOpen,
        children: [
          { href: "/catalog/food", label: "Food", icon: Apple },
          { href: "/catalog/compounds", label: "Compounds", icon: Pill },
          { href: "/catalog/exercises", label: "Exercises", icon: ListChecks },
        ],
      },
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

function LogoLockup() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Logo variant="icon" size={30} className="rounded-lg" />
      <span className="font-display font-bold text-[16px] tracking-tight leading-none">
        BodyTrack<span className="text-accent">:AI</span>
      </span>
    </span>
  );
}

export function Sidebar({ activePath }: { activePath?: string } = {}) {
  const realPath = usePathname();
  const pathname = activePath ?? realPath;
  const router = useRouter();
  const supabase = createClient();

  const childActive = (p: Parent) => p.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")) ?? false;

  const [open, setOpen] = useState<Record<string, boolean>>({ dashboards: true });

  // Auto-expand the group that owns the active route.
  useEffect(() => {
    NAV.forEach((g) =>
      g.items.forEach((it) => {
        if (it.children && it.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))) {
          setOpen((o) => (o[it.id] ? o : { ...o, [it.id]: true }));
        }
      })
    );
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside
      className="flex-none h-screen sticky top-0 flex flex-col py-4 bg-bg-1 border-r border-border"
      style={{ width: 220 }}
    >
      <Link href="/dashboard" className="px-4 pb-4 group">
        <LogoLockup />
      </Link>

      <nav className="flex-1 overflow-y-auto">
        {NAV.map((g) => (
          <div key={g.group} className="mb-1">
            <div className="lab-label px-4 pt-3.5 pb-1.5 text-[9.5px] tracking-[0.16em]">{g.group}</div>
            {g.items.map((it) => {
              const Icon = it.icon;
              const hasChildren = !!it.children?.length;
              const expanded = !!open[it.id];
              const selfActive = it.href ? pathname === it.href || pathname.startsWith(it.href + "/") : false;
              const highlight = selfActive || (hasChildren && childActive(it) && !expanded);
              const row = (
                <span
                  className={cn(
                    "flex items-center gap-2 w-[calc(100%-8px)] mx-1 px-2.5 py-2 rounded-r-md border-l-2 text-[13px] transition-colors cursor-pointer",
                    highlight
                      ? "bg-accent-dim border-accent text-accent-bright font-semibold"
                      : "border-transparent text-text-2 hover:text-text-1 hover:bg-bg-2"
                  )}
                >
                  <Icon size={15} />
                  <span className="flex-1">{it.label}</span>
                  {hasChildren && (
                    <ChevronDown
                      size={13}
                      className={cn("text-text-3 transition-transform", expanded && "rotate-180")}
                    />
                  )}
                </span>
              );
              return (
                <div key={it.id}>
                  {hasChildren ? (
                    <button type="button" className="block w-full text-left" onClick={() => setOpen((o) => ({ ...o, [it.id]: !o[it.id] }))}>
                      {row}
                    </button>
                  ) : (
                    <Link href={it.href!}>{row}</Link>
                  )}
                  {hasChildren && expanded && (
                    <div>
                      {it.children!.map((c) => {
                        const CIcon = c.icon;
                        const cActive = pathname === c.href || pathname.startsWith(c.href + "/");
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            className={cn(
                              "flex items-center gap-2 w-[calc(100%-8px)] mx-1 pl-8 pr-3 py-[7px] rounded-r-md border-l-2 text-[12.5px] transition-colors",
                              cActive
                                ? "bg-accent-dim border-accent text-accent-bright font-semibold"
                                : "border-transparent text-text-2 hover:text-text-1 hover:bg-bg-2"
                            )}
                          >
                            <CIcon size={14} />
                            <span className="flex-1">{c.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 pt-2">
        <PulseLine width={186} height={14} opacity={0.4} />
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 mx-2 mt-1 px-3 py-2.5 text-[13px] text-text-3 hover:text-status-red hover:bg-bg-2 rounded-md transition-colors"
      >
        <LogOut size={15} />
        Log out
      </button>
    </aside>
  );
}
