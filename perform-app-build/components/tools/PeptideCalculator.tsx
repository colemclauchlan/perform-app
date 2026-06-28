"use client";

import { useMemo, useState } from "react";
import { RotateCcw, AlertTriangle, Syringe } from "lucide-react";

/**
 * Peptide Dosage / Reconstitution Calculator
 * ------------------------------------------
 * Calculates an insulin-syringe draw level (100 IU = 1 mL) from:
 *   - vial strength (mg or mcg)
 *   - reconstitution volume (mL of BAC water)
 *   - intended dose (mg or mcg)
 *
 * All math is done internally in mcg / mL. 1 IU = 0.01 mL on a U-100 syringe.
 * This is a measurement tool only — not medical advice.
 */

type MassUnit = "mg" | "mcg";

const toMcg = (value: number, unit: MassUnit) => (unit === "mg" ? value * 1000 : value);

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <label className="label">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function UnitToggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-2 text-sm font-medium transition-all active:scale-95 ${
            value === opt ? "bg-accent text-white" : "bg-bg-2 text-text-2 hover:text-text-1"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** Vertical U-100 insulin syringe with live translucent-blue fill. */
function SyringeGraphic({ iu }: { iu: number }) {
  const clamped = Math.max(0, Math.min(100, iu));
  const fillPct = clamped / 100;
  // ticks every 10 IU
  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);
  return (
    <div className="flex items-stretch justify-center gap-3 select-none">
      {/* barrel */}
      <div className="relative w-16 rounded-xl border-2 border-border-2 bg-bg-2 overflow-hidden" style={{ height: 280 }}>
        {/* fill grows from bottom (0 IU) to top (100 IU) */}
        <div
          className="absolute left-0 right-0 bottom-0 transition-all duration-300"
          style={{
            height: `${fillPct * 100}%`,
            background: "linear-gradient(180deg, rgba(24,155,245,0.55), rgba(24,155,245,0.75))",
            boxShadow: "inset 0 2px 6px rgba(24,155,245,0.5)",
          }}
        />
        {/* draw line */}
        <div
          className="absolute left-0 right-0 border-t-2 border-accent-bright transition-all duration-300"
          style={{ bottom: `${fillPct * 100}%` }}
        />
        {/* tick marks */}
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute left-0 w-3 border-t border-text-3/40"
            style={{ bottom: `${t}%` }}
          />
        ))}
      </div>
      {/* scale labels (100 at top → 0 at bottom) */}
      <div className="relative text-[10px] text-text-3" style={{ height: 280 }}>
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-y-1/2" style={{ bottom: `${t}%` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PeptideCalculator() {
  const [vialAmount, setVialAmount] = useState("5");
  const [vialUnit, setVialUnit] = useState<MassUnit>("mg");
  const [bacWater, setBacWater] = useState("2");
  const [doseAmount, setDoseAmount] = useState("250");
  const [doseUnit, setDoseUnit] = useState<MassUnit>("mcg");

  const reset = () => {
    setVialAmount("");
    setBacWater("");
    setDoseAmount("");
    setVialUnit("mg");
    setDoseUnit("mcg");
  };

  const result = useMemo(() => {
    const vial = parseFloat(vialAmount);
    const water = parseFloat(bacWater);
    const dose = parseFloat(doseAmount);

    const errors: string[] = [];
    if (!vialAmount || isNaN(vial) || vial <= 0) errors.push("Enter a vial amount greater than 0.");
    if (!bacWater || isNaN(water) || water <= 0) errors.push("Enter a reconstitution volume greater than 0.");
    if (!doseAmount || isNaN(dose) || dose <= 0) errors.push("Enter an intended dose greater than 0.");
    if (errors.length) return { ok: false as const, errors };

    const vialMcg = toMcg(vial, vialUnit);
    const doseMcg = toMcg(dose, doseUnit);
    const mcgPerMl = vialMcg / water; // concentration
    const mcgPerIu = mcgPerMl / 100; // 100 IU = 1 mL
    const mlToDraw = doseMcg / mcgPerMl;
    const iuToDraw = mlToDraw * 100;
    const mgPerMl = mcgPerMl / 1000;

    return {
      ok: true as const,
      doseMcg,
      mcgPerMl,
      mcgPerIu,
      mgPerMl,
      mlToDraw,
      iuToDraw,
      over: iuToDraw > 100,
    };
  }, [vialAmount, vialUnit, bacWater, doseAmount, doseUnit]);

  const fmt = (n: number, d = 2) =>
    Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
      {/* ── Inputs + readouts ── */}
      <div className="space-y-4">
        <div className="card">
          <div className="card-title flex items-center gap-2">
            <Syringe size={13} className="text-accent" /> Inputs
          </div>

          {/* Vial */}
          <label className="label">Vial amount (peptide in vial)</label>
          <div className="flex gap-2 mb-3">
            <NumberField label="" value={vialAmount} onChange={setVialAmount} placeholder="e.g. 5" />
            <div className="self-end">
              <UnitToggle value={vialUnit} onChange={(v) => setVialUnit(v as MassUnit)} options={["mg", "mcg"]} />
            </div>
          </div>

          {/* BAC water */}
          <div className="mb-3">
            <label className="label">Reconstitution volume (BAC water)</label>
            <div className="flex gap-2">
              <NumberField label="" value={bacWater} onChange={setBacWater} placeholder="e.g. 2" />
              <div className="self-end">
                <span className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-border bg-bg-2 text-text-2">
                  mL
                </span>
              </div>
            </div>
          </div>

          {/* Dose */}
          <label className="label">Intended dose</label>
          <div className="flex gap-2">
            <NumberField label="" value={doseAmount} onChange={setDoseAmount} placeholder="e.g. 250" />
            <div className="self-end">
              <UnitToggle value={doseUnit} onChange={(v) => setDoseUnit(v as MassUnit)} options={["mcg", "mg"]} />
            </div>
          </div>

          <button onClick={reset} className="btn btn-ghost btn-sm mt-4 active:scale-95">
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        {/* Readouts */}
        <div className="card">
          <div className="card-title">Result</div>
          {!result.ok ? (
            <div className="space-y-1.5">
              {result.errors.map((e) => (
                <div key={e} className="flex items-center gap-2 text-status-amber text-sm">
                  <AlertTriangle size={14} /> {e}
                </div>
              ))}
            </div>
          ) : (
            <>
              {result.over && (
                <div className="flex items-start gap-2 text-status-red text-sm mb-3 bg-status-red/10 border border-status-red/30 rounded-lg px-3 py-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    This dose requires <b>{fmt(result.iuToDraw, 1)} IU</b> — more than one full 1&nbsp;mL (100&nbsp;IU)
                    syringe. Split into multiple draws or increase concentration.
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Readout label="Draw to" value={`${fmt(Math.min(result.iuToDraw, 100), 1)} IU`} big highlight />
                <Readout label="Volume" value={`${fmt(result.mlToDraw, 3)} mL`} big />
                <Readout
                  label="Dose"
                  value={`${fmt(result.doseMcg, 0)} mcg / ${fmt(result.doseMcg / 1000, 3)} mg`}
                />
                <Readout label="Concentration" value={`${fmt(result.mcgPerIu, 1)} mcg / IU`} />
                <Readout label="Concentration" value={`${fmt(result.mcgPerMl, 0)} mcg / mL`} />
                <Readout label="Concentration" value={`${fmt(result.mgPerMl, 2)} mg / mL`} />
              </div>
            </>
          )}
          <p className="text-[11px] text-text-3 mt-4 leading-relaxed">
            This calculator is for measurement conversion only and is not medical advice.
          </p>
        </div>
      </div>

      {/* ── Syringe ── */}
      <div className="card flex flex-col items-center justify-center lg:w-[260px]">
        <div className="card-title self-start">U-100 Insulin Syringe</div>
        <SyringeGraphic iu={result.ok ? result.iuToDraw : 0} />
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold text-accent leading-none">
            {result.ok ? fmt(Math.min(result.iuToDraw, 100), 1) : "0"}
            <span className="text-sm font-normal text-text-2 ml-1">IU</span>
          </div>
          <div className="text-[11px] text-text-3 mt-1">100 IU = 1 mL · 1 IU = 0.01 mL</div>
        </div>
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  big,
  highlight,
}: {
  label: string;
  value: string;
  big?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 transition-all ${
        highlight ? "border-accent/40 bg-accent-dim" : "border-border bg-bg-2"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide text-text-3">{label}</div>
      <div className={`font-semibold mt-0.5 ${big ? "text-lg" : "text-sm"} ${highlight ? "text-accent" : "text-text-1"}`}>
        {value}
      </div>
    </div>
  );
}
