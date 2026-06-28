"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, compoundBadgeVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  useCompoundCatalog,
  useAddCompound,
  useDeleteCompound,
  useFavoriteCompounds,
  useToggleFavoriteCompound,
} from "@/hooks/useCompounds";
import { CompoundCatalogItem, CompoundType, CompoundUnit } from "@/types/database";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Search, Sparkles, Star } from "lucide-react";
import toast from "react-hot-toast";

const TYPES: CompoundType[] = [
  "Steroid",
  "Peptide",
  "GLP-1",
  "SARMs",
  "Ancillary",
  "AI / SERM",
  "Supplement",
  "Other",
];
const UNITS: CompoundUnit[] = ["mg", "mcg", "IU", "ml", "capsules", "g"];

type SortKey = "alpha" | "type" | "fav" | "recent";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "alpha", label: "A–Z" },
  { key: "type", label: "Type" },
  { key: "fav", label: "Favorites" },
  { key: "recent", label: "Recent" },
];

export default function CompoundCatalogPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [infoFor, setInfoFor] = useState<CompoundCatalogItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<CompoundType | "All">("All");
  const [sort, setSort] = useState<SortKey>("alpha");
  const { data: compounds = [] } = useCompoundCatalog(search);
  const { data: favorites = [] } = useFavoriteCompounds();
  const toggleFav = useToggleFavoriteCompound();
  const deleteCompound = useDeleteCompound();

  const favSet = new Set(favorites);

  const visible = compounds
    .filter((c) => typeFilter === "All" || c.type === typeFilter)
    .slice()
    .sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name);
      if (sort === "type") return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      if (sort === "fav") {
        const fa = favSet.has(a.id) ? 0 : 1;
        const fb = favSet.has(b.id) ? 0 : 1;
        return fa - fb || a.name.localeCompare(b.name);
      }
      // recent
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        eyebrow="LIBRARY · COMPOUNDS"
        title="Compound Catalog"
        subtitle="Browse and manage your compound library"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Compound
          </button>
        }
      />

      <div className="card">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search compounds..."
              className="!pl-9"
            />
          </div>
          <div className="flex items-center gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all",
                  sort === s.key
                    ? "bg-accent text-white border-accent"
                    : "border-border text-text-2 hover:text-text-1"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(["All", ...TYPES] as (CompoundType | "All")[]).map((t) => (
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
              {t}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-text-3 border-b border-border">
                <th className="py-2 px-2 w-8"></th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Unit</th>
                <th className="text-left py-2 px-2">Half-life</th>
                <th className="text-left py-2 px-2">Notes</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => {
                const isFav = favSet.has(c.id);
                return (
                <tr key={c.id} className="border-b border-border/40 hover:bg-bg-2">
                  <td className="py-2.5 px-2">
                    <button
                      className="text-text-3 hover:text-status-amber transition-colors"
                      title={isFav ? "Unfavorite" : "Favorite"}
                      onClick={() => toggleFav.mutate(c.id)}
                    >
                      <Star
                        size={15}
                        className={isFav ? "fill-status-amber text-status-amber" : ""}
                      />
                    </button>
                  </td>
                  <td className="py-2.5 px-2 font-medium">{c.name}</td>
                  <td className="py-2.5 px-2">
                    <Badge variant={compoundBadgeVariant(c.type)}>{c.type}</Badge>
                  </td>
                  <td className="py-2.5 px-2 text-text-2">{c.unit}</td>
                  <td className="py-2.5 px-2 text-text-2">
                    {c.half_life_hours ? `${c.half_life_hours}h` : "—"}
                  </td>
                  <td className="py-2.5 px-2 text-text-2 text-xs max-w-[220px] truncate">
                    {c.notes || "—"}
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="btn btn-ghost btn-sm !px-1.5 text-accent"
                        title="AI description"
                        onClick={() => setInfoFor(c)}
                      >
                        <Sparkles size={13} />
                      </button>
                      {!c.is_global && (
                        <button
                          className="btn btn-ghost btn-sm !px-1.5"
                          onClick={() => {
                            deleteCompound.mutate(c.id);
                            toast.success("Removed");
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-text-3 text-sm py-6">
                    No compounds match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddCompoundModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <CompoundInfoModal compound={infoFor} onClose={() => setInfoFor(null)} />
    </div>
  );
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const heading = line.match(/^\s*#{1,3}\s+(.*)$/);
    const raw = heading ? heading[1] : bullet ? bullet[1] : line;
    const parts = raw.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={j} className="text-text-1 font-semibold">
          {p.slice(2, -2)}
        </strong>
      ) : (
        <span key={j}>{p}</span>
      )
    );
    if (heading) return <div key={i} className="text-text-1 font-semibold mt-2">{parts}</div>;
    if (bullet)
      return (
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-accent mt-px">•</span>
          <span>{parts}</span>
        </div>
      );
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return <div key={i}>{parts}</div>;
  });
}

function CompoundInfoModal({
  compound,
  onClose,
}: {
  compound: CompoundCatalogItem | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  async function load(refresh = false) {
    if (!compound) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compound-info", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: compound.id, name: compound.name, type: compound.type, refresh }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Could not generate a description.");
        return;
      }
      setText(data.description);
    } catch {
      setError("Network error reaching the AI service.");
    } finally {
      setLoading(false);
    }
  }

  // Init on open: show cached text immediately, otherwise fetch.
  if (compound && loadedId !== compound.id) {
    setLoadedId(compound.id);
    setError(null);
    if (compound.ai_description) {
      setText(compound.ai_description);
      setLoading(false);
    } else {
      setText(null);
      load(false);
    }
  }
  if (!compound && loadedId !== null) {
    setLoadedId(null);
    setText(null);
  }

  return (
    <Modal open={!!compound} onClose={onClose} title={compound?.name || "Compound"} wide>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {compound && <Badge variant={compoundBadgeVariant(compound.type)}>{compound.type}</Badge>}
          <span className="text-xs text-text-3 flex items-center gap-1">
            <Sparkles size={12} className="text-accent" /> AI-generated
          </span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-text-3 text-sm py-6 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-text-3 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-3 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-3 animate-bounce" />
            <span className="ml-1">Generating description…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-status-red/30 bg-status-red/10 px-3 py-2.5 text-sm text-text-2">
            {error}
          </div>
        )}

        {!loading && text && (
          <div className="text-sm text-text-2 leading-relaxed space-y-0.5">
            {renderMarkdown(text)}
          </div>
        )}

        {!loading && (
          <div className="flex gap-2 pt-1">
            <button className="btn btn-ghost btn-sm" onClick={() => load(true)}>
              {text ? "Regenerate" : "Generate"}
            </button>
            <button className="btn btn-ghost btn-sm ml-auto" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function AddCompoundModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addCompound = useAddCompound();
  const [name, setName] = useState("");
  const [type, setType] = useState<CompoundType>("Steroid");
  const [unit, setUnit] = useState<CompoundUnit>("mg");
  const [halflife, setHalflife] = useState("");
  const [notes, setNotes] = useState("");

  function handleSave() {
    if (!name) {
      toast.error("Enter a compound name");
      return;
    }
    addCompound.mutate(
      {
        name,
        type,
        unit,
        half_life_hours: parseFloat(halflife) || null,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Compound added");
          setName("");
          setHalflife("");
          setNotes("");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Compound">
      <div className="space-y-3">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Testosterone Enanthate"
            />
          </div>
          <div className="w-36">
            <label className="label">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CompoundType)}
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label className="label">Typical unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as CompoundUnit)}
            >
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Half-life (hours)</label>
            <input
              type="number"
              value={halflife}
              onChange={(e) => setHalflife(e.target.value)}
              placeholder="e.g. 168 = 7 days"
            />
          </div>
        </div>
        <div>
          <label className="label">Notes / description</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Administration notes, etc."
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn btn-primary" onClick={handleSave}>
            Add Compound
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
