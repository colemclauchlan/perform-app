"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { PulseLine } from "@/components/ui/PulseLine";
import { Search, ChevronDown, Settings, LogOut, User } from "lucide-react";

// Route → [title, subtitle]. Mirrors the kit's TopBar title map.
const TITLES: Record<string, [string, string]> = {
  "/dashboard": ["Health Dashboard", "__DATE__"],
  "/gym": ["Gym Dashboard", "Training load, lifts & progression"],
  "/ped-dashboard": ["PED Dashboard", "Protocols, doses & bloodwork at a glance"],
  "/coach": ["AI Coach", "Reads your full health history in context"],
  "/nutrition": ["Food & Meal Log", "Search, quick-add & manual entry"],
  "/meal-plans": ["Meal Plans", "Reusable plans & macro targets"],
  "/hydration": ["Hydration", "Daily water intake"],
  "/workouts": ["Workouts", "Sets, reps, RPE & progression"],
  "/checkin": ["Check-ins", "Physique comparison over time"],
  "/compounds": ["Compound Protocols", "Cycles, peptides, ancillaries & supplements"],
  "/peptide-calculator": ["Peptide Calculator", "Reconstitution & dosing math"],
  "/bloodwork": ["Blood Panels", "Markers, reference ranges & AI analysis"],
  "/blood-pressure": ["Blood Pressure", "Systolic / diastolic trend"],
  "/blood-sugar": ["Blood Sugar", "Glucose readings & trend"],
  "/weight": ["Body Weight", "Trend, stats & history"],
  "/measurements": ["Body Measurements", "Muscle girth on a 3D model"],
  "/sleep": ["Sleep", "Duration & quality"],
  "/steps": ["Steps", "Daily steps & activity"],
  "/catalog/food": ["Food Catalog", "Your food library & macros"],
  "/catalog/compounds": ["Compound Catalog", "Your compound & peptide library"],
  "/catalog/exercises": ["Exercise Catalog", "225+ exercises & saved programs"],
  "/settings": ["Settings", "Profile, targets & preferences"],
};

function resolve(pathname: string): [string, string] {
  if (TITLES[pathname]) return TITLES[pathname];
  // longest-prefix match for nested routes
  const key = Object.keys(TITLES)
    .filter((k) => pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];
  if (key) return TITLES[key];
  return ["", ""];
}

export function TopBar({ email, activePath }: { email?: string | null; activePath?: string }) {
  const realPath = usePathname();
  const pathname = activePath ?? realPath;
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  let [title, sub] = resolve(pathname);
  if (sub === "__DATE__") {
    sub = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }
  const initials = (email || "?")
    .split("@")[0]
    .split(/[.\-_]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("") || "U";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header
      className="flex-none flex items-center justify-between gap-4 px-6 border-b border-border bg-bg-1 sticky top-0 z-20"
      style={{ minHeight: 56 }}
    >
      <div className="min-w-0 flex-1 pr-2">
        <div className="font-display font-bold text-[23px] leading-tight tracking-tight truncate">{title}</div>
        {sub && <div className="text-[11.5px] text-text-3 truncate">{sub}</div>}
      </div>
      <div className="flex items-center gap-3 flex-none">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-bg-2 text-text-3 w-[200px]">
          <Search size={14} />
          <span className="text-[13px]">Search…</span>
        </div>
        <div className="hidden md:block opacity-80">
          <PulseLine width={110} height={22} opacity={0.85} />
        </div>
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className={cnPill(open)}
          >
            <span
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-display font-bold text-[13px]"
              style={{ background: "linear-gradient(135deg, #189bf5 0%, #1346d8 100%)" }}
            >
              {initials}
            </span>
            <ChevronDown size={14} className={`text-text-3 mr-1 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 bg-bg-2 border border-border rounded-xl shadow-lift overflow-hidden animate-fade-in">
              <div className="flex items-center gap-3 p-3.5 border-b border-border">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-bold text-[15px] flex-none"
                  style={{ background: "linear-gradient(135deg, #189bf5 0%, #1346d8 100%)" }}
                >
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text-1 truncate">{email?.split("@")[0] || "You"}</div>
                  <div className="data text-[11px] text-text-3 truncate">{email}</div>
                </div>
              </div>
              <div className="py-1.5">
                <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] text-text-2 hover:text-text-1 hover:bg-bg-3 transition-colors">
                  <User size={16} className="text-text-3" /> Your Profile
                </Link>
                <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] text-text-2 hover:text-text-1 hover:bg-bg-3 transition-colors">
                  <Settings size={16} className="text-text-3" /> Settings & Targets
                </Link>
              </div>
              <div className="border-t border-border py-1.5">
                <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13.5px] font-semibold text-status-red hover:bg-status-red/10 transition-colors">
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function cnPill(open: boolean) {
  return `flex items-center gap-2 p-1 rounded-full cursor-pointer transition-all border ${
    open ? "bg-bg-3 border-border" : "border-transparent hover:bg-bg-2"
  }`;
}
