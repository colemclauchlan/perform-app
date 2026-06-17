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
  useDoseHistory,
} from "@/hooks/useCompounds";
import { CompoundProtocol, Frequency } from "@/types/database";
import { todayISO, formatDate, getNextDoseInfo, cn } from "@/lib/utils";
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
            <Link href="/catalog/compounds" className="btn btn-ghost">
              <Pill size={16} /> Catalog
            </Link>
            <button
              className="btn btn-ghost"
              onClick={() => setDoseModal(true)}
              disabled={protocols.length === 0}
            >
              <Syringe size={16} /> Log Dose
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
              {allCompounds.filter((c) => {
                const info = getNextDoseInfo(c.last_dose?.logged_at || null, c.frequency);
                return info.status === "urgent";
              }).length}
            </div>
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
          )}
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
                  <select
                    value={c.compound_catalog_id}
                    onChange={(e) =>
                      updateCompound(i, { compound_catalog_id: e.target.value })
                    }
                  >
                    <option value="">Select...</option>
                    {catalog.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
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
  const [datetime, setDatetime] = useState(
    new Date().toISOString().slice(0, 16)
  );
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
    const comp = selectedProto?.compounds?.find(
      (c) => c.compound_name === compoundName
    );
    logDose.mutate(
      {
        protocol_id: protoId,
        compound_name: compoundName,
        compound_unit: comp?.compound_unit || "mg",
        dose_amount: parseFloat(amount) || 0,
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
