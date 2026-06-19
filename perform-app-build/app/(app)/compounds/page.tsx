"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { BloodConcentrationChart } from "@/components/charts/BloodConcentrationChart";
import {
  useProtocols,
  useCompoundCatalog,
  useCreateProtocol,
  useToggleProtocol,
  useDeleteProtocol,
  useLogDose,
  useDeleteDose,
  useUpdateDose,
  useAllDoses,
  useDoseHistory,
  useFavoriteCompounds,
  useToggleFavoriteCompound,
} from "@/hooks/useCompounds";
import {
  CompoundProtocol,
  ProtocolCompound,
  CompoundCatalogItem,
  CompoundType,
  DoseLog,
  Frequency,
} from "@/types/database";
import { todayISO, formatDate, getNextDoseInfo, FREQUENCY_HOURS, cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChevronDown,
  FlaskConical,
  Syringe,
  X,
  Pill,
  Activity,
  Clock,
  Calendar,
  Calculator,
  Check,
  Star,
  Search,
  ListChecks,
  Pencil,
  History,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const FREQUENCIES: Frequency[] = [
  "Daily",
  "EOD",
  "E3D",
  "Twice/week",
  "Weekly",
  "Twice/day",
];

// Hours until the next dose is due for a compound (negative = overdue / never logged)
function hoursUntilDose(c: ProtocolCompound): number {
  if (!c.last_dose?.logged_at) return -1; // never logged → due now
  const hrs = FREQUENCY_HOURS[c.frequency] || 24;
  const next = new Date(c.last_dose.logged_at).getTime() + hrs * 3600000;
  return (next - Date.now()) / 3600000;
}

// Whether an ISO timestamp falls on the current calendar day
function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// Compact "time remaining" countdown
function formatCountdown(h: number): string {
  if (h <= 0) return "due now";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 24) {
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(h / 24);
  const rem = Math.round(h % 24);
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

export default function CompoundsPage() {
  const [protoModal, setProtoModal] = useState(false);
  const [doseModal, setDoseModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"protocols" | "bloodlevels">(
    "protocols"
  );
  const { data: protocols = [] } = useProtocols();
  const toggleProto = useToggleProtocol();
  const deleteProto = useDeleteProtocol();

  // Re-render every minute to update countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeProtocols = protocols.filter((p) => p.is_active);
  const allCompounds = protocols.flatMap((p) => p.compounds ?? []);

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Compound Protocols"
        subtitle="Track your cycles, peptides, ancillaries, and supplements"
        action={
          <div className="flex gap-2">
            <Link href="/peptide-calculator" className="btn btn-ghost">
              <Calculator size={16} /> Dose Calculator
            </Link>
            <Link href="/catalog/compounds" className="btn btn-ghost">
              <Pill size={16} /> Catalog
            </Link>
            <button
              className="btn btn-ghost"
              onClick={() => setDoseModal(true)}
              disabled={protocols.length === 0}
            >
              Log Dose <Syringe size={16} />
            </button>
            <button className="btn btn-primary" onClick={() => setProtoModal(true)}>
              <Plus size={16} /> New Protocol
            </button>
          </div>
        }
      />

      {/* Summary stats */}
      {protocols.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 animate-fade-in">
          <div className="stat-card">
            <div className="text-[11px] text-text-3 mb-1">Active Protocols</div>
            <div className="text-2xl font-bold text-accent">{activeProtocols.length}</div>
            <div className="text-[11px] text-text-3 mt-0.5">of {protocols.length} total</div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] text-text-3 mb-1">Compounds Running</div>
            <div className="text-2xl font-bold text-text-1">
              {activeProtocols.flatMap((p) => p.compounds ?? []).length}
            </div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] text-text-3 mb-1">Overdue Doses</div>
            <div className="text-2xl font-bold text-status-red">
              {allCompounds.filter((c) => {
                const info = getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency);
                return info.status === "overdue";
              }).length}
            </div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] text-text-3 mb-1">Due Soon</div>
            <div className="text-2xl font-bold text-status-amber">
              {allCompounds.filter((c) => hoursUntilDose(c) >= 0 && hoursUntilDose(c) <= 72).length}
            </div>
            <div className="text-[11px] text-text-3 mt-0.5">within 72h</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-bg-2 p-1 rounded-xl w-fit border border-border">
        <button
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
            activeTab === "protocols"
              ? "bg-accent text-white shadow-sm"
              : "text-text-2 hover:text-text-1"
          )}
          onClick={() => setActiveTab("protocols")}
        >
          <span className="flex items-center gap-1.5">
            <FlaskConical size={14} />
            Protocols
          </span>
        </button>
        <button
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
            activeTab === "bloodlevels"
              ? "bg-accent text-white shadow-sm"
              : "text-text-2 hover:text-text-1"
          )}
          onClick={() => setActiveTab("bloodlevels")}
        >
          <span className="flex items-center gap-1.5">
            <Activity size={14} />
            Blood Levels
          </span>
        </button>
      </div>

      {/* Protocols tab */}
      {activeTab === "protocols" && (
        <div className="tab-panel">
          {protocols.length === 0 ? (
            <div className="card text-center py-12">
              <FlaskConical className="mx-auto mb-3 text-text-3" size={32} />
              <div className="text-text-3 text-sm">
                No protocols yet. Click &quot;New Protocol&quot; to create your first cycle.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              <div className="space-y-2">
                {protocols.map((p) => (
                  <ProtocolRow
                    key={p.id}
                    protocol={p}
                    expanded={expanded === p.id}
                    onToggleExpand={() =>
                      setExpanded(expanded === p.id ? null : p.id)
                    }
                    onToggleActive={() =>
                      toggleProto.mutate({ id: p.id, active: !p.is_active })
                    }
                    onDelete={() => {
                      deleteProto.mutate(p.id);
                      toast.success("Protocol deleted");
                    }}
                  />
                ))}
              </div>
              <TodayChecklist protocols={activeProtocols} />
            </div>
          )}

          {protocols.length > 0 && <RecentDoses protocols={protocols} />}
        </div>
      )}

      {/* Blood Levels tab */}
      {activeTab === "bloodlevels" && (
        <div className="tab-panel space-y-4">
          {protocols.length === 0 ? (
            <div className="card text-center py-12">
              <Activity className="mx-auto mb-3 text-text-3" size={32} />
              <div className="text-text-3 text-sm">
                No protocols yet. Create a protocol and log doses to see blood concentration curves.
              </div>
            </div>
          ) : (
            protocols.map((p) => (
              <BloodLevelsCard key={p.id} protocol={p} />
            ))
          )}
        </div>
      )}

      <NewProtocolModal open={protoModal} onClose={() => setProtoModal(false)} />
      <LogDoseModal
        open={doseModal}
        onClose={() => setDoseModal(false)}
        protocols={protocols}
      />
    </div>
  );
}

