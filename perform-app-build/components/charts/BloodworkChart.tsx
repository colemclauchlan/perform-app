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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

// A rotating palette so each toggled marker gets a distinct colour.
const PALETTE = [
  "#3aa6f7",
  "#2fe3a8",
  "#f6ad55",
  "#f56565",
  "#a78bfa",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#fb923c",
  "#60a5fa",
];

export interface MarkerSeries {
  marker: string;
  unit: string | null;
  points: { date: string; value: number }[];
}

interface Props {
  series: MarkerSeries[];
  height?: number;
}

export function BloodworkChart({ series, height = 360 }: Props) {
  if (series.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-text-3 text-sm"
        style={{ height }}
      >
        Select one or more markers to plot their trend.
      </div>
    );
  }

  // Build the union of all dates across selected markers (sorted ascending).
  const dateSet = new Set<string>();
  series.forEach((s) => s.points.forEach((p) => dateSet.add(p.date)));
  const dates = Array.from(dateSet).sort();
  const labels = dates.map((d) =>
    new Date(d + "T00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    })
  );

  const datasets = series.map((s, i) => {
    const color = PALETTE[i % PALETTE.length];
    const valueByDate = new Map(s.points.map((p) => [p.date, p.value]));
    return {
      label: s.unit ? `${s.marker} (${s.unit})` : s.marker,
      data: dates.map((d) => (valueByDate.has(d) ? valueByDate.get(d)! : null)),
      borderColor: color,
      backgroundColor: color + "14",
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: color,
      pointBorderColor: "#0d1117",
      pointBorderWidth: 2,
      borderWidth: 2,
      spanGaps: true,
      fill: false,
    };
  });

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#8494a8",
          font: { size: 11 },
          boxWidth: 24,
          boxHeight: 2,
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: "#131922",
        borderColor: "#1e2d45",
        borderWidth: 1,
        titleColor: "#e8edf5",
        bodyColor: "#8494a8",
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: "#4a5568", font: { size: 10 }, maxTicksLimit: 12 },
        grid: { color: "rgba(30,45,69,0.4)" },
      },
      y: {
        ticks: { color: "#4a5568", font: { size: 10 } },
        grid: { color: "rgba(30,45,69,0.4)" },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
}
