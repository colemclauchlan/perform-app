"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { WorkoutSession } from "@/types/database";
import { muscleColor, parseReps, localISO } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const GRID = "rgba(30,45,69,0.4)";
const AXIS = "#4a5568";

function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function WorkoutVolumeChart({
  workouts,
  unit = "",
  weeks = 8,
  height = 200,
}: {
  workouts: WorkoutSession[];
  unit?: string;
  weeks?: number;
  height?: number;
}) {
  const { labels, data, hasData } = useMemo(() => {
    const thisMonday = mondayOf(new Date());
    const buckets: { start: Date; label: string; tonnage: number }[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const start = new Date(thisMonday);
      start.setDate(start.getDate() - i * 7);
      buckets.push({
        start,
        label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tonnage: 0,
      });
    }
    const earliest = buckets[0].start;
    workouts.forEach((w) => {
      const d = new Date(w.session_date + "T00:00");
      if (d < earliest) return;
      const idx = Math.floor((mondayOf(d).getTime() - earliest.getTime()) / (7 * 86400000));
      if (idx < 0 || idx >= buckets.length) return;
      (w.sets || []).forEach((s) => {
        buckets[idx].tonnage += (s.weight || 0) * parseReps(s.reps);
      });
    });
    return {
      labels: buckets.map((b) => b.label),
      data: buckets.map((b) => Math.round(b.tonnage)),
      hasData: buckets.some((b) => b.tonnage > 0),
    };
  }, [workouts, weeks]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center text-text-3 text-sm" style={{ height }}>
        Log weighted sets to see your volume trend.
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: "Tonnage",
        data,
        backgroundColor: "rgba(24,155,245,0.55)",
        hoverBackgroundColor: "#189bf5",
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#131922",
        borderColor: "#1e2d45",
        borderWidth: 1,
        titleColor: "#e8edf5",
        bodyColor: "#8494a8",
        padding: 10,
        callbacks: {
          title: (items) => `Week of ${items[0].label}`,
          label: (ctx) => ` ${Math.round(Number(ctx.parsed.y)).toLocaleString()} ${unit} lifted`,
        },
      },
    },
    scales: {
      x: { ticks: { color: AXIS, font: { size: 10 } }, grid: { display: false } },
      y: {
        ticks: {
          color: AXIS,
          font: { size: 10 },
          callback: (v) => (Number(v) >= 1000 ? `${Number(v) / 1000}k` : `${v}`),
        },
        grid: { color: GRID },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export function MuscleSplitChart({
  workouts,
  muscleMap,
  days = 30,
  height = 200,
}: {
  workouts: WorkoutSession[];
  muscleMap: Record<string, string>;
  days?: number;
  height?: number;
}) {
  const { labels, counts, colors, total } = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = localISO(cutoff);
    const tally: Record<string, number> = {};
    workouts.forEach((w) => {
      if (w.session_date < cutoffISO) return;
      (w.sets || []).forEach((s) => {
        if (s.set_type === "Warmup") return;
        const muscle = muscleMap[s.exercise_name.toLowerCase()] || "Other";
        tally[muscle] = (tally[muscle] || 0) + 1;
      });
    });
    const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map((e) => e[0]),
      counts: entries.map((e) => e[1]),
      colors: entries.map((e) => muscleColor(e[0])),
      total: entries.reduce((a, e) => a + e[1], 0),
    };
  }, [workouts, muscleMap, days]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-text-3 text-sm" style={{ height }}>
        No working sets in the last {days} days.
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: colors,
        borderColor: "#0d1117",
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "right",
        labels: { color: "#8494a8", font: { size: 11 }, boxWidth: 10, boxHeight: 10, padding: 8 },
      },
      tooltip: {
        backgroundColor: "#131922",
        borderColor: "#1e2d45",
        borderWidth: 1,
        titleColor: "#e8edf5",
        bodyColor: "#8494a8",
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.parsed);
            return ` ${ctx.label}: ${v} sets (${Math.round((100 * v) / total)}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
