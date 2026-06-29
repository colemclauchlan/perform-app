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
  Apple, Pill, Settings, ChevronDown, LogOut, GripVertical,
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

const NAV_ORDER_KEY = "btai-nav-order-v1";

// Merge any saved per-group order with the defaults so new items still appear.
function buildOrder(saved: Record<string, string[]> | null): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  NAV.forEach((g) => {
    const savedList = (saved && saved[g.group]) || [];
    out[g.group] = savedList.filter((id) => g.items.some((it) => it.id === id));
    g.items.forEach((it) => {
      if (!out[g.group].includes(it.id)) out[g.group].push(it.id);
    });
  });
  return out;
}

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

  // Per-group item order (drag to reorder). Starts from defaults; hydrates from
  // localStorage after mount to avoid an SSR/client mismatch.
  const [order, setOrder] = useState<Record<string, string[]>>(() => buildOrder(null));
  const [drag, setDrag] = useState<{ group: string; id: string } | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NAV_ORDER_KEY);
      if (raw) setOrder(buildOrder(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  function persist(next: Record<string, string[]>) {
    setOrder(next);
    try {
      localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  function reorder(group: string, fromId: string, toId: string) {
    if (fromId === toId) return;
    const list = [...(order[group] || [])];
    const fi = list.indexOf(fromId);
    const ti = list.indexOf(toId);
    if (fi < 0 || ti < 0) return;
    list.splice(fi, 1);
    list.splice(ti, 0, fromId);
    persist({ ...order, [group]: list });
  }

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
        {NAV.map((g) => {
          const byId = Object.fromEntries(g.items.map((it) => [it.id, it] as const));
          const ids = order[g.group] || g.items.map((it) => it.id);
          return (
            <div key={g.group} className="mb-1">
              <div className="lab-label px-4 pt-3.5 pb-1.5 text-[9.5px] tracking-[0.16em] flex items-center gap-1.5">
                {g.group}
                {g.items.length > 1 && (
                  <span className="normal-case tracking-normal text-text-4/70 text-[9px]">· drag to reorder</span>
                )}
              </div>
              {ids.map((id) => {
                const it = byId[id];
                if (!it) return null;
                const Icon = it.icon;
                const hasChildren = !!it.children?.length;
                const expanded = !!open[it.id];
                const selfActive = it.href ? pathname === it.href || pathname.startsWith(it.href + "/") : false;
                const highlight = selfActive || (hasChildren && childActive(it) && !expanded);
                const isDragging = drag?.id === it.id;
                const isOver = overId === it.id && !!drag && drag.id !== it.id && drag.group === g.group;
                const row = (
                  <span
                    className={cn(
                      "group/row flex items-center gap-1.5 w-[calc(100%-8px)] mx-1 pl-1.5 pr-2.5 py-2 rounded-r-md border-l-2 text-[13px] transition-colors cursor-pointer",
                      highlight
                        ? "bg-accent-dim border-accent text-accent-bright font-semibold"
                        : "border-transparent text-text-2 hover:text-text-1 hover:bg-bg-2"
                    )}
                  >
                    <span className="w-3 flex-none flex justify-center text-text-4 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                      <GripVertical size={13} />
                    </span>
                    <Icon size={15} />
                    <span className="flex-1">{it.label}</span>
                    {hasChildren && (
                      <ChevronDown size={13} className={cn("text-text-3 transition-transform", expanded && "rotate-180")} />
                    )}
                  </span>
                );
                return (
                  <div
                    key={it.id}
                    draggable
                    onDragStart={(e) => {
                      setDrag({ group: g.group, id: it.id });
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnter={() => {
                      if (drag && drag.group === g.group) setOverId(it.id);
                    }}
                    onDragOver={(e) => {
                      if (drag && drag.group === g.group) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (drag && drag.group === g.group) reorder(g.group, drag.id, it.id);
                      setDrag(null);
                      setOverId(null);
                    }}
                    onDragEnd={() => {
                      setDrag(null);
                      setOverId(null);
                    }}
                    className={cn(isDragging && "opacity-40", isOver && "border-t-2 border-accent")}
                  >
                    {hasChildren ? (
                      <button type="button" className="block w-full text-left" onClick={() => setOpen((o) => ({ ...o, [it.id]: !o[it.id] }))}>
                        {row}
                      </button>
                    ) : (
                      <Link href={it.href!} draggable={false}>
                        {row}
                      </Link>
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
                              draggable={false}
                              className={cn(
                                "flex items-center gap-2 w-[calc(100%-8px)] mx-1 pl-9 pr-3 py-[7px] rounded-r-md border-l-2 text-[12.5px] transition-colors",
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
          );
        })}
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
