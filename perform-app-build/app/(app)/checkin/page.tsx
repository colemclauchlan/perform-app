/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { useCheckins, useAddCheckin, useUpdateCheckin, useDeleteCheckin, CheckinView } from "@/hooks/useCheckins";
import { useProfile } from "@/hooks/useNutrition";
import { todayISO, formatDate, cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Pencil,
  Camera,
  Images,
  GitCompareArrows,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

type Angle = "front" | "side" | "back";
const ANGLES: Angle[] = ["front", "side", "back"];
const ANGLE_LABEL: Record<Angle, string> = { front: "Front", side: "Side", back: "Back" };

function signedFor(c: CheckinView, a: Angle): string | null {
  return a === "front" ? c.front_signed : a === "side" ? c.side_signed : c.back_signed;
}

type Mode = "gallery" | "compare" | "slideshow";

export default function CheckinPage() {
  const { data: checkins = [] } = useCheckins();
  const { data: profile } = useProfile();
  const wu = profile?.weight_unit || "lbs";
  const deleteCheckin = useDeleteCheckin();

  const [mode, setMode] = useState<Mode>("gallery");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CheckinView | null>(null);

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Check-in"
        subtitle="Track your physique with progress photos over time"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Check-in
          </button>
        }
      />

      {checkins.length === 0 ? (
        <div className="card text-center py-12">
          <Camera size={28} className="mx-auto text-text-3 mb-3" />
          <div className="text-text-2 mb-1">No check-ins yet</div>
          <div className="text-sm text-text-3 mb-4">Upload front, side, and back photos to start your timeline.</div>
          <button className="btn btn-primary mx-auto" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add your first check-in
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-1 mb-4 bg-bg-2 p-1 rounded-lg border border-border w-fit">
            {([
              { id: "gallery", label: "Gallery", icon: Images },
              { id: "compare", label: "Compare", icon: GitCompareArrows },
              { id: "slideshow", label: "Slideshow", icon: Play },
            ] as const).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    mode === t.id ? "bg-accent text-white" : "text-text-2 hover:text-text-1"
                  )}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {mode === "gallery" && (
            <GalleryView
              checkins={checkins}
              wu={wu}
              onDelete={(c) => { deleteCheckin.mutate(c); toast.success("Deleted"); }}
              onEdit={(c) => setEditTarget(c)}
            />
          )}
          {mode === "compare" && <CompareView checkins={checkins} wu={wu} />}
          {mode === "slideshow" && <SlideshowView checkins={checkins} wu={wu} />}
        </>
      )}

      <UploadModal open={modalOpen} onClose={() => setModalOpen(false)} wu={wu} />
      <EditModal target={editTarget} onClose={() => setEditTarget(null)} wu={wu} />
    </div>
  );
}

function PhotoFrame({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-bg-2 border border-border flex items-center justify-center">
      {src ? (
        <img src={src} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center text-text-3">
          <Camera size={20} />
          <span className="text-[10px] mt-1">No {label.toLowerCase()}</span>
        </div>
      )}
      <span className="absolute top-1.5 left-1.5 text-[10px] font-medium bg-black/55 text-white px-1.5 py-0.5 rounded">{label}</span>
    </div>
  );
}

function GalleryView({ checkins, wu, onDelete, onEdit }: { checkins: CheckinView[]; wu: string; onDelete: (c: CheckinView) => void; onEdit: (c: CheckinView) => void }) {
  const ordered = [...checkins].reverse();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ordered.map((c, idx) => (
        <div key={c.id} className="card animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">{formatDate(c.taken_date)}</div>
              <div className="text-[11px] text-text-3">
                {c.weight != null ? `${c.weight} ${wu}` : "—"}
                {c.body_fat != null ? ` · ${c.body_fat}% bf` : ""}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => onEdit(c)} title="Edit check-in">
                <Pencil size={14} />
              </button>
              <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => onDelete(c)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ANGLES.map((a) => (
              <PhotoFrame key={a} src={signedFor(c, a)} label={ANGLE_LABEL[a]} />
            ))}
          </div>
          {c.notes && <div className="text-xs text-text-3 mt-2 italic">{c.notes}</div>}
        </div>
      ))}
    </div>
  );
}

function AngleTabs({ angle, setAngle }: { angle: Angle; setAngle: (a: Angle) => void }) {
  return (
    <div className="flex gap-1 bg-bg-2 p-1 rounded-lg border border-border w-fit">
      {ANGLES.map((a) => (
        <button
          key={a}
          onClick={() => setAngle(a)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-all",
            angle === a ? "bg-accent text-white" : "text-text-2 hover:text-text-1"
          )}
        >
          {ANGLE_LABEL[a]}
        </button>
      ))}
    </div>
  );
}

