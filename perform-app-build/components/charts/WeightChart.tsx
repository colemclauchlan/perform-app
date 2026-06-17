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
import { BodyWeightLog } from "@/types/database";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

function computeTrendline(values: number[]): number[] {
  const n = values.length;
  if (n < 2) return values;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  return values.map((_, i) => Math.round((slope * i + intercept) * 10) / 10);
}

interface Props {
  data: BodyWeightLog[];
  height?: number;
}

export function WeightChart({ data, height = 220 }: Props) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-text-3 text-sm"
        style={{ height }}
      >
        Log at least 2 entries to see your trend chart.
      </div>
    );
  }

  const labels = data.map((d) =>
    new Date(d.logged_date + "T00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  );
  const weights = data.map((d) => d.weight);
  const trend = computeTrendline(weights);
  const trendColor = trend[trend.length - 1] <= trend[0] ? "#22d3a5" : "#f56565";

  const chartData = {
    labels,
    datasets: [
      {
        label: "Weight",
        data: weights,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.08)",
        tension: 0.3,
        pointRadius: data.length > 30 ? 0 : 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#0d1117",
        pointBorderWidth: 2,
        borderWidth: 2,
        fill: true,
        order: 2,
      },
      {
        label: "Trend",
        data: trend,
        borderColor: trendColor,
        backgroundColor: "transparent",
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 1.5,
        borderDash: [6, 3],
        fill: false,
        order: 1,
      },
    ],
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
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label}: ${ctx.parsed.y} ${data[0]?.unit || ""}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#4a5568", font: { size: 10 }, maxTicksLimit: 10 },
        grid: { color: "rgba(30,45,69,0.4)" },
      },
      y: {
        ticks: {
          color: "#4a5568",
          font: { size: 10 },
          callback: (v) => `${v} ${data[0]?.unit || ""}`,
        },
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
