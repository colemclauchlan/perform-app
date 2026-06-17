"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { LiftEntry } from "@/hooks/useTraining";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// Running PR (best e1RM seen up to each point) over time — the climbing line
// that mirrors the bloodwork trend chart styling.
export function LiftProgressionChart({
  history,
  unit,
  height = 200,
}: {
  history: LiftEntry[];
  unit: string;
  height?: number;
}) {
  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center text-text-3 text-sm" style={{ height }}>
        Log at least 2 sessions of this lift to see PR progression.
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const prLine = sorted.map((e) => {
    running = Math.max(running, Math.round(e.e1rm));
    return running;
  });
  const e1rms = sorted.map((e) => Math.round(e.e1rm));
  const labels = sorted.map((e) =>
    new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "e1RM",
        data: e1rms,
        borderColor: "rgba(37,99,235,0.55)",
        backgroundColor: "rgba(37,99,235,0.07)",
        tension: 0.3,
        pointRadius: sorted.length > 30 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#0d1117",
        pointBorderWidth: 1.5,
        borderWidth: 1.5,
        fill: true,
        order: 2,
      },
      {
        label: "PR",
        data: prLine,
        borderColor: "#22d3a5",
        backgroundColor: "transparent",
        tension: 0,
        stepped: true as const,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2,
        fill: false,
        order: 1,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      tooltip: {
        backgroundColor: "#131922",
        borderColor: "#1e2d45",
        borderWidth: 1,
        titleColor: "#e8edf5",
        bodyColor: "#8494a8",
        padding: 10,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${unit}` },
      },
    },
    scales: {
      x: {
        ticks: { color: "#4a5568", font: { size: 10 }, maxTicksLimit: 8 },
        grid: { color: "rgba(30,45,69,0.4)" },
      },
      y: {
        ticks: { color: "#4a5568", font: { size: 10 }, callback: (v) => `${v} ${unit}` },
        grid: { color: "rgba(30,45,69,0.4)" },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
