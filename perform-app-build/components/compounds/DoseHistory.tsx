"use client";

import { useMemo, useState } from "react";
import { useAllDoses, useDeleteDose, EnrichedDose } from "@/hooks/useCompounds";
import { cn } from "@/lib/utils";
import { History, Syringe, ChevronDown, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";

type Group = {
  name: string;
  list: EnrichedDose[];
  total: number;
  unit: string;
  last: string | null;
};

// Complete dose history for every compound the user has logged — grouped by
// compound, each expandable to its full chronological log, with delete.
export function DoseHistory() {
  const { data: doses = [] } = useAllDoses();
  const deleteDose = useDeleteDose();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const groups = useMemo<Group[]>(() => {
    const byName = new Map<string, EnrichedDose[]>();
    [...doses]
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      .forEach((d) => {
        const list = byName.get(d.compound_name) ?? [];
        list.push(d);
        byName.set(d.compound_name, list);
      });
    return Array.from(byName.entries())
      .map(([name, list]) => ({
        name,
        list,
        total: Math.round(list.reduce((s, d) => s + (Number(d.dose_amount) || 0), 0) * 10) / 10,
        unit: list[0]?.compound_unit || "",
        last: list[0]?.logged_at ?? null,
      }))
      .sort((a, b) => new Date(b.last || 0).getTime() - new Date(a.last || 0).getTime());
  }, [doses]);

  const filtered = query.trim()
    ? groups.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase()))
    : groups;

  function remove(id: string) {
    deleteDose.mutate(id, {
      onSuccess: () => toast.success("Dose deleted"),
      onError: (e) => toast.error(e.message),
    });
    setConfirmId(null);
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="card-title mb-0 flex items-center gap-2">
          <History size={15} className="text-accent" /> Dose History · Every Compound
        </div>
        {groups.length > 3 && (
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter compound…"
              className="!pl-8 !py-1.5 !text-[12px] w-44"
            />
          </div>
        )}
      </div>

      {doses.length === 0 ? (
        <div className="text-text-3 text-sm py-3">No doses logged yet.</div>
      ) : filtered.length === 0 ? (
        <div className="text-text-3 text-sm py-3">No compounds match &ldquo;{query}&rdquo;.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => {
            const isOpen = !!open[g.name];
            return (
              <div key={g.name} className="rounded-xl border border-border bg-bg-2/50 overflow-hidden">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [g.name]: !o[g.name] }))}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-bg-2 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "#3b82f61a", color: "#3b82f6", boxShadow: "inset 0 0 0 1px #3b82f633" }}
                    >
                      <Syringe size={13} />
                    </span>
                    <div className="min-w-0 text-left">
                      <div className="text-sm font-medium truncate">{g.name}</div>
                      <div className="text-[11px] text-text-3 tabular-nums">
                        {g.list.length} dose{g.list.length !== 1 ? "s" : ""} · {g.total} {g.unit} total
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn("text-text-3 transition-transform shrink-0", isOpen && "rotate-180")}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-border/60 px-3 py-1.5 max-h-80 overflow-y-auto">
                    {g.list.map((d) => (
                      <div key={d.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-border/30 last:border-0">
                        <div className="min-w-0">
                          <div className="text-[12px] tabular-nums">
                            <span className="text-text-1">
                              {new Date(d.logged_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span className="text-text-3">
                              {" · "}
                              {new Date(d.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </span>
                            {d.injection_site && <span className="text-text-3"> · {d.injection_site}</span>}
                          </div>
                          {d.notes && <div className="text-[11px] text-text-3 mt-0.5 break-words">{d.notes}</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[12px] font-medium text-text-2 tabular-nums whitespace-nowrap">
                            {d.dose_amount} {d.compound_unit}
                          </span>
                          {confirmId === d.id ? (
                            <button
                              onClick={() => remove(d.id)}
                              className="text-[10px] font-semibold text-status-red px-1.5 py-0.5 rounded bg-status-red/10 ring-1 ring-inset ring-status-red/30"
                            >
                              Delete?
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmId(d.id)}
                              className="text-text-3 hover:text-status-red p-1 transition-colors"
                              title="Delete this dose"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
