"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAddBloodwork } from "@/hooks/useBloodwork";
import { todayISO } from "@/lib/utils";
import { Upload, Loader2, Save, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

type ImportMarker = {
  marker: string;
  value: number | null;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  category?: string;
};
type Result = { drawn_date: string | null; lab_name: string | null; markers: ImportMarker[] };

function flagOf(m: ImportMarker): string | null {
  if (m.value == null) return null;
  if (m.ref_high != null && m.value > m.ref_high) return "high";
  if (m.ref_low != null && m.value < m.ref_low) return "low";
  return null;
}

export function BloodworkImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addBloodwork = useAddBloodwork();
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function handleFile(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large — use a photo/PDF under 8MB.");
      return;
    }
    setFileName(file.name);
    setLoading(true);
    setResult(null);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",")[1] || "";
      const mediaType =
        file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      const res = await fetch("/api/bloodwork-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileBase64: base64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Could not read the file.");
        return;
      }
      const r = data.result as Result;
      if (!r.markers?.length) toast.error("No markers found — try a clearer photo.");
      setResult(r);
    } catch {
      toast.error("Could not read that file.");
    } finally {
      setLoading(false);
    }
  }

  function createPanel() {
    if (!result) return;
    const markers = (result.markers || [])
      .filter((m) => m.marker)
      .map((m) => ({
        marker: m.marker,
        value: m.value,
        unit: m.unit ?? null,
        ref_low: m.ref_low ?? null,
        ref_high: m.ref_high ?? null,
        category: m.category || "Other",
        flag: flagOf(m),
      }));
    if (!markers.length) {
      toast.error("Nothing to save.");
      return;
    }
    addBloodwork.mutate(
      {
        drawn_date: result.drawn_date || todayISO(),
        lab_name: result.lab_name || null,
        notes: "Imported via AI",
        markers,
      },
      {
        onSuccess: () => {
          toast.success(`Imported ${markers.length} markers`);
          setResult(null);
          setFileName("");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Import Blood Panel" wide>
      {!result ? (
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            Upload a photo or PDF of your lab results — AI reads the markers and reference ranges for you.
          </p>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-2 bg-bg-2/50 px-4 py-10 cursor-pointer hover:border-accent/50 transition-colors text-center">
            {loading ? (
              <>
                <Loader2 className="animate-spin text-accent" size={28} />
                <span className="text-sm text-text-2">Reading {fileName}…</span>
              </>
            ) : (
              <>
                <Upload size={28} className="text-accent" />
                <span className="text-sm text-text-1 font-medium">Tap to upload a photo or PDF</span>
                <span className="text-[11px] text-text-3">JPG · PNG · WEBP · PDF (under 8MB)</span>
              </>
            )}
            <input
              type="file"
              accept="image/*,application/pdf,.pdf"
              className="hidden"
              disabled={loading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-accent text-[12px]">
            <Sparkles size={13} /> Extracted {result.markers?.length || 0} markers
            {result.lab_name ? ` · ${result.lab_name}` : ""}
            {result.drawn_date ? ` · ${result.drawn_date}` : ""}
          </div>
          <div className="max-h-[44vh] overflow-y-auto rounded-xl border border-border divide-y divide-border/50">
            {(result.markers || []).map((m, i) => {
              const f = flagOf(m);
              return (
                <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
                  <span className="min-w-0 truncate">
                    {m.marker}
                    {m.category && <span className="text-text-3 text-[11px]"> · {m.category}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums flex items-center gap-2">
                    <span className={f === "high" ? "text-status-red" : f === "low" ? "text-status-amber" : "text-text-1"}>
                      {m.value ?? "—"}
                      {m.unit ? ` ${m.unit}` : ""}
                    </span>
                    {(m.ref_low != null || m.ref_high != null) && (
                      <span className="text-text-3 text-[11px]">
                        ({m.ref_low ?? "–"}–{m.ref_high ?? "–"})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-text-3">
            Review the values — AI extraction can make mistakes; you can edit the panel after importing.
          </p>
          <div className="flex gap-2">
            <button onClick={createPanel} disabled={addBloodwork.isPending} className="btn btn-primary group flex-1 justify-center">
              <span className="shine-overlay" />
              {addBloodwork.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Import as panel
            </button>
            <button onClick={() => { setResult(null); setFileName(""); }} className="btn btn-ghost">
              Upload another
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
