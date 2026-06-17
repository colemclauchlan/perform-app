"use client";

import { BodyMeasurement } from "@/types/database";
import { ArrowUp, ArrowDown } from "lucide-react";

type Spot = {
  col: keyof BodyMeasurement;
  label: string;
  // position as % of the container box
  x: number;
  y: number;
  decreaseGood?: boolean;
  pct?: boolean;
};

// Front-view callout positions over the silhouette.
const SPOTS: Spot[] = [
  { col: "neck_cm", label: "Neck", x: 50, y: 12 },
  { col: "chest_cm", label: "Chest", x: 50, y: 27 },
  { col: "left_arm_cm", label: "L Arm", x: 13, y: 34 },
  { col: "right_arm_cm", label: "R Arm", x: 87, y: 34 },
  { col: "waist_cm", label: "Waist", x: 50, y: 45, decreaseGood: true },
  { col: "hips_cm", label: "Hips", x: 50, y: 55, decreaseGood: true },
  { col: "left_thigh_cm", label: "L Thigh", x: 30, y: 68 },
  { col: "right_thigh_cm", label: "R Thigh", x: 70, y: 68 },
  { col: "left_calf_cm", label: "L Calf", x: 33, y: 88 },
  { col: "right_calf_cm", label: "R Calf", x: 67, y: 88 },
];

function Badge({
  label,
  value,
  delta,
  decreaseGood,
  pct,
  x,
  y,
}: {
  label: string;
  value: number;
  delta: number | null;
  decreaseGood?: boolean;
  pct?: boolean;
  x: number;
  y: number;
}) {
  const good = delta != null && delta !== 0 && (decreaseGood ? delta < 0 : delta > 0);
  const bad = delta != null && delta !== 0 && (decreaseGood ? delta > 0 : delta < 0);
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className="px-2 py-1 rounded-lg text-center leading-none shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.15)] border border-white/10"
        style={{
          background: "linear-gradient(160deg,#1b2740,#0e1626)",
          transform: "perspective(220px) rotateX(12deg)",
        }}
      >
        <div className="text-[8px] uppercase tracking-wide text-text-3">{label}</div>
        <div className="text-[13px] font-extrabold text-white drop-shadow">
          {value}
          <span className="text-[9px] font-medium text-text-2">{pct ? "%" : "cm"}</span>
        </div>
        {delta != null && delta !== 0 && (
          <div
            className={`text-[8px] font-bold flex items-center justify-center gap-0.5 ${
              good ? "text-status-green" : bad ? "text-status-red" : "text-text-3"
            }`}
          >
            {delta > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
            {Math.abs(delta)}
          </div>
        )}
      </div>
    </div>
  );
}

export function BodyAnatomy({
  latest,
  prev,
}: {
  latest: BodyMeasurement | undefined;
  prev: BodyMeasurement | undefined;
}) {
  if (!latest) return null;
  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: 360, aspectRatio: "3 / 5" }}>
      {/* Muscular front-view silhouette */}
      <svg viewBox="0 0 300 500" className="w-full h-full" aria-hidden>
        <defs>
          <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22304d" />
            <stop offset="100%" stopColor="#141d30" />
          </linearGradient>
          <filter id="bodyGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#2563eb" floodOpacity="0.35" />
          </filter>
        </defs>
        <g fill="url(#bodyFill)" stroke="#3a557f" strokeWidth="2" filter="url(#bodyGlow)">
          {/* head */}
          <ellipse cx="150" cy="42" rx="26" ry="30" />
          {/* neck */}
          <rect x="138" y="68" width="24" height="18" rx="6" />
          {/* torso (traps to waist) */}
          <path d="M108 88 q42 -16 84 0 q10 30 6 70 q-6 44 -10 74 q-40 14 -76 0 q-6 -34 -10 -74 q-4 -40 6 -70 z" />
          {/* left arm */}
          <path d="M108 92 q-22 6 -30 36 q-8 30 -10 64 q6 8 16 4 q8 -34 14 -58 q6 -24 16 -34 z" />
          {/* right arm */}
          <path d="M192 92 q22 6 30 36 q8 30 10 64 q-6 8 -16 4 q-8 -34 -14 -58 q-6 -24 -16 -34 z" />
          {/* left leg */}
          <path d="M118 232 q14 6 30 4 q-2 60 -8 110 q-2 44 -10 96 q-12 4 -20 -2 q-2 -52 0 -98 q2 -56 8 -110 z" />
          {/* right leg */}
          <path d="M182 232 q-14 6 -30 4 q2 60 8 110 q2 44 10 96 q12 4 20 -2 q2 -52 0 -98 q-2 -56 -8 -110 z" />
        </g>
        {/* simple ab/pec hints */}
        <g stroke="#3a557f" strokeWidth="1.5" opacity="0.5" fill="none">
          <path d="M150 96 v150" />
          <path d="M124 150 h52 M126 178 h48 M128 206 h44" />
        </g>
      </svg>

      {/* number callouts */}
      {SPOTS.map((s) => {
        const cur = latest[s.col] as number | null;
        if (cur == null) return null;
        const old = prev ? (prev[s.col] as number | null) : null;
        const delta = old != null ? Math.round((cur - old) * 10) / 10 : null;
        return (
          <Badge
            key={String(s.col)}
            label={s.label}
            value={cur}
            delta={delta}
            decreaseGood={s.decreaseGood}
            pct={s.pct}
            x={s.x}
            y={s.y}
          />
        );
      })}
    </div>
  );
}
