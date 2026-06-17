"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { PeptideCalculator } from "@/components/tools/PeptideCalculator";

export default function PeptideCalculatorPage() {
  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Peptide Dosage / Reconstitution Calculator"
        subtitle="Convert vial strength + reconstitution volume into an exact insulin-syringe draw"
      />
      <PeptideCalculator />
    </div>
  );
}
