"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, compoundBadgeVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  useCompoundCatalog,
  useAddCompound,
  useDeleteCompound,
} from "@/hooks/useCompounds";
import { CompoundType, CompoundUnit } from "@/types/database";
import { Plus, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";

const TYPES: CompoundType[] = [
  "Steroid",
  "Peptide",
  "SARMs",
  "Ancillary",
  "AI / SERM",
  "Supplement",
  "Other",
];
const UNITS: CompoundUnit[] = ["mg", "mcg", "IU", "ml", "capsules", "g"];

export default function CompoundCatalogPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: compounds = [] } = useCompoundCatalog(search);
  const deleteCompound = useDeleteCompound();

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Compound Catalog"
        subtitle="Manage your compound library"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Compound
          </button>
        }
      />

      <div className="card">
        <div className="relative mb-3">
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
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-text-3 border-b border-border">
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Unit</th>
                <th className="text-left py-2 px-2">Half-life</th>
                <th className="text-left py-2 px-2">Notes</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {compounds.map((c) => (
                <tr key={c.id} className="border-b border-border/40 hover:bg-bg-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddCompoundModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
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
