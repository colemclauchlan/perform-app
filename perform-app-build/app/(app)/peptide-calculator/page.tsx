"use client";

import Link from "next/link";
import { PeptideCalculator } from "@/components/tools/PeptideCalculator";
import { Reveal } from "@/components/visual/Motion";
import { Syringe, FlaskConical, ArrowLeft } from "lucide-react";

export default function PeptideCalculatorPage() {
  return (
    <div className="p-6 max-w-[1100px]">
      {/* Hero — framed "tool" header with ambient depth */}
      <Reveal>
        <div className="panel hairline-top mb-6 p-6 sm:p-7 overflow-hidden">
          {/* soft brand glow behind the hero */}
          <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 bg-brand-gradient opacity-20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-soft"
                style={{ background: "rgba(124,92,255,0.14)", color: "#9d7bff" }}
              >
                <Syringe size={22} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/10 bg-bg-2/60 text-[11px] text-text-2 mb-2">
                  <FlaskConical size={11} className="text-accent" />
                  Reconstitution tool
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                  Peptide Dosage <span className="text-gradient">Calculator</span>
                </h1>
                <p className="text-sm text-text-2 mt-1.5 max-w-xl selectable">
                  Convert vial strength + reconstitution volume into an exact insulin-syringe draw.
                </p>
              </div>
            </div>
            <Link href="/compounds" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> Protocols
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <PeptideCalculator />
      </Reveal>
    </div>
  );
}
