"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { BloodworkChart, MarkerSeries } from "@/components/charts/BloodworkChart";
import {
  useBloodwork,
  useAddBloodwork,
  useUpdateBloodwork,
  useDeleteBloodwork,
  MarkerInput,
  EntryInput,
} from "@/hooks/useBloodwork";
import { BloodworkEntry } from "@/types/database";
import { todayISO, formatDate } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Pencil,
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  TestTubes,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Marker presets ─────────────────────────────────────────────────────────
type PresetMarker = {
  marker: string;
  unit: string;
  ref_low: number | null;
  ref_high: number | null;
  category: string;
};

const PRESETS: PresetMarker[] = [
  // CBC
  { marker: "WBC", unit: "10^3/uL", ref_low: 4, ref_high: 11, category: "CBC" },
  { marker: "RBC", unit: "10^6/uL", ref_low: 4.5, ref_high: 5.9, category: "CBC" },
  { marker: "Hemoglobin", unit: "g/dL", ref_low: 13.5, ref_high: 17.5, category: "CBC" },
  { marker: "Hematocrit", unit: "%", ref_low: 38.8, ref_high: 50, category: "CBC" },
  { marker: "Platelets", unit: "10^3/uL", ref_low: 150, ref_high: 400, category: "CBC" },
  // Lipids
  { marker: "Total Cholesterol", unit: "mg/dL", ref_low: 0, ref_high: 200, category: "Lipids" },
  { marker: "LDL", unit: "mg/dL", ref_low: 0, ref_high: 100, category: "Lipids" },
  { marker: "HDL", unit: "mg/dL", ref_low: 40, ref_high: 999, category: "Lipids" },
  { marker: "Triglycerides", unit: "mg/dL", ref_low: 0, ref_high: 150, category: "Lipids" },
  // Liver
  { marker: "ALT", unit: "U/L", ref_low: 7, ref_high: 56, category: "Liver" },
  { marker: "AST", unit: "U/L", ref_low: 10, ref_high: 40, category: "Liver" },
  { marker: "ALP", unit: "U/L", ref_low: 44, ref_high: 147, category: "Liver" },
  { marker: "Bilirubin", unit: "mg/dL", ref_low: 0.1, ref_high: 1.2, category: "Liver" },
  // Kidney
  { marker: "Creatinine", unit: "mg/dL", ref_low: 0.7, ref_high: 1.3, category: "Kidney" },
  { marker: "BUN", unit: "mg/dL", ref_low: 7, ref_high: 20, category: "Kidney" },
  { marker: "eGFR", unit: "mL/min", ref_low: 90, ref_high: 999, category: "Kidney" },
  // Glucose / Insulin
  { marker: "Glucose (Fasting)", unit: "mg/dL", ref_low: 70, ref_high: 99, category: "Glucose / Insulin" },
  { marker: "HbA1c", unit: "%", ref_low: 4, ref_high: 5.6, category: "Glucose / Insulin" },
  { marker: "Insulin (Fasting)", unit: "uIU/mL", ref_low: 2, ref_high: 19.6, category: "Glucose / Insulin" },
  // Hormones
  { marker: "Total Testosterone", unit: "ng/dL", ref_low: 264, ref_high: 916, category: "Hormones" },
  { marker: "Free Testosterone", unit: "pg/mL", ref_low: 8.7, ref_high: 25.1, category: "Hormones" },
  { marker: "Estradiol (E2)", unit: "pg/mL", ref_low: 7.6, ref_high: 42.6, category: "Hormones" },
  { marker: "LH", unit: "mIU/mL", ref_low: 1.7, ref_high: 8.6, category: "Hormones" },
  { marker: "FSH", unit: "mIU/mL", ref_low: 1.5, ref_high: 12.4, category: "Hormones" },
  { marker: "Prolactin", unit: "ng/mL", ref_low: 4, ref_high: 15.2, category: "Hormones" },
  { marker: "SHBG", unit: "nmol/L", ref_low: 16.5, ref_high: 55.9, category: "Hormones" },
  { marker: "TSH", unit: "uIU/mL", ref_low: 0.45, ref_high: 4.5, category: "Hormones" },
  // HGH / Peptides
  { marker: "IGF-1", unit: "ng/mL", ref_low: 88, ref_high: 246, category: "HGH / Peptides" },
  // Cardiovascular / Inflammation
  { marker: "hs-CRP", unit: "mg/L", ref_low: 0, ref_high: 3, category: "Cardiovascular / Inflammation" },
  { marker: "Homocysteine", unit: "umol/L", ref_low: 0, ref_high: 15, category: "Cardiovascular / Inflammation" },
  { marker: "Lp(a)", unit: "nmol/L", ref_low: 0, ref_high: 75, category: "Cardiovascular / Inflammation" },
];