// ─── TODAY CHECKLIST ──────────────────────────────────────────────────────────
type ChecklistEntry = {
  c: ProtocolCompound;
  protocolId: string;
  protocolName: string;
  hoursUntil: number; // negative = overdue
  info: ReturnType<typeof getNextDoseInfo>;
  doneToday: boolean; // a dose was already logged today (persisted in DB)
};

function TodayChecklist({ protocols }: { protocols: CompoundProtocol[] }) {
  const logDose = useLogDose();
  const deleteDose = useDeleteDose();
  // Tracks compounds with an in-flight log/unlog so the button can't double-fire
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const entries: ChecklistEntry[] = protocols.flatMap((p) =>
    (p.compounds ?? []).map((c) => {
      const info = getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency);
      const hoursUntil = hoursUntilDose(c);
      const doneToday = isToday(c.last_dose?.logged_at);
      return { c, protocolId: p.id, protocolName: p.name, hoursUntil, info, doneToday };
    })
  );

  // Done-today doses stay visible in the top group regardless of the next-dose clock.
  const dueToday = entries
    .filter((e) => e.doneToday || e.hoursUntil < 24)
    .sort((a, b) => a.hoursUntil - b.hoursUntil);
  // Due-soon = next dose within 72h (but not already taken today).
  const upcoming = entries
    .filter((e) => !e.doneToday && e.hoursUntil >= 24 && e.hoursUntil < 72)
    .sort((a, b) => a.hoursUntil - b.hoursUntil);

  function toggle(e: ChecklistEntry) {
    if (pending[e.c.id]) return;
    setPending((d) => ({ ...d, [e.c.id]: true }));

    if (e.doneToday && e.c.last_dose?.id) {
      // Uncheck → remove today's dose (persists because it's DB-backed)
      deleteDose.mutate(e.c.last_dose.id, {
        onSuccess: () => toast.success(`${e.c.compound_name} dose removed`),
        onError: (err) => toast.error(err.message),
        onSettled: () => setPending((d) => ({ ...d, [e.c.id]: false })),
      });
      return;
    }

    logDose.mutate(
      {
        protocol_id: e.protocolId,
        protocol_compound_id: e.c.id,
        compound_name: e.c.compound_name,
        compound_unit: e.c.compound_unit,
        dose_amount: e.c.dose,
        logged_at: new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success(`${e.c.compound_name} logged`),
        onError: (err) => toast.error(err.message),
        onSettled: () => setPending((d) => ({ ...d, [e.c.id]: false })),
      }
    );
  }

  return (
    <div className="card h-fit lg:sticky lg:top-4 animate-fade-in">
      <div className="card-title flex items-center gap-2 mb-3">
        <ListChecks size={15} className="text-accent" /> Today&apos;s Checklist
      </div>

      {dueToday.length === 0 && upcoming.length === 0 && (
        <div className="text-xs text-text-3 py-4 text-center">
          Nothing scheduled. Log a dose to start tracking timing.
        </div>
      )}

      {dueToday.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wide text-text-3 mb-1.5">Due now / today</div>
          <div className="space-y-1.5">
            {dueToday.map((e) => (
              <ChecklistItem key={e.c.id} entry={e} pending={!!pending[e.c.id]} onToggle={() => toggle(e)} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-text-3 mb-1.5">Due soon · next 72h</div>
          <div className="space-y-1.5">
            {upcoming.map((e) => (
              <ChecklistItem key={e.c.id} entry={e} pending={!!pending[e.c.id]} onToggle={() => toggle(e)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistItem({
  entry,
  pending,
  onToggle,
}: {
  entry: ChecklistEntry;
  pending: boolean;
  onToggle: () => void;
}) {
  const { c, info, hoursUntil, doneToday } = entry;
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all duration-300",
        doneToday
          ? "border-status-green/40 bg-status-green/10"
          : "border-border bg-bg-2 hover:border-border-2"
      )}
    >
      <button
        onClick={onToggle}
        disabled={pending}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all disabled:opacity-50",
          doneToday
            ? "bg-status-green border-status-green scale-110 hover:bg-status-green/80"
            : "border-border-2 hover:border-accent"
        )}
        title={doneToday ? "Uncheck — remove today's dose" : "Mark dose taken"}
      >
        {doneToday && <Check size={14} className="text-white animate-fade-in" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn("text-[13px] font-medium truncate", doneToday && "line-through text-text-3")}>
          {c.compound_name}
        </div>
        <div className="text-[10px] text-text-3">
          {c.dose} {c.compound_unit} · {c.frequency}
        </div>
      </div>
      {!doneToday &&
        (info.dueToday ? (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 bg-status-red/15 text-status-red ring-1 ring-inset ring-status-red/30 animate-pulse-glow">
            <Clock size={9} />
            Due Now
          </span>
        ) : (
          <span
            className={cn(
              "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1",
              info.status === "urgent" && "bg-status-amber/10 text-status-amber",
              info.status === "ok" && "bg-status-green/10 text-status-green",
              info.status === "none" && "bg-bg-3 text-text-3"
            )}
          >
            <Clock size={9} />
            {formatCountdown(hoursUntil)}
          </span>
        ))}
      {doneToday && <span className="text-[10px] text-status-green font-semibold shrink-0">Done</span>}
    </div>
  );
}

// ─── RECENT DOSES (edit / delete logged injections) ──────────────────────────
function RecentDoses({ protocols }: { protocols: CompoundProtocol[] }) {
  const { data: doses = [] } = useAllDoses();
  const deleteDose = useDeleteDose();
  const [editing, setEditing] = useState<DoseLog | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const protoName = new Map(protocols.map((p) => [p.id, p.name]));

  // useAllDoses returns ascending; show most-recent first.
  const sorted = [...doses].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );
  const visible = showAll ? sorted : sorted.slice(0, 8);

  function handleDelete(id: string) {
    deleteDose.mutate(id, {
      onSuccess: () => toast.success("Dose deleted"),
      onError: (e) => toast.error(e.message),
    });
    setConfirmId(null);
  }

  return (
    <div className="card mt-4 animate-fade-in">
      <div className="card-title flex items-center gap-2">
        <History size={15} className="text-accent" /> Recent Doses
      </div>

      {sorted.length === 0 ? (
        <div className="text-xs text-text-3 py-6 text-center">
          No doses logged yet. Use &quot;Log Dose&quot; or the checklist to record an injection.
        </div>
      ) : (
        <div className="space-y-1.5">
          {visible.map((d) => (
            <div
              key={d.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-bg-2 px-3 py-2 transition-all hover:border-border-2"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
                <Syringe size={14} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">
                  {d.compound_name}
                  <span className="text-text-3 font-normal">
                    {" "}· {d.dose_amount} {d.compound_unit}
                  </span>
                </div>
                <div className="text-[10px] text-text-3 truncate">
                  {new Date(d.logged_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {protoName.get(d.protocol_id) ? ` · ${protoName.get(d.protocol_id)}` : ""}
                  {d.injection_site ? ` · ${d.injection_site}` : ""}
                  {d.notes ? ` · ${d.notes}` : ""}
                </div>
              </div>

              {confirmId === d.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(d.id)}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-1.5 rounded-md text-text-3 hover:text-accent hover:bg-bg-3 transition-colors"
                    onClick={() => setEditing(d)}
                    title="Edit dose"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="p-1.5 rounded-md text-text-3 hover:text-status-red hover:bg-bg-3 transition-colors"
                    onClick={() => setConfirmId(d.id)}
                    title="Delete dose"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {sorted.length > 8 && (
            <button
              className="btn btn-ghost btn-sm w-full mt-1"
              onClick={() => setShowAll((s) => !s)}
            >
              {showAll ? "Show less" : `Show all ${sorted.length} doses`}
            </button>
          )}
        </div>
      )}

      <EditDoseModal dose={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function EditDoseModal({
  dose,
  onClose,
}: {
  dose: DoseLog | null;
  onClose: () => void;
}) {
  const updateDose = useUpdateDose();
  const [amount, setAmount] = useState("");
  const [datetime, setDatetime] = useState("");
  const [site, setSite] = useState("");
  const [notes, setNotes] = useState("");

  // Hydrate fields whenever a new dose is selected for editing.
  useEffect(() => {
    if (dose) {
      setAmount(String(dose.dose_amount ?? ""));
      // Convert the stored UTC timestamp to a local datetime-local value.
      const d = new Date(dose.logged_at);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDatetime(local);
      setSite(dose.injection_site ?? "");
      setNotes(dose.notes ?? "");
    }
  }, [dose]);

  function handleSave() {
    if (!dose) return;
    if (!datetime) {
      toast.error("Pick a date & time");
      return;
    }
    const doseAmount = parseFloat(amount);
    if (!doseAmount || doseAmount <= 0) {
      toast.error("Enter a dose amount");
      return;
    }
    updateDose.mutate(
      {
        id: dose.id,
        dose_amount: doseAmount,
        logged_at: new Date(datetime).toISOString(),
        injection_site: site || null,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Dose updated");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={!!dose} onClose={onClose} title="Edit Dose">
      <div className="space-y-3">
        <div className="text-sm font-medium">
          {dose?.compound_name}
          <span className="text-text-3"> ({dose?.compound_unit})</span>
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Dose amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="200"
            />
          </div>
          <div className="flex-1">
            <label className="label">Date &amp; Time</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Injection site</label>
          <input
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="e.g. left delt, right glute"
          />
        </div>
        <div>
          <label className="label">Notes (batch/lot, etc.)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={updateDose.isPending}
          >
            Save Changes
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── BLOOD LEVELS CARD ────────────────────────────────────────────────────────
function BloodLevelsCard({ protocol }: { protocol: CompoundProtocol }) {
  const { data: doses = [] } = useDoseHistory(protocol.id);
  const compounds = protocol.compounds ?? [];

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="text-accent" size={16} />
          <span className="font-semibold text-sm">{protocol.name}</span>
          <Badge variant={protocol.is_active ? "accent" : "teal"}>
            {protocol.is_active ? "Active" : "Paused"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-text-3">
          <Calendar size={12} />
          {formatDate(protocol.start_date)}
          {protocol.end_date && <> → {formatDate(protocol.end_date)}</>}
        </div>
      </div>

      <div className="text-[11px] text-text-3 mb-4">
        Simulated plasma concentration based on {doses.length} logged dose
        {doses.length !== 1 ? "s" : ""} · Half-life pharmacokinetics model
      </div>

      <BloodConcentrationChart compounds={compounds} doses={doses} />

      {/* Compound summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        {compounds.map((c) => {
          const info = getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency);
          return (
            <div key={c.id} className="card-sm">
              <div className="text-xs font-medium text-text-1">{c.compound_name}</div>
              <div className="text-[11px] text-text-3 mt-0.5">
                {c.dose} {c.compound_unit} · {c.frequency}
              </div>
              <div
                className={cn(
                  "text-[11px] font-medium mt-1 flex items-center gap-1",
                  info.status === "overdue" && "text-status-red",
                  info.status === "urgent" && "text-status-amber",
                  info.status === "ok" && "text-status-green",
                  info.status === "none" && "text-text-3"
                )}
              >
                <Clock size={10} />
                {info.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PROTOCOL ROW ─────────────────────────────────────────────────────────────
function ProtocolRow({
  protocol,
  expanded,
  onToggleExpand,
  onToggleActive,
  onDelete,
}: {
  protocol: CompoundProtocol;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-bg-2 border border-border rounded-xl overflow-hidden transition-all hover:border-border-2">
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-dim flex items-center justify-center">
            <FlaskConical className="text-accent" size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold">{protocol.name}</div>
            <div className="text-[11px] text-text-2 mt-0.5">
              {formatDate(protocol.start_date)} →{" "}
              {protocol.end_date ? formatDate(protocol.end_date) : "No end"} ·{" "}
              {protocol.compounds?.length || 0} compound
              {(protocol.compounds?.length || 0) !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={protocol.is_active ? "accent" : "teal"}>
            {protocol.is_active ? "Active" : "Paused"}
          </Badge>
          <ChevronDown
            size={16}
            className={cn(
              "text-text-3 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t border-border bg-bg-1">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-text-3">
                  <th className="text-left py-2 pr-4">Compound</th>
                  <th className="text-left py-2 pr-4">Dose</th>
                  <th className="text-left py-2 pr-4">Frequency</th>
                  <th className="text-left py-2 pr-4">Scheduled</th>
                  <th className="text-left py-2 pr-4">Next Dose</th>
                  <th className="text-left py-2">Last Logged</th>
                </tr>
              </thead>
              <tbody>
                {protocol.compounds?.map((c) => {
                  const next = getNextDoseInfo(
                    c.last_dose?.logged_at || null,
                    c.frequency
                  );
                  return (
                    <tr key={c.id} className="border-t border-border/50">
                      <td className="py-2.5 pr-4 font-medium">{c.compound_name}</td>
                      <td className="py-2.5 pr-4 text-text-2">
                        {c.dose} {c.compound_unit}
                      </td>
                      <td className="py-2.5 pr-4 text-text-2">{c.frequency}</td>
                      <td className="py-2.5 pr-4 text-text-2">
                        {c.scheduled_time?.slice(0, 5) || "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={cn(
                            "font-semibold tabular-nums text-xs px-2 py-0.5 rounded-full",
                            next.status === "overdue" &&
                              "bg-status-red/10 text-status-red",
                            next.status === "urgent" &&
                              "bg-status-amber/10 text-status-amber",
                            next.status === "ok" &&
                              "bg-status-green/10 text-status-green",
                            next.status === "none" && "text-text-3"
                          )}
                        >
                          {next.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-text-3 text-[11px]">
                        {c.last_dose
                          ? new Date(c.last_dose.logged_at).toLocaleDateString()
                          : "Not logged"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-ghost btn-sm" onClick={onToggleActive}>
              {protocol.is_active ? "Pause Protocol" : "Activate"}
            </button>
            <button className="btn btn-danger btn-sm" onClick={onDelete}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NEW PROTOCOL MODAL ───────────────────────────────────────────────────────
type DraftCompound = {
  compound_catalog_id: string;
  dose: string;
  frequency: Frequency;
  scheduled_time: string;
};

function NewProtocolModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: catalog = [] } = useCompoundCatalog();
  const createProto = useCreateProtocol();
  const [name, setName] = useState("");
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState("");
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [compounds, setCompounds] = useState<DraftCompound[]>([
    { compound_catalog_id: "", dose: "", frequency: "Daily", scheduled_time: "08:00" },
  ]);

  function addCompound() {
    setCompounds([
      ...compounds,
      { compound_catalog_id: "", dose: "", frequency: "Daily", scheduled_time: "08:00" },
    ]);
  }

  function updateCompound(i: number, patch: Partial<DraftCompound>) {
    setCompounds(compounds.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function removeCompound(i: number) {
    setCompounds(compounds.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    if (!name) {
      toast.error("Enter a protocol name");
      return;
    }
    const resolved = compounds
      .filter((c) => c.compound_catalog_id)
      .map((c) => {
        const cat = catalog.find((cc) => cc.id === c.compound_catalog_id);
        return {
          compound_catalog_id: c.compound_catalog_id,
          compound_name: cat?.name || "",
          compound_unit: cat?.unit || "mg",
          half_life_hours: cat?.half_life_hours || null,
          dose: parseFloat(c.dose) || 0,
          frequency: c.frequency,
          scheduled_time: c.scheduled_time + ":00",
        };
      });
    if (resolved.length === 0) {
      toast.error("Add at least one compound");
      return;
    }
    createProto.mutate(
      { name, start_date: start, end_date: end || null, compounds: resolved },
      {
        onSuccess: () => {
          toast.success("Protocol created");
          setName("");
          setEnd("");
          setCompounds([
            {
              compound_catalog_id: "",
              dose: "",
              frequency: "Daily",
              scheduled_time: "08:00",
            },
          ]);
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <>
    <Modal open={open} onClose={onClose} title="Create Protocol / Cycle" wide>
      <div className="space-y-3">
        <div className="flex gap-2.5 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Protocol name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Test E Bulk Cycle"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="label">Start date</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="label">End date</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="card-title pt-2">Compounds in this protocol</div>
        {compounds.map((c, i) => {
          const cat = catalog.find((cc) => cc.id === c.compound_catalog_id);
          return (
            <div key={i} className="card-sm">
              <div className="flex gap-2.5 items-end flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="label">Compound</label>
                  <button
                    type="button"
                    className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-bg-2 hover:border-border-2 transition-colors text-sm"
                    onClick={() => setPickerFor(i)}
                  >
                    <span className={cn("truncate", !cat && "text-text-3")}>
                      {cat ? cat.name : "Select compound..."}
                    </span>
                    <Search size={13} className="text-text-3 shrink-0" />
                  </button>
                </div>
                <div className="w-24">
                  <label className="label">Dose ({cat?.unit || "mg"})</label>
                  <input
                    type="number"
                    value={c.dose}
                    onChange={(e) => updateCompound(i, { dose: e.target.value })}
                    placeholder="200"
                  />
                </div>
                <div className="w-28">
                  <label className="label">Frequency</label>
                  <select
                    value={c.frequency}
                    onChange={(e) =>
                      updateCompound(i, {
                        frequency: e.target.value as Frequency,
                      })
                    }
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="label">Time</label>
                  <input
                    type="time"
                    value={c.scheduled_time}
                    onChange={(e) =>
                      updateCompound(i, { scheduled_time: e.target.value })
                    }
                  />
                </div>
                {compounds.length > 1 && (
                  <button
                    className="btn btn-danger btn-sm !px-2 mb-0.5"
                    onClick={() => removeCompound(i)}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <button className="btn btn-ghost btn-sm" onClick={addCompound}>
          <Plus size={14} /> Add compound
        </button>

        <div className="flex gap-2 pt-2">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Protocol
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>

    <CompoundPicker
      open={pickerFor !== null}
      onClose={() => setPickerFor(null)}
      catalog={catalog}
      onPick={(cc) => {
        if (pickerFor !== null) updateCompound(pickerFor, { compound_catalog_id: cc.id });
        setPickerFor(null);
      }}
    />
    </>
  );
}

// ─── COMPOUND PICKER (search + category filter + favorites) ───────────────────
function CompoundPicker({
  open,
  onClose,
  catalog,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  catalog: CompoundCatalogItem[];
  onPick: (c: CompoundCatalogItem) => void;
}) {
  const { data: favorites = [] } = useFavoriteCompounds();
  const toggleFav = useToggleFavoriteCompound();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CompoundType | "All" | "Favorites">("All");

  const favSet = new Set(favorites);
  const types: (CompoundType | "All" | "Favorites")[] = [
    "All",
    "Favorites",
    "Steroid",
    "Peptide",
    "GLP-1",
    "SARMs",
    "Ancillary",
    "AI / SERM",
    "Supplement",
  ];

  const filtered = catalog
    .filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter === "All") return true;
      if (typeFilter === "Favorites") return favSet.has(c.id);
      return c.type === typeFilter;
    })
    .sort((a, b) => {
      const fa = favSet.has(a.id) ? 0 : 1;
      const fb = favSet.has(b.id) ? 0 : 1;
      return fa - fb || a.name.localeCompare(b.name);
    });

  return (
    <Modal open={open} onClose={onClose} title="Select Compound" wide>
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search compounds..."
            className="!pl-9"
            autoFocus
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-full border transition-all",
                typeFilter === t
                  ? "bg-accent-dim text-accent border-accent/40"
                  : "border-border text-text-3 hover:text-text-1"
              )}
            >
              {t === "Favorites" ? "★ Favorites" : t}
            </button>
          ))}
        </div>
        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 bg-bg-2 hover:bg-bg-3 border border-border rounded-lg px-3 py-2 transition-all"
            >
              <button
                className="text-text-3 hover:text-status-amber transition-colors shrink-0"
                onClick={() => toggleFav.mutate(c.id)}
                title="Favorite"
              >
                <Star size={15} className={favSet.has(c.id) ? "fill-status-amber text-status-amber" : ""} />
              </button>
              <button className="min-w-0 flex-1 text-left" onClick={() => onPick(c)}>
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-[10px] text-text-3">
                  {c.type} · {c.unit}
                  {c.half_life_hours ? ` · t½ ${c.half_life_hours}h` : ""}
                </div>
              </button>
              <button className="btn btn-primary btn-sm shrink-0" onClick={() => onPick(c)}>
                <Plus size={13} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-text-3 text-sm py-6">No compounds match.</div>
          )}
        </div>
        <div className="flex justify-end">
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── LOG DOSE MODAL ───────────────────────────────────────────────────────────
function LogDoseModal({
  open,
  onClose,
  protocols,
}: {
  open: boolean;
  onClose: () => void;
  protocols: CompoundProtocol[];
}) {
  const logDose = useLogDose();
  const [protoId, setProtoId] = useState("");
  const [compoundName, setCompoundName] = useState("");
  const [amount, setAmount] = useState("");
  const [datetime, setDatetime] = useState(() => {
    // Local time for the datetime-local input (toISOString would be UTC).
    const n = new Date();
    return new Date(n.getTime() - n.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [site, setSite] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProto = protocols.find((p) => p.id === protoId);

  useEffect(() => {
    if (protocols.length && !protoId) {
      setProtoId(protocols[0].id);
    }
  }, [protocols, protoId]);

  useEffect(() => {
    if (selectedProto?.compounds?.length) {
      setCompoundName(selectedProto.compounds[0].compound_name);
    }
  }, [selectedProto]);

  function handleLog() {
    if (!protoId || !compoundName || !datetime) {
      toast.error("Fill in all required fields");
      return;
    }
    const doseAmount = parseFloat(amount);
    if (!doseAmount || doseAmount <= 0) {
      toast.error("Enter a dose amount");
      return;
    }
    const comp = selectedProto?.compounds?.find(
      (c) => c.compound_name === compoundName
    );
    logDose.mutate(
      {
        protocol_id: protoId,
        compound_name: compoundName,
        compound_unit: comp?.compound_unit || "mg",
        dose_amount: doseAmount,
        logged_at: new Date(datetime).toISOString(),
        injection_site: site || null,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Dose logged");
          setAmount("");
          setSite("");
          setNotes("");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Log a Dose">
      <div className="space-y-3">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Protocol</label>
            <select value={protoId} onChange={(e) => setProtoId(e.target.value)}>
              {protocols.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Compound</label>
            <select
              value={compoundName}
              onChange={(e) => setCompoundName(e.target.value)}
            >
              {selectedProto?.compounds?.map((c) => (
                <option key={c.id}>{c.compound_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Dose amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="200"
            />
          </div>
          <div className="flex-1">
            <label className="label">Date &amp; Time</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Injection site</label>
          <input
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="e.g. left delt, right glute"
          />
        </div>
        <div>
          <label className="label">Notes (batch/lot, etc.)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn btn-primary" onClick={handleLog}>
            Log Dose
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
