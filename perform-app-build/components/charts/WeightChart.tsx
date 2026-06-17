"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { BodyWeightLog } from "@/types/database";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

export function WeightChart({ data }: { data: BodyWeightLog[] }) {
  if (data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-text-3 text-sm">
        Log at least 2 entries to see your trend chart.
      </div>
    );
  }

  return (
    <div className="h-40">
      <Line
        data={{
          labels: data.map((d) => d.logged_date.slice(5)),
          datasets: [
            {
              label: "Weight",
              data: data.map((d) => d.weight),
              borderColor: "#7c6af7",
              backgroundColor: "rgba(124,106,247,0.12)",
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: "#7c6af7",
              fill: true,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: "#5a5a72", font: { size: 10 } },
              grid: { color: "rgba(46,46,61,0.3)" },
            },
            y: {
              ticks: { color: "#5a5a72", font: { size: 10 } },
              grid: { color: "rgba(46,46,61,0.3)" },
            },
          },
        }}
      />
    </div>
  );
}