const CATEGORIES = Array.from(new Set(PRESETS.map((p) => p.category)));

function flagFor(value: number | null, low: number | null, high: number | null): string | null {
  if (value === null) return null;
  if (low !== null && value < low) return "Low";
  if (high !== null && value > high) return "High";
  return null;
}

type FormMarker = {
  marker: string;
  value: string;
  unit: string;
  ref_low: string;
  ref_high: string;
  category: string;
};

function emptyFormMarker(p?: PresetMarker): FormMarker {
  return {
    marker: p?.marker ?? "",
    value: "",
    unit: p?.unit ?? "",
    ref_low: p?.ref_low != null ? String(p.ref_low) : "",
    ref_high: p?.ref_high != null ? String(p.ref_high) : "",
    category: p?.category ?? "Other",
  };
}

export default function BloodworkPage() {
  const { data: entries = [], isLoading } = useBloodwork();
  const addEntry = useAddBloodwork();
  const updateEntry = useUpdateBloodwork();
  const deleteEntry = useDeleteBloodwork();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BloodworkEntry | null>(null);
  const [range, setRange] = useState<"1mo" | "3mo" | "6mo" | "1yr" | "all">("all");
  const [markerSearch, setMarkerSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Flatten all markers, grouped by marker name → chronological points.
  const allMarkerNames = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.markers?.forEach((m) => set.add(m.marker)));
    return Array.from(set).sort();
  }, [entries]);

  // Initialise selection to first few core markers once data loads.
  useEffect(() => {
    if (selected.size === 0 && allMarkerNames.length) {
      const core = ["Total Testosterone", "Estradiol (E2)", "HDL", "LDL"].filter((m) =>
        allMarkerNames.includes(m)
      );
      setSelected(new Set(core.length ? core : allMarkerNames.slice(0, 3)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMarkerNames]);

  const cutoffISO = useMemo(() => {
    if (range === "all") return null;
    const d = new Date();
    const map = { "1mo": 1, "3mo": 3, "6mo": 6, "1yr": 12 } as const;
    d.setMonth(d.getMonth() - map[range]);
    return d.toISOString().slice(0, 10);
  }, [range]);

  const series: MarkerSeries[] = useMemo(() => {
    return Array.from(selected).map((name) => {
      const points: { date: string; value: number }[] = [];
      let unit: string | null = null;
      entries.forEach((e) => {
        if (cutoffISO && e.drawn_date < cutoffISO) return;
        e.markers?.forEach((m) => {
          if (m.marker === name && m.value !== null) {
            points.push({ date: e.drawn_date, value: m.value });
            unit = m.unit;
          }
        });
      });
      points.sort((a, b) => a.date.localeCompare(b.date));
      return { marker: name, unit, points };
    });
  }, [selected, entries, cutoffISO]);

  // Trend cards: latest vs previous per selected marker.
  const trendCards = useMemo(() => {
    return series
      .filter((s) => s.points.length > 0)
      .map((s) => {
        const latest = s.points[s.points.length - 1];
        const prev = s.points.length > 1 ? s.points[s.points.length - 2] : null;
        const change = prev ? latest.value - prev.value : 0;
        const pct = prev && prev.value !== 0 ? (change / prev.value) * 100 : 0;
        return { marker: s.marker, unit: s.unit, latest, prev, change, pct };
      });
  }, [series]);

  // Abnormal results across the most recent entry that has each marker.
  const abnormal = useMemo(() => {
    const rows: { marker: string; value: number; unit: string | null; flag: string; date: string }[] = [];
    const seen = new Set<string>();
    [...entries]
      .sort((a, b) => b.drawn_date.localeCompare(a.drawn_date))
      .forEach((e) => {
        e.markers?.forEach((m) => {
          if (seen.has(m.marker) || m.value === null) return;
          seen.add(m.marker);
          const flag = m.flag || flagFor(m.value, m.ref_low, m.ref_high);
          if (flag) rows.push({ marker: m.marker, value: m.value, unit: m.unit, flag, date: e.drawn_date });
        });
      });
    return rows;
  }, [entries]);

  function toggleMarker(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function exportCSV() {
    const lines = ["date,lab,marker,value,unit,ref_low,ref_high,category,flag"];
    entries.forEach((e) => {
      e.markers?.forEach((m) => {
        lines.push(
          [
            e.drawn_date,
            e.lab_name ?? "",
            m.marker,
            m.value ?? "",
            m.unit ?? "",
            m.ref_low ?? "",
            m.ref_high ?? "",
            m.category,
            m.flag ?? flagFor(m.value, m.ref_low, m.ref_high) ?? "",
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
        );
      });
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bloodwork-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredMarkerList = allMarkerNames.filter((m) =>
    m.toLowerCase().includes(markerSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1300px]">
      <PageHeader
        title="Bloodwork Tracker"
        subtitle="Log lab panels, visualise trends, and flag out-of-range markers"
        action={
          <div className="flex gap-2">
            {entries.length > 0 && (
              <button onClick={exportCSV} className="btn btn-ghost btn-sm active:scale-95">
                <Download size={14} /> Export CSV
              </button>
            )}
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="btn btn-primary btn-sm active:scale-95"
            >
              <Plus size={14} /> Add Panel
            </button>
          </div>
        }
      />

      <div className="flex items-start gap-2 text-[11px] text-text-3 bg-bg-2 border border-border rounded-lg px-3 py-2 mb-5">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-status-amber" />
        <span>
          For personal tracking only. Reference ranges vary by lab and individual. This is not medical
          advice — always review results with a qualified healthcare provider.
        </span>
      </div>

      {isLoading ? (
        <div className="text-text-3 text-sm">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-12">
          <TestTubes size={32} className="mx-auto text-text-3 mb-3" />
          <div className="text-text-2 mb-1">No bloodwork logged yet</div>
          <div className="text-text-3 text-sm mb-4">
            Add your first lab panel to start tracking trends over time.
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="btn btn-primary btn-sm mx-auto active:scale-95"
          >
            <Plus size={14} /> Add Panel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
          <div className="space-y-5">
            {/* Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="card-title">Trends</div>
                <div className="inline-flex rounded-lg border border-border overflow-hidden">
                  {(["1mo", "3mo", "6mo", "1yr", "all"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-2.5 py-1 text-[11px] font-medium transition-all active:scale-95 ${
                        range === r ? "bg-accent text-white" : "bg-bg-2 text-text-2 hover:text-text-1"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <BloodworkChart series={series} />
            </div>

            {/* Trend cards */}
            {trendCards.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trendCards.map((t) => {
                  const up = t.change > 0;
                  const down = t.change < 0;
                  return (
                    <div key={t.marker} className="card-sm animate-fade-in">
                      <div className="text-[11px] text-text-3 truncate">{t.marker}</div>
                      <div className="text-xl font-bold mt-1 leading-none">
                        {t.latest.value}
                        {t.unit && <span className="text-xs text-text-2 ml-1 font-normal">{t.unit}</span>}
                      </div>
                      <div
                        className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                          up ? "text-status-amber" : down ? "text-status-green" : "text-text-3"
                        }`}
                      >
                        {up && <TrendingUp size={10} />}
                        {down && <TrendingDown size={10} />}
                        {!up && !down && <Minus size={10} />}
                        {t.prev
                          ? `${t.change >= 0 ? "+" : ""}${t.change.toFixed(1)} (${t.pct >= 0 ? "+" : ""}${t.pct.toFixed(0)}%)`
                          : "First reading"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Abnormal */}
            {abnormal.length > 0 && (
              <div className="card">
                <div className="card-title flex items-center gap-2 mb-3">
                  <AlertTriangle size={13} className="text-status-amber" /> Out-of-range (latest)
                </div>
                <div className="space-y-1.5">
                  {abnormal.map((a) => (
                    <div
                      key={a.marker}
                      className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-bg-2 border border-border"
                    >
                      <span className="text-text-1">{a.marker}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-text-2">
                          {a.value} {a.unit}
                        </span>
                        <span
                          className={`badge ${
                            a.flag === "High" ? "text-status-red" : "text-status-amber"
                          }`}
                        >
                          {a.flag}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entries list */}
            <div className="card">
              <div className="card-title mb-3">Panels ({entries.length})</div>
              <div className="space-y-2">
                {[...entries]
                  .sort((a, b) => b.drawn_date.localeCompare(a.drawn_date))
                  .map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-2 border border-border"
                    >
                      <div>
                        <div className="text-sm font-medium">{formatDate(e.drawn_date)}</div>
                        <div className="text-[11px] text-text-3">
                          {e.lab_name || "Lab not specified"} · {e.markers?.length || 0} markers
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditing(e);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-text-3 hover:text-accent transition-colors active:scale-90"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this panel?")) {
                              deleteEntry.mutate(e.id, {
                                onSuccess: () => toast.success("Panel deleted"),
                              });
                            }
                          }}
                          className="p-1.5 text-text-3 hover:text-status-red transition-colors active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Marker toggle panel */}
          <div className="card h-fit lg:sticky lg:top-4">
            <div className="card-title mb-2">Markers</div>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3" />
              <input
                value={markerSearch}
                onChange={(e) => setMarkerSearch(e.target.value)}
                placeholder="Search markers"
                className="pl-8 text-sm"
              />
            </div>
            <div className="flex gap-1.5 mb-2 text-[11px]">
              <button
                onClick={() => setSelected(new Set(allMarkerNames))}
                className="text-accent hover:underline active:scale-95"
              >
                All
              </button>
              <span className="text-text-3">·</span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-text-2 hover:underline active:scale-95"
              >
                Clear
              </button>
              <span className="text-text-3">·</span>
              <button
                onClick={() => setSelected(new Set(abnormal.map((a) => a.marker)))}
                className="text-status-amber hover:underline active:scale-95"
              >
                Abnormal
              </button>
            </div>
            <div className="space-y-1 max-h-[420px] overflow-y-auto">
              {filteredMarkerList.map((m) => (
                <label
                  key={m}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-2 cursor-pointer text-sm transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(m)}
                    onChange={() => toggleMarker(m)}
                    className="w-3.5 h-3.5 accent-accent"
                  />
                  <span className="text-text-2">{m}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <EntryFormModal
          entry={editing}
          onClose={() => setModalOpen(false)}
          onSave={(input) => {
            if (editing) {
              updateEntry.mutate(
                { id: editing.id, input },
                {
                  onSuccess: () => {
                    toast.success("Panel updated");
                    setModalOpen(false);
                  },
                  onError: (err: any) => toast.error(err.message || "Failed to update"),
                }
              );
            } else {
              addEntry.mutate(input, {
                onSuccess: () => {
                  toast.success("Panel added");
                  setModalOpen(false);
                },
                onError: (err: any) => toast.error(err.message || "Failed to add"),
              });
            }
          }}
          saving={addEntry.isPending || updateEntry.isPending}
        />
      )}
    </div>
  );
}

// ─── Entry form modal ───────────────────────────────────────────────────────
function EntryFormModal({
  entry,
  onClose,
  onSave,
  saving,
}: {
  entry: BloodworkEntry | null;
  onClose: () => void;
  onSave: (input: EntryInput) => void;
  saving: boolean;
}) {
  const [drawnDate, setDrawnDate] = useState(entry?.drawn_date ?? todayISO());
  const [labName, setLabName] = useState(entry?.lab_name ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [markers, setMarkers] = useState<FormMarker[]>(
    entry?.markers?.length
      ? entry.markers.map((m) => ({
          marker: m.marker,
          value: m.value != null ? String(m.value) : "",
          unit: m.unit ?? "",
          ref_low: m.ref_low != null ? String(m.ref_low) : "",
          ref_high: m.ref_high != null ? String(m.ref_high) : "",
          category: m.category,
        }))
      : [emptyFormMarker()]
  );
  const [presetCat, setPresetCat] = useState(CATEGORIES[0]);

  function updateMarker(i: number, patch: Partial<FormMarker>) {
    setMarkers((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }
  function removeMarker(i: number) {
    setMarkers((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addPreset(p: PresetMarker) {
    setMarkers((prev) => [...prev.filter((m) => m.marker || m.value), emptyFormMarker(p)]);
  }
  function addBlank() {
    setMarkers((prev) => [...prev, emptyFormMarker()]);
  }

  function submit() {
    const cleaned: MarkerInput[] = markers
      .filter((m) => m.marker.trim() && m.value.trim())
      .map((m) => {
        const value = parseFloat(m.value);
        const ref_low = m.ref_low.trim() ? parseFloat(m.ref_low) : null;
        const ref_high = m.ref_high.trim() ? parseFloat(m.ref_high) : null;
        return {
          marker: m.marker.trim(),
          value: Number.isFinite(value) ? value : null,
          unit: m.unit.trim() || null,
          ref_low: ref_low !== null && Number.isFinite(ref_low) ? ref_low : null,
          ref_high: ref_high !== null && Number.isFinite(ref_high) ? ref_high : null,
          category: m.category || "Other",
          flag: flagFor(
            Number.isFinite(value) ? value : null,
            ref_low !== null && Number.isFinite(ref_low) ? ref_low : null,
            ref_high !== null && Number.isFinite(ref_high) ? ref_high : null
          ),
        };
      });
    if (cleaned.length === 0) {
      toast.error("Add at least one marker with a value");
      return;
    }
    onSave({
      drawn_date: drawnDate,
      lab_name: labName.trim() || null,
      notes: notes.trim() || null,
      markers: cleaned,
    });
  }

  return (
    <Modal open onClose={onClose} title={entry ? "Edit Panel" : "Add Bloodwork Panel"} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Draw date</label>
            <input type="date" value={drawnDate} onChange={(e) => setDrawnDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Lab name (optional)</label>
            <input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="e.g. Quest" />
          </div>
        </div>

        {/* Quick add presets */}
        <div>
          <label className="label">Quick-add markers</label>
          <div className="flex gap-2 mb-2">
            <select
              value={presetCat}
              onChange={(e) => setPresetCat(e.target.value)}
              className="text-sm flex-1"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.filter((p) => p.category === presetCat).map((p) => (
              <button
                key={p.marker}
                type="button"
                onClick={() => addPreset(p)}
                className="badge hover:bg-accent-dim hover:text-accent transition-colors active:scale-95"
              >
                + {p.marker}
              </button>
            ))}
          </div>
        </div>

        {/* Marker rows */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Markers</label>
            <button type="button" onClick={addBlank} className="text-[11px] text-accent hover:underline">
              + Custom marker
            </button>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {markers.map((m, i) => (
              <div key={i} className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.7fr_auto] gap-1.5 items-center">
                <input
                  value={m.marker}
                  onChange={(e) => updateMarker(i, { marker: e.target.value })}
                  placeholder="Marker"
                  className="text-xs"
                />
                <input
                  value={m.value}
                  onChange={(e) => updateMarker(i, { value: e.target.value })}
                  placeholder="Value"
                  type="number"
                  inputMode="decimal"
                  className="text-xs"
                />
                <input
                  value={m.unit}
                  onChange={(e) => updateMarker(i, { unit: e.target.value })}
                  placeholder="Unit"
                  className="text-xs"
                />
                <input
                  value={m.ref_low}
                  onChange={(e) => updateMarker(i, { ref_low: e.target.value })}
                  placeholder="Low"
                  type="number"
                  inputMode="decimal"
                  className="text-xs"
                />
                <input
                  value={m.ref_high}
                  onChange={(e) => updateMarker(i, { ref_high: e.target.value })}
                  placeholder="High"
                  type="number"
                  inputMode="decimal"
                  className="text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeMarker(i)}
                  className="text-text-3 hover:text-status-red transition-colors active:scale-90 p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Fasting status, time of day, protocol context…"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="btn btn-ghost btn-sm active:scale-95">
            Cancel
          </button>
          <button onClick={submit} disabled={saving} className="btn btn-primary btn-sm active:scale-95">
            {saving ? "Saving…" : entry ? "Save Changes" : "Add Panel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
