"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import { DoseLog, ProtocolCompound } from "@/types/database";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

interface Props {
  compounds: ProtocolCompound[];
  doses: DoseLog[];
}

/**
 * Models blood concentration using a simplified pharmacokinetic model.
 * Each injection creates a single-compartment concentration curve:
 * C(t) = (D / Vd) * (ka / (ka - ke)) * (e^(-ke*t) - e^(-ka*t))
 *
 * For simplicity we use:
 *   C(t) = D * e^(-ke*t)   where ke = ln(2) / half_life
 *
 * Multiple doses accumulate additively.
 */
function buildConcentrationSeries(
  doses: DoseLog[],
  halfLifeHours: number,
  durationDays = 60
): { labels: string[]; values: number[] } {
  if (!doses.length) return { labels: [], values: [] };

  const ke = Math.LN2 / Math.max(halfLifeHours, 1);
  const sortedDoses = [...doses].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  const startTime = new Date(sortedDoses[0].logged_at).getTime();
  const totalHours = durationDays * 24;
  // Sample every 6 hours for smooth curve, capped at 240 points
  const step = Math.max(6, Math.floor(totalHours / 200));
  const labels: string[] = [];
  const values: number[] = [];

  for (let h = 0; h <= totalHours; h += step) {
    const t = startTime + h * 3600000;
    let concentration = 0;

    for (const dose of sortedDoses) {
      const doseTime = new Date(dose.logged_at).getTime();
      const dt = (t - doseTime) / 3600000; // hours since this dose
      if (dt < 0) continue;
      // Absorption peak at ~0.5 * half_life, then exponential decay
      const absorptionHours = Math.min(halfLifeHours * 0.25, 12);
      const ka = Math.LN2 / absorptionHours;
      const amount = dose.dose_amount;
      if (ka === ke) {
        concentration += amount * ke * dt * Math.exp(-ke * dt);
      } else {
        concentration +=
          amount * (ka / (ka - ke)) * (Math.exp(-ke * dt) - Math.exp(-ka * dt));
      }
    }

    const date = new Date(t);
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    labels.push(label);
    values.push(Math.max(0, Math.round(concentration * 10) / 10));
  }

  return { labels, values };
}

// Generate a distinct color for each compound
const COLORS = [
  { border: "#2563eb", bg: "rgba(37,99,235,0.15)" },
  { border: "#22d3a5", bg: "rgba(34,211,165,0.12)" },
  { border: "#f6ad55", bg: "rgba(246,173,85,0.12)" },
  { border: "#fc8181", bg: "rgba(252,129,129,0.12)" },
  { border: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  { border: "#34d399", bg: "rgba(52,211,153,0.12)" },
];

export function BloodConcentrationChart({ compounds, doses }: Props) {
  const datasets = useMemo(() => {
    return compounds
      .map((comp, idx) => {
        const compDoses = doses.filter(
          (d) => d.compound_name === comp.compound_name
        );
        if (!compDoses.length) return null;
        const halfLife = comp.half_life_hours ?? 72;
        const { labels, values } = buildConcentrationSeries(compDoses, halfLife);
        const color = COLORS[idx % COLORS.length];
        return { name: comp.compound_name, labels, values, color };
      })
      .filter(Boolean) as {
        name: string;
        labels: string[];
        values: number[];
        color: { border: string; bg: string };
      }[];
  }, [compounds, doses]);

  if (!datasets.length) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-text-3 text-sm gap-1">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 4v24M4 16h24" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="16" r="12" stroke="#4a5568" strokeWidth="1.5" />
        </svg>
        Log doses to see blood concentration curves
      </div>
    );
  }

  // Use the longest label set as x-axis
  const longestDataset = datasets.reduce((a, b) =>
    a.labels.length > b.labels.length ? a : b
  );

  const chartData = {
    labels: longestDataset.labels,
    datasets: datasets.map((ds) => ({
      label: ds.name,
      data: ds.values,
      borderColor: ds.color.border,
      backgroundColor: ds.color.bg,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: ds.color.border,
      borderWidth: 2,
      fill: true,
    })),
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#8494a8",
          font: { size: 11 },
          boxWidth: 12,
          boxHeight: 2,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "#131922",
        borderColor: "#1e2d45",
        borderWidth: 1,
        titleColor: "#e8edf5",
        bodyColor: "#8494a8",
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${datasets[ctx.datasetIndex]?.name ? "" : ""}mg`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#4a5568",
          font: { size: 10 },
          maxTicksLimit: 10,
        },
        grid: { color: "rgba(30,45,69,0.4)" },
      },
      y: {
        ticks: {
          color: "#4a5568",
          font: { size: 10 },
          callback: (v) => `${v}mg`,
        },
        grid: { color: "rgba(30,45,69,0.4)" },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}