function CompareView({ checkins, wu }: { checkins: CheckinView[]; wu: string }) {
  const [angle, setAngle] = useState<Angle>("front");
  const [leftId, setLeftId] = useState(checkins[0]?.id || "");
  const [rightId, setRightId] = useState(checkins[checkins.length - 1]?.id || "");

  const left = checkins.find((c) => c.id === leftId) || checkins[0];
  const right = checkins.find((c) => c.id === rightId) || checkins[checkins.length - 1];

  const weightDelta =
    left?.weight != null && right?.weight != null ? Number(right.weight) - Number(left.weight) : null;
  const bfDelta =
    left?.body_fat != null && right?.body_fat != null ? Number(right.body_fat) - Number(left.body_fat) : null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <AngleTabs angle={angle} setAngle={setAngle} />
        {(weightDelta != null || bfDelta != null) && (
          <div className="flex items-center gap-3 text-xs">
            {weightDelta != null && (
              <span className={cn("font-semibold", weightDelta <= 0 ? "text-status-green" : "text-status-amber")}>
                {weightDelta >= 0 ? "+" : ""}{weightDelta.toFixed(1)} {wu}
              </span>
            )}
            {bfDelta != null && (
              <span className={cn("font-semibold", bfDelta <= 0 ? "text-status-green" : "text-status-amber")}>
                {bfDelta >= 0 ? "+" : ""}{bfDelta.toFixed(1)}% bf
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[{ c: left, set: setLeftId, id: leftId }, { c: right, set: setRightId, id: rightId }].map((side, i) => (
          <div key={i}>
            <select value={side.id} onChange={(e) => side.set(e.target.value)} className="mb-2 text-sm">
              {checkins.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatDate(c.taken_date)}{c.weight != null ? ` · ${c.weight}${wu}` : ""}
                </option>
              ))}
            </select>
            <PhotoFrame src={side.c ? signedFor(side.c, angle) : null} label={ANGLE_LABEL[angle]} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideshowView({ checkins, wu }: { checkins: CheckinView[]; wu: string }) {
  const [angle, setAngle] = useState<Angle>("front");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useTimer(playing, () => setIdx((i) => (i + 1) % checkins.length), 1200);

  const current = checkins[Math.min(idx, checkins.length - 1)];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <AngleTabs angle={angle} setAngle={setAngle} />
        <div className="flex items-center gap-1.5">
          <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => setIdx((i) => (i - 1 + checkins.length) % checkins.length)}>
            <ChevronLeft size={15} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => setIdx((i) => (i + 1) % checkins.length)}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="max-w-sm mx-auto">
        <PhotoFrame src={current ? signedFor(current, angle) : null} label={ANGLE_LABEL[angle]} />
        <div className="text-center mt-3">
          <div className="text-sm font-semibold">{current ? formatDate(current.taken_date) : ""}</div>
          <div className="text-[11px] text-text-3">
            {current?.weight != null ? `${current.weight} ${wu}` : ""}
            {current?.body_fat != null ? ` · ${current.body_fat}% bf` : ""}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, checkins.length - 1)}
          value={Math.min(idx, checkins.length - 1)}
          onChange={(e) => { setPlaying(false); setIdx(parseInt(e.target.value)); }}
          className="w-full mt-3 accent-accent"
        />
        <div className="flex justify-between text-[10px] text-text-3 mt-1">
          <span>{formatDate(checkins[0]?.taken_date || "")}</span>
          <span>{formatDate(checkins[checkins.length - 1]?.taken_date || "")}</span>
        </div>
      </div>
    </div>
  );
}

// tiny interval hook
function useTimer(active: boolean, cb: () => void, ms: number) {
  const saved = useRef(cb);
  saved.current = cb;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [active, ms]);
}

