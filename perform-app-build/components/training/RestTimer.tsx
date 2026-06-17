"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, X, Plus, Minus, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [60, 90, 120, 180];

export function RestTimer({
  startSignal,
  startSeconds,
  onClose,
}: {
  startSignal: number; // increment to (re)start
  startSeconds: number;
  onClose: () => void;
}) {
  const [remaining, setRemaining] = useState(startSeconds);
  const [running, setRunning] = useState(true);

  // restart whenever a new signal arrives
  useEffect(() => {
    if (startSignal === 0) return;
    setRemaining(startSeconds);
    setRunning(true);
  }, [startSignal, startSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const done = remaining === 0;

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-2xl animate-fade-in",
        done ? "bg-status-green/20 border-status-green/40" : "bg-bg-1 border-border-2"
      )}
    >
      <Timer size={16} className={done ? "text-status-green" : "text-accent"} />
      <span className={cn("font-mono text-lg font-bold tabular-nums w-[58px] text-center", done && "text-status-green")}>
        {mm}:{ss}
      </span>
      <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => setRemaining((r) => Math.max(0, r - 15))} title="-15s">
        <Minus size={14} />
      </button>
      <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => setRemaining((r) => r + 15)} title="+15s">
        <Plus size={14} />
      </button>
      <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => setRunning((v) => !v)}>
        {running ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        className="btn btn-ghost btn-sm !px-1.5"
        onClick={() => {
          setRemaining(startSeconds);
          setRunning(true);
        }}
      >
        <RotateCcw size={14} />
      </button>
      <div className="flex gap-1 border-l border-border pl-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            className="text-[11px] px-1.5 py-0.5 rounded bg-bg-3 hover:bg-bg-2 text-text-2"
            onClick={() => {
              setRemaining(p);
              setRunning(true);
            }}
          >
            {p < 60 ? `${p}s` : `${p / 60}m`}
          </button>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm !px-1.5" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}
