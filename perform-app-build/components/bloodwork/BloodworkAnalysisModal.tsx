"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { BloodworkEntry } from "@/types/database";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";

type Flagged = { marker: string; value: string; status: string; note: string };
type Analysis = {
  headline: string;
  summary: string;
  flagged?: Flagged[];
  optimize?: string[];
  retest?: string;
  disclaimer?: string;
};

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  high: { bg: "bg-status-red/15", color: "text-status-red", label: "High" },
  low: { bg: "bg-status-amber/15", color: "text-status-amber", label: "Low" },
  borderline: { bg: "bg-status-amber/15", color: "text-status-amber", label: "Borderline" },
  optimal: { bg: "bg-status-green/15", color: "text-status-green", label: "Optimal" },
};

export function BloodworkAnalysisModal({
  open,
  onClose,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  entry: BloodworkEntry | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    if (!open || !entry) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    fetch("/api/bloodwork-analysis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        entry: { drawn_date: entry.drawn_date, lab_name: entry.lab_name, markers: entry.markers },
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data?.error || "Could not analyze the panel.");
          return;
        }
        setAnalysis(data.analysis as Analysis);
      })
      .catch(() => {
        if (!cancelled) setError("Network error reaching the analysis service.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, entry]);

  return (
    <Modal open={open} onClose={onClose} title="AI Blood Panel Analysis" wide>
      {loading && (
        <div className="py-10 flex flex-col items-center gap-3 text-text-2">
          <Loader2 className="animate-spin text-accent" size={28} />
          <span className="text-sm">Analyzing your panel…</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-status-red/30 bg-status-red/10 px-3 py-3 text-sm text-text-2 flex items-start gap-2">
          <AlertTriangle size={16} className="text-status-red mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-accent text-[12px] font-medium mb-1">
              <Sparkles size={13} /> AI verdict
            </div>
            <h3 className="text-lg font-display font-bold">{analysis.headline}</h3>
            <p className="text-sm text-text-2 mt-1">{analysis.summary}</p>
          </div>

          {analysis.flagged && analysis.flagged.length > 0 && (
            <div>
              <div className="card-title mb-2">Flagged markers</div>
              <div className="space-y-2">
                {analysis.flagged.map((f, i) => {
                  const s = STATUS[(f.status || "").toLowerCase()] ?? {
                    bg: "bg-bg-3",
                    color: "text-text-2",
                    label: f.status,
                  };
                  return (
                    <div key={i} className="rounded-xl border border-border bg-bg-2/50 p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium">{f.marker}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                          {f.value} · {s.label}
                        </span>
                      </div>
                      <p className="text-[13px] text-text-2">{f.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analysis.optimize && analysis.optimize.length > 0 && (
            <div>
              <div className="card-title mb-2">How to optimize</div>
              <ul className="space-y-1.5">
                {analysis.optimize.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <span className="text-text-1">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.retest && (
            <div className="text-[13px] text-text-2">
              <span className="text-text-3 font-medium">Retest: </span>
              {analysis.retest}
            </div>
          )}

          {analysis.disclaimer && (
            <p className="text-[11px] text-text-3 border-l-2 border-status-amber/40 pl-3">{analysis.disclaimer}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