function FileSlot({
  angle,
  file,
  onPick,
  onClear,
}: {
  angle: Angle;
  file: File | null;
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div className="relative">
      <label className="block aspect-[3/4] rounded-xl overflow-hidden bg-bg-2 border border-dashed border-border hover:border-accent/50 cursor-pointer flex items-center justify-center transition-all">
        {preview ? (
          <img src={preview} alt={angle} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-text-3">
            <Upload size={18} />
            <span className="text-[10px] mt-1">{ANGLE_LABEL[angle]}</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
        />
      </label>
      {preview && (
        <button
          className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white"
          onClick={(e) => { e.preventDefault(); onClear(); }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function EditFileSlot({
  angle,
  file,
  existing,
  onPick,
  onClear,
}: {
  angle: Angle;
  file: File | null;
  existing: string | null;
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  const preview = file ? URL.createObjectURL(file) : existing;
  return (
    <div className="relative">
      <label className="block aspect-[3/4] rounded-xl overflow-hidden bg-bg-2 border border-dashed border-border hover:border-accent/50 cursor-pointer flex items-center justify-center transition-all">
        {preview ? (
          <img src={preview} alt={angle} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-text-3">
            <Upload size={18} />
            <span className="text-[10px] mt-1">{ANGLE_LABEL[angle]}</span>
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 text-[10px] font-medium bg-black/55 text-white px-1.5 py-0.5 rounded">
          {ANGLE_LABEL[angle]}
        </span>
        {file && (
          <span className="absolute bottom-1.5 left-1.5 text-[9px] font-medium bg-accent text-white px-1.5 py-0.5 rounded">
            New
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
        />
      </label>
      {file && (
        <button
          className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white"
          onClick={(e) => { e.preventDefault(); onClear(); }}
          title="Discard replacement"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function EditModal({ target, onClose, wu }: { target: CheckinView | null; onClose: () => void; wu: string }) {
  const updateCheckin = useUpdateCheckin();
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const [notes, setNotes] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [side, setSide] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [initId, setInitId] = useState<string | null>(null);

  // init form when a new target opens
  if (target && initId !== target.id) {
    setInitId(target.id);
    setDate(target.taken_date);
    setWeight(target.weight != null ? String(target.weight) : "");
    setBf(target.body_fat != null ? String(target.body_fat) : "");
    setNotes(target.notes || "");
    setFront(null);
    setSide(null);
    setBack(null);
  }

  function handleSave() {
    if (!target) return;
    setBusy(true);
    updateCheckin.mutate(
      {
        id: target.id,
        taken_date: date,
        weight: weight ? parseFloat(weight) : null,
        body_fat: bf ? parseFloat(bf) : null,
        notes: notes || null,
        front_url: target.front_url,
        side_url: target.side_url,
        back_url: target.back_url,
        front,
        side,
        back,
      },
      {
        onSuccess: () => { toast.success("Check-in updated"); setBusy(false); setInitId(null); onClose(); },
        onError: (e) => { toast.error(e.message); setBusy(false); },
      }
    );
  }

  return (
    <Modal open={!!target} onClose={onClose} title="Edit Check-in" wide>
      {target && (
        <div className="space-y-3">
          <div className="text-[11px] text-text-3">Tap a photo to replace it. Untouched photos are kept.</div>
          <div className="grid grid-cols-3 gap-2">
            <EditFileSlot angle="front" file={front} existing={target.front_signed} onPick={setFront} onClear={() => setFront(null)} />
            <EditFileSlot angle="side" file={side} existing={target.side_signed} onPick={setSide} onClear={() => setSide(null)} />
            <EditFileSlot angle="back" file={back} existing={target.back_signed} onPick={setBack} onClear={() => setBack(null)} />
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <div className="flex-1 min-w-[110px]">
              <label className="label">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="w-28">
              <label className="label">Weight ({wu})</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="—" />
            </div>
            <div className="w-24">
              <label className="label">Body fat %</label>
              <input type="number" value={bf} onChange={(e) => setBf(e.target.value)} placeholder="—" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Conditions, pump, lighting..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
              {busy ? "Saving..." : "Save Changes"}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function UploadModal({ open, onClose, wu }: { open: boolean; onClose: () => void; wu: string }) {
  const addCheckin = useAddCheckin();
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const [notes, setNotes] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [side, setSide] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setDate(todayISO());
    setWeight("");
    setBf("");
    setNotes("");
    setFront(null);
    setSide(null);
    setBack(null);
  }

  function handleSave() {
    if (!front && !side && !back) return toast.error("Add at least one photo");
    setBusy(true);
    addCheckin.mutate(
      {
        taken_date: date,
        weight: weight ? parseFloat(weight) : null,
        body_fat: bf ? parseFloat(bf) : null,
        notes: notes || null,
        front,
        side,
        back,
      },
      {
        onSuccess: () => { toast.success("Check-in saved"); setBusy(false); reset(); onClose(); },
        onError: (e) => { toast.error(e.message); setBusy(false); },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="New Check-in" wide>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <FileSlot angle="front" file={front} onPick={setFront} onClear={() => setFront(null)} />
          <FileSlot angle="side" file={side} onPick={setSide} onClear={() => setSide(null)} />
          <FileSlot angle="back" file={back} onPick={setBack} onClear={() => setBack(null)} />
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <div className="flex-1 min-w-[110px]">
            <label className="label">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="w-28">
            <label className="label">Weight ({wu})</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="—" />
          </div>
          <div className="w-24">
            <label className="label">Body fat %</label>
            <input type="number" value={bf} onChange={(e) => setBf(e.target.value)} placeholder="—" />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Conditions, pump, lighting..." />
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
            {busy ? "Uploading..." : "Save Check-in"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
