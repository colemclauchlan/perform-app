"use client";

import { useState } from "react";
import { PageHeader, StatCard } from "@/components/ui/PageHeader";
import { useSteps, useUpsertSteps } from "@/hooks/useTraining";
import { todayISO, formatDate } from "@/lib/utils";
import { Footprints, Smartphone } from "lucide-react";
import toast from "react-hot-toast";

export default function StepsPage() {
  const { data: steps = [] } = useSteps();
  const upsert = useUpsertSteps();
  const [date, setDate] = useState(todayISO());
  const [count, setCount] = useState("");

  function handleLog() {
    const n = parseInt(count);
    if (!n && n !== 0) {
      toast.error("Enter a step count");
      return;
    }
    upsert.mutate(
      { logged_date: date, step_count: n, source: "manual" },
      {
        onSuccess: () => {
          toast.success("Steps logged");
          setCount("");
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  const today = steps.find((s) => s.logged_date === todayISO());
  const weekTotal = steps
    .filter((s) => {
      const d = new Date(s.logged_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    })
    .reduce((a, s) => a + s.step_count, 0);
  const avg = steps.length
    ? Math.round(steps.reduce((a, s) => a + s.step_count, 0) / steps.length)
    : 0;

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader title="Steps" subtitle="Track daily step count" />

      {/* Apple Health notice */}
      <div className="card mb-4 border-accent/30">
        <div className="flex items-start gap-3">
          <Smartphone className="text-accent flex-shrink-0 mt-0.5" size={18} />
          <div>
            <div className="text-sm font-medium mb-1">
              Apple Health sync coming with the iOS app
            </div>
            <div className="text-[13px] text-text-2">
              Once the iPhone app is live, your daily steps will sync
              automatically from Apple Health&apos;s pedometer. For now, you can
              log steps manually below and they&apos;ll appear here and in the
              app.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <StatCard
          label="Today"
          value={today ? today.step_count.toLocaleString() : "0"}
          sub={today?.source === "apple_health" ? "From Apple Health" : "Manual"}
        />
        <StatCard
          label="Last 7 Days"
          value={weekTotal.toLocaleString()}
          sub="total steps"
        />
        <StatCard
          label="Daily Average"
          value={avg.toLocaleString()}
          sub={`${steps.length} days tracked`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card">
          <div className="card-title">Log Steps Manually</div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="label">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="label">Step count</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="10000"
              />
            </div>
          </div>
          <button className="btn btn-primary mt-3" onClick={handleLog}>
            Save Steps
          </button>
        </div>

        <div className="card">
          <div className="card-title">Recent History</div>
          {steps.length === 0 ? (
            <div className="text-text-3 text-sm py-3">
              No step data yet.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-bg-2 rounded-lg px-3 py-2 border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Footprints size={15} className="text-text-3" />
                    <span className="text-sm text-text-2">
                      {formatDate(s.logged_date)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-accent">
                    {s.step_count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
