"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import {
  LayoutDashboard, Utensils, Dumbbell, Syringe, TestTubes, Sparkles, Camera, Settings,
  Menu, X, ClipboardList, ListChecks, HeartPulse, Droplet, Scale, Ruler, Moon, Droplets,
  Footprints, Calculator, Pill, Apple, BookOpen,
} from "lucide-react";

type Tab = { href: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> };

// Scrollable bottom-bar destinations — mirrors the iOS kit's IOS_BOTTOM.
const BOTTOM: Tab[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/workouts", label: "Train", icon: Dumbbell },
  { href: "/compounds", label: "Protocols", icon: Syringe },
  { href: "/bloodwork", label: "Bloodwork", icon: TestTubes },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/checkin", label: "Check-ins", icon: Camera },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Routes that should highlight the Dashboard tab (health & vitals live there).
const DASHBOARD_ALIASES = ["/gym", "/ped-dashboard", "/weight", "/measurements", "/sleep", "/hydration", "/steps"];

// Full grouped nav for the popup sheet — mirrors the iOS kit's IOS_NAV.
const SHEET_NAV: { group: string; items: Tab[] }[] = [
  { group: "Overview", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/coach", label: "AI Coach", icon: Sparkles },
  ] },
  { group: "Nutrition", items: [
    { href: "/nutrition", label: "Food Log", icon: Utensils },
    { href: "/meal-plans", label: "Meal Plans", icon: ClipboardList },
  ] },
  { group: "Training", items: [
    { href: "/workouts", label: "Log a Workout", icon: Dumbbell },
    { href: "/checkin", label: "Check-ins", icon: Camera },
    { href: "/catalog/exercises", label: "Exercise Library", icon: ListChecks },
  ] },
  { group: "Bloodwork", items: [
    { href: "/bloodwork", label: "Blood Panels", icon: TestTubes },
    { href: "/blood-pressure", label: "Blood Pressure", icon: HeartPulse },
    { href: "/blood-sugar", label: "Blood Sugar", icon: Droplet },
  ] },
  { group: "Health & Vitals", items: [
    { href: "/weight", label: "Body Weight", icon: Scale },
    { href: "/measurements", label: "Measurements", icon: Ruler },
    { href: "/sleep", label: "Sleep", icon: Moon },
    { href: "/hydration", label: "Hydration", icon: Droplets },
    { href: "/steps", label: "Steps", icon: Footprints },
  ] },
  { group: "Compounds", items: [
    { href: "/compounds", label: "Compound Protocols", icon: Syringe },
    { href: "/peptide-calculator", label: "Peptide Calculator", icon: Calculator },
    { href: "/catalog/compounds", label: "Compound Catalog", icon: Pill },
  ] },
  { group: "Manage", items: [
    { href: "/catalog/food", label: "Food Catalog", icon: Apple },
    { href: "/settings", label: "Settings", icon: Settings },
  ] },
];

export function MobileNav() {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    setSheet(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const bottomActive = (href: string) =>
    isActive(href) || (href === "/dashboard" && DASHBOARD_ALIASES.some((a) => isActive(a)));

  return (
    <>
      {/* Popup sidebar sheet */}
      <div className={cn("md:hidden fixed inset-0 z-[60]", sheet ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          onClick={() => setSheet(false)}
          className={cn("absolute inset-0 bg-[rgba(4,8,14,0.62)] transition-opacity duration-300", sheet ? "opacity-100 backdrop-blur-sm" : "opacity-0")}
        />
        <div
          className="absolute top-0 bottom-0 left-0 w-[296px] max-w-[85vw] bg-bg-1 border-r border-border-2 shadow-lift flex flex-col transition-transform duration-300"
          style={{ transform: sheet ? "translateX(0)" : "translateX(-100%)", transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
        >
          <div className="flex items-center gap-3 px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-4 border-b border-border">
            <Logo variant="icon" size={34} className="rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-[17px] tracking-tight">
                BodyTrack<span className="text-accent-bright">:AI</span>
              </div>
              <div className="data text-[10px] text-text-3 mt-0.5">TRACK THE BODY · TRUST THE SIGNAL</div>
            </div>
            <button onClick={() => setSheet(false)} className="w-[30px] h-[30px] rounded-full bg-bg-3 text-text-2 flex items-center justify-center flex-none">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 pb-6">
            {SHEET_NAV.map((g) => (
              <div key={g.group} className="py-2">
                <div className="lab-label px-5 pb-1.5 text-[9.5px] text-text-4">{g.group}</div>
                {g.items.map((it) => {
                  const on = isActive(it.href);
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={cn(
                        "flex items-center gap-3 w-full px-5 py-2.5 text-[14px] border-l-[2.5px] transition-colors",
                        on ? "bg-accent-dim border-accent text-accent-bright font-semibold" : "border-transparent text-text-2"
                      )}
                    >
                      <Icon size={17} />
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-1/90 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch">
          <button
            onClick={() => setSheet(true)}
            className="flex-none w-[58px] flex flex-col items-center gap-1 pt-2.5 pb-1.5 border-r border-border text-text-2"
            aria-label="Open menu"
          >
            <Menu size={21} strokeWidth={2.2} />
            <span className="text-[9.5px] font-semibold">Menu</span>
          </button>
          <div className="flex-1 flex overflow-x-auto no-scrollbar gap-0.5">
            {BOTTOM.map((t) => {
              const on = bottomActive(t.href);
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "relative flex-none min-w-[66px] flex flex-col items-center gap-1 pt-2.5 pb-1.5 px-1.5 transition-colors",
                    on ? "text-accent-bright" : "text-text-3"
                  )}
                >
                  {on && <span className="absolute top-0 w-6 h-[3px] rounded-full bg-accent shadow-[0_0_8px_rgba(24,155,245,0.6)]" />}
                  <Icon size={20} strokeWidth={on ? 2.4 : 2} />
                  <span className={cn("text-[9.5px] whitespace-nowrap", on ? "font-semibold" : "font-medium")}>{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
