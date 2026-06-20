"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useProfile, useUpdateProfile } from "@/hooks/useNutrition";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
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
  Sparkles,
  Camera,
  TestTubes,
  Calculator,
  UtensilsCrossed,
  Activity,
  Syringe,
  GripVertical,
  HeartPulse,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number }> };

// Pinned top — primary dashboards + AI
const PINNED_TOP: NavItem[] = [
  { href: "/dashboard", label: "Health Dashboard", icon: LayoutDashboard },
  { href: "/gym", label: "Gym Dashboard", icon: Activity },
  { href: "/ped-dashboard", label: "PED Dashboard", icon: Syringe },
  { href: "/coach", label: "AI Coach", icon: Sparkles },
];

// Reorderable "Track" list (drag to reorder; persists to preferences)
const TRACK_DEFAULT: NavItem[] = [
  { href: "/nutrition", label: "Nutrition", icon: Salad },
  { href: "/meal-plans", label: "Meal Plans", icon: UtensilsCrossed },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/compounds", label: "Compounds", icon: FlaskConical },
  { href: "/checkin", label: "Check-in", icon: Camera },
  { href: "/bloodwork", label: "Bloodwork", icon: TestTubes },
  { href: "/blood-pressure", label: "Blood Pressure", icon: HeartPulse },
  { href: "/peptide-calculator", label: "Peptide Calculator", icon: Calculator },
  { href: "/weight", label: "Body Weight", icon: Scale },
  { href: "/measurements", label: "Measurements", icon: Ruler },
  { href: "/steps", label: "Steps", icon: Footprints },
  { href: "/hydration", label: "Hydration", icon: Droplets },
  { href: "/sleep", label: "Sleep", icon: Moon },
];

const PINNED_BOTTOM: NavItem[] = [
  { href: "/catalog/food", label: "Food Catalog", icon: BookOpen },
  { href: "/catalog/compounds", label: "Compound Catalog", icon: Pill },
  { href: "/catalog/exercises", label: "Exercise Catalog", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings },
];

function orderTrack(saved: string[] | undefined): NavItem[] {
  if (!saved || saved.length === 0) return TRACK_DEFAULT;
  const map = new Map(TRACK_DEFAULT.map((i) => [i.href, i]));
  const out: NavItem[] = [];
  saved.forEach((href) => {
    const item = map.get(href);
    if (item) {
      out.push(item);
      map.delete(href);
    }
  });
  // append any new items not in saved order
  map.forEach((item) => out.push(item));
  return out;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [track, setTrack] = useState<NavItem[]>(TRACK_DEFAULT);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Sync ordering from saved preferences once profile loads
  useEffect(() => {
    setTrack(orderTrack(profile?.preferences?.tab_order));
  }, [profile?.preferences?.tab_order]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  function persistOrder(items: NavItem[]) {
    const tab_order = items.map((i) => i.href);
    updateProfile.mutate({
      preferences: { ...(profile?.preferences || {}), tab_order },
    });
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...track];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setTrack(next);
    persistOrder(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  const renderLink = (item: NavItem) => {
    const active = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 mx-1 text-[13px] transition-all border-l-2 rounded-r-lg group",
          active
            ? "text-accent bg-accent-dim border-accent font-medium shadow-[inset_0_0_18px_-8px_rgba(37,99,235,0.5)]"
            : "text-text-2 border-transparent hover:text-text-1 hover:bg-bg-2 hover:translate-x-0.5"
        )}
      >
        <Icon size={15} />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="w-[230px] flex-shrink-0 bg-bg-1/80 backdrop-blur-xl border-r border-border flex flex-col py-4 h-screen sticky top-0">
      {/* Logo + brand — click returns to Health Dashboard */}
      <Link href="/dashboard" className="px-3 pb-5 flex items-center justify-center group">
        <Logo
          variant="full"
          size={84}
          className="rounded-lg transition-transform group-hover:scale-105"
        />
      </Link>

      <nav className="flex-1 overflow-y-auto">
        {/* Overview (pinned) */}
        <div className="px-4 pt-1 pb-1.5 text-[9px] uppercase tracking-widest text-text-3 font-semibold">
          Overview
        </div>
        {PINNED_TOP.map((item) => (
          <div key={item.href}>{renderLink(item)}</div>
        ))}

        {/* Track (reorderable) */}
        <div className="px-4 pt-4 pb-1.5 text-[9px] uppercase tracking-widest text-text-3 font-semibold flex items-center gap-1">
          Track <span className="text-text-3/50 normal-case tracking-normal">· drag to reorder</span>
        </div>
        {track.map((item, i) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <div
              key={item.href}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnter={() => setOverIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cn(
                "group/item flex items-center transition-all",
                dragIndex === i && "opacity-40",
                overIndex === i && dragIndex !== null && dragIndex !== i && "border-t-2 border-accent"
              )}
            >
              <span className="pl-2 text-text-3/40 group-hover/item:text-text-3 cursor-grab active:cursor-grabbing">
                <GripVertical size={13} />
              </span>
              <Link
                href={item.href}
                className={cn(
                  "flex-1 flex items-center gap-2.5 px-2 py-2 mr-1 text-[13px] transition-all border-l-2 rounded-r-lg",
                  active
                    ? "text-accent bg-accent-dim border-accent font-medium shadow-[inset_0_0_18px_-8px_rgba(37,99,235,0.5)]"
                    : "text-text-2 border-transparent hover:text-text-1 hover:bg-bg-2"
                )}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            </div>
          );
        })}

        {/* Manage (pinned) */}
        <div className="px-4 pt-4 pb-1.5 text-[9px] uppercase tracking-widest text-text-3 font-semibold">
          Manage
        </div>
        {PINNED_BOTTOM.map((item) => (
          <div key={item.href}>{renderLink(item)}</div>
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
