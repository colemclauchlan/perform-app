"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useProfile, useUpdateProfile } from "@/hooks/useNutrition";
import { UserPreferences } from "@/types/database";
import { Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";

export type SectionCfg = { id: string; order: number; hidden?: boolean };
export type SectionDef = { id: string; label: string };
type LayoutKey = "gym_sections" | "ped_sections";

export function mergeSections(defaults: SectionDef[], saved?: SectionCfg[]): SectionCfg[] {
  const byId = new Map((saved || []).map((s) => [s.id, s]));
  // Keep only known section ids (defaults), apply saved order/hidden when present.
  return defaults
    .map((d, i) => byId.get(d.id) ?? { id: d.id, order: i })
    .sort((a, b) => a.order - b.order);
}

/** Ordered, visibility-resolved section list for a dashboard. */
export function useSectionLayout(key: LayoutKey, defaults: SectionDef[]): SectionCfg[] {
  const { data: profile } = useProfile();
  return mergeSections(defaults, profile?.preferences?.[key]);
}

export function SectionCustomizer({
  open,
  onClose,
  layoutKey,
  defaults,
  title = "Customize Layout",
}: {
  open: boolean;
  onClose: () => void;
  layoutKey: LayoutKey;
  defaults: SectionDef[];
  title?: string;
}) {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [draft, setDraft] = useState<SectionCfg[]>([]);
  const [initKey, setInitKey] = useState<string | null>(null);

  const base = mergeSections(defaults, profile?.preferences?.[layoutKey]);
  const sig = open ? base.map((s) => `${s.id}:${s.order}:${s.hidden ? 1 : 0}`).join("|") : "closed";
  // Init-on-open without an effect (guarded setState-during-render).
  if (open && sig !== initKey) {
    setInitKey(sig);
    setDraft(base);
  }

  const labelFor = (id: string) => defaults.find((d) => d.id === id)?.label ?? id;
  const toggle = (id: string) =>
    setDraft((d) => d.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)));
  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.length) return d;
      const n = [...d];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  function save() {
    const next = draft.map((s, i) => ({ id: s.id, order: i, hidden: s.hidden }));
    const prefs: UserPreferences = { ...(profile?.preferences || {}), [layoutKey]: next };
    updateProfile.mutate({ preferences: prefs }, { onSuccess: () => onClose() });
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-xs text-text-3 mb-3">Show, hide, and reorder this dashboard&apos;s sections.</p>
      <div className="space-y-2">
        {draft.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center gap-1 rounded-xl border border-border px-3 py-2 bg-bg-2 ${s.hidden ? "opacity-50" : ""}`}
          >
            <span className="flex-1 text-sm">{labelFor(s.id)}</span>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-text-3 hover:text-text-1 disabled:opacity-30 p-1" title="Move up">
              <ChevronUp size={15} />
            </button>
            <button onClick={() => move(i, 1)} disabled={i === draft.length - 1} className="text-text-3 hover:text-text-1 disabled:opacity-30 p-1" title="Move down">
              <ChevronDown size={15} />
            </button>
            <button onClick={() => toggle(s.id)} title={s.hidden ? "Show" : "Hide"} className="p-1">
              {s.hidden ? <EyeOff size={15} className="text-text-3" /> : <Eye size={15} className="text-accent" />}
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={save} className="btn btn-primary flex-1 justify-center">Save layout</button>
        <button onClick={() => setDraft(defaults.map((d, i) => ({ id: d.id, order: i })))} className="btn btn-ghost">
          Reset
        </button>
      </div>
    </Modal>
  );
}
