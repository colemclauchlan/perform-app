"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { DashboardSwitcher } from "@/components/DashboardSwitcher";
import { BloodConcentrationChart } from "@/components/charts/BloodConcentrationChart";
import {
  useProtocols,
  useAllDoses,
  useLogDose,
  useDoseHistory,
} from "@/hooks/useCompounds";
import { CompoundProtocol } from "@/types/database";
import { getNextDoseInfo, FREQUENCY_HOURS, formatDate, cn } from "@/lib/utils";
import {
  FlaskConical,
  Syringe,
  Clock,
  Check,
  Calculator,
  TestTubes,
  Activity,
  Calendar,
  ListChecks,
} from "lucide-react";
import toast from "react-hot-toast";

function StatCard({
  label,
  value,
  sub,
  tone = "accent",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "accent" | "green" | "red" | "amber";
  icon?: React.ReactNode;
}) {
  const toneMap = {
    accent: "text-accent",
    green: "text-status-green",
    red: "text-status-red",
    amber: "text-status-amber",
  };
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-text-3 uppercase tracking-wider">{label}</div>
          <div className={cn("text-2xl font-bold mt-1.5 leading-none", toneMap[tone])}>{value}</div>
          {sub && <div className="text-[11px] text-text-3 mt-1.5">{sub}</div>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-dim">
            <div className="text-accent">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PedDashboardPage() {
  const { data: protocols = [] } = useProtocols();
  const { data: allDoses = [] } = useAllDoses();
  const logDose = useLogDose();
  const [done, setDone] = useState<Record<string, boolean>>({});

  const activeProtocols = protocols.filter((p) => p.is_active);
  const allCompounds = activeProtocols.flatMap((p) =>
    (p.compounds ?? []).map((c) => ({ c, p }))
  );

  const dueToday = allCompounds
    .map(({ c, p }) => {
      const info = getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency);
      const hrs = FREQUENCY_HOURS[c.frequency] || 24;
      const hoursUntil = c.last_dose?.logged_at
        ? (new Date(c.last_dose.logged_at).getTime() + hrs * 3600000 - Date.now()) / 3600000
        : -1;
      return { c, p, info, hoursUntil };
    })
    .filter((e) => e.hoursUntil < 24)
    .sort((a, b) => a.hoursUntil - b.hoursUntil);

  const overdueCount = allCompounds.filter(
    ({ c }) => getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency).status === "overdue"
  ).length;

  const recentDoses = [...allDoses]
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    .slice(0, 8);

  function complete(e: (typeof dueToday)[number]) {
    if (done[e.c.id]) return;
    setDone((d) => ({ ...d, [e.c.id]: true }));
    logDose.mutate(
      {
        protocol_id: e.p.id,
        protocol_compound_id: e.c.id,
        compound_name: e.c.compound_name,
        compound_unit: e.c.compound_unit,
        dose_amount: e.c.dose,
        logged_at: new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success(`${e.c.compound_name} logged`),
        onError: (err) => {
          toast.error(err.message);
          setDone((d) => ({ ...d, [e.c.id]: false }));
        },
      }
    );
  }

  return (
    <div className="p-6 max-w-[1200px]">
      <DashboardSwitcher />
      <PageHeader
        title="PED Dashboard"
        subtitle="Cycle overview, dose schedule and simulated blood levels"
        action={
          <div className="flex gap-2">
            <Link href="/peptide-calculator" className="btn btn-ghost">
              <Calculator size={16} /> Dose Calculator
            </Link>
            <Link href="/compounds" className="btn btn-primary">
              <FlaskConical size={16} /> Protocols
            </Link>
          </div>
        }
      />

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 mb-5">
        <QuickLink href="/compounds" icon={<FlaskConical size={15} className="text-accent" />} label="Manage Protocols" />
        <QuickLink href="/peptide-calculator" icon={<Calculator size={15} className="text-status-teal" />} label="Reconstitution Calc" />
        <QuickLink href="/bloodwork" icon={<TestTubes size={15} className="text-status-coral" />} label="Bloodwork" />
        <QuickLink href="/catalog/compounds" icon={<Syringe size={15} className="text-accent" />} label="Compound Catalog" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Active Protocols" value={activeProtocols.length} sub={`${protocols.length} total`} icon={<FlaskConical size={18} />} />
        <StatCard label="Compounds Running" value={allCompounds.length} icon={<Syringe size={18} />} />
        <StatCard label="Doses Due Today" value={dueToday.length} tone={dueToday.length ? "amber" : "green"} icon={<Clock size={18} />} />
        <StatCard label="Overdue" value={overdueCount} tone={overdueCount ? "red" : "green"} icon={<Activity size={18} />} />
      </div>

      {activeProtocols.length === 0 ? (
        <div className="card text-center py-12">
          <FlaskConical className="mx-auto mb-3 text-text-3" size={32} />
          <div className="text-text-3 text-sm mb-3">No active protocols.</div>
          <Link href="/compounds" className="btn btn-primary mx-auto">
            <FlaskConical size={15} /> Create a protocol
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          <div className="space-y-4">
            {/* Cycle progress */}
            <div className="card">
              <div className="card-title flex items-center gap-2">
                <Calendar size={15} className="text-accent" /> Cycle Progress
              </div>
              <div className="space-y-3 mt-1">
                {activeProtocols.map((p) => (
                  <CycleProgress key={p.id} protocol={p} />
                ))}
              </div>
            </div>

            {/* Blood levels */}
            {activeProtocols.map((p) => (
              <PedBloodCard key={p.id} protocol={p} />
            ))}

            {/* Recent doses */}
            <div className="card">
              <div className="card-title flex items-center gap-2">
                <Syringe size={15} className="text-accent" /> Recent Doses
              </div>
              {recentDoses.length === 0 ? (
                <div className="text-text-3 text-sm py-2">No doses logged yet.</div>
              ) : (
                <div className="space-y-1 mt-1">
                  {recentDoses.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-[13px] bg-bg-2 rounded-lg px-3 py-2 border border-border/50">
                      <div className="min-w-0">
                        <span className="font-medium truncate">{d.compound_name}</span>
                        {d.injection_site && (
                          <span className="text-text-3 ml-1.5 text-[11px]">· {d.injection_site}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-text-2 text-xs">{d.dose_amount} {d.compound_unit}</span>
                        <span className="text-text-3 text-[11px]">
                          {new Date(d.logged_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Today's checklist sidebar */}
          <div className="card h-fit lg:sticky lg:top-4">
            <div className="card-title flex items-center gap-2 mb-3">
              <ListChecks size={15} className="text-accent" /> Today&apos;s Doses
            </div>
            {dueToday.length === 0 ? (
              <div className="text-xs text-text-3 py-4 text-center">All caught up for today.</div>
            ) : (
              <div className="space-y-1.5">
                {dueToday.map((e) => {
                  const isDone = !!done[e.c.id];
                  return (
                    <div
                      key={e.c.id}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all duration-300",
                        isDone ? "border-status-green/40 bg-status-green/10" : "border-border bg-bg-2 hover:border-border-2"
                      )}
                    >
                      <button
                        onClick={() => complete(e)}
                        disabled={isDone}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                          isDone ? "bg-status-green border-status-green scale-110" : "border-border-2 hover:border-accent"
                        )}
                      >
                        {isDone && <Check size={14} className="text-white animate-fade-in" strokeWidth={3} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-[13px] font-medium truncate", isDone && "line-through text-text-3")}>
                          {e.c.compound_name}
                        </div>
                        <div className="text-[10px] text-text-3">
                          {e.c.dose} {e.c.compound_unit} · {e.c.frequency}
                        </div>
                      </div>
                      {!isDone && (
                        <span
                          className={cn(
                            "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full shrink-0",
                            e.info.status === "overdue" && "bg-status-red/10 text-status-red",
                            e.info.status === "urgent" && "bg-status-amber/10 text-status-amber",
                            e.info.status === "ok" && "bg-status-green/10 text-status-green",
                            e.info.status === "none" && "bg-bg-3 text-text-3"
                          )}
                        >
                          {e.info.status === "none" ? "Due" : e.info.label.replace("Overdue ", "−")}
                        </span>
                      )}
                      {isDone && <span className="text-[10px] text-status-green font-semibold shrink-0">Done</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-border bg-bg-2 hover:border-accent/40 hover:bg-bg-3 px-3.5 py-2.5 text-sm text-text-2 hover:text-text-1 transition-colors"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function CycleProgress({ protocol }: { protocol: CompoundProtocol }) {
  const start = new Date(protocol.start_date).getTime();
  const now = Date.now();
  const elapsedDays = Math.max(0, Math.floor((now - start) / 86400000));
  const weekNum = Math.floor(elapsedDays / 7) + 1;

  let pct = 0;
  let totalWeeks: number | null = null;
  if (protocol.end_date) {
    const end = new Date(protocol.end_date).getTime();
    totalWeeks = Math.max(1, Math.round((end - start) / (7 * 86400000)));
    pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{protocol.name}</span>
          <Badge variant="accent">Week {weekNum}{totalWeeks ? ` / ${totalWeeks}` : ""}</Badge>
        </div>
        <span className="text-[11px] text-text-3">
          {formatDate(protocol.start_date)}
          {protocol.end_date ? ` → ${formatDate(protocol.end_date)}` : ""}
        </span>
      </div>
      <div className="h-2 bg-bg-3 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full progress-bar bg-accent"
          style={{ width: protocol.end_date ? `${pct}%` : "100%", opacity: protocol.end_date ? 1 : 0.4 }}
        />
      </div>
      <div className="text-[10px] text-text-3 mt-1">
        {protocol.end_date ? `${Math.round(pct)}% complete` : "Open-ended · no end date set"}
      </div>
    </div>
  );
}

function PedBloodCard({ protocol }: { protocol: CompoundProtocol }) {
  const { data: doses = [] } = useDoseHistory(protocol.id);
  const compounds = protocol.compounds ?? [];

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="text-accent" size={16} />
          <span className="font-semibold text-sm">{protocol.name}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-text-3">
          <Clock size={12} /> Simulated blood level · {doses.length} dose{doses.length !== 1 ? "s" : ""}
        </div>
      </div>
      <BloodConcentrationChart compounds={compounds} doses={doses} />
    </div>
  );
}
