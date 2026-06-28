"use client";

import { useEffect, useState } from "react";

/**
 * SignalHero — the dashboard's headline card. The "Vital Signal" motif (a gapped
 * ring with one bright node + a soft core glow) rendered as a clean, deterministic
 * SVG so it looks identical at every width and never depends on WebGL.
 */

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const end = Number(value) || 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const duration = 900;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    const tick = (t: number) => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / duration);
      setN(end * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const safety = setTimeout(() => setN(end), duration + 500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [end]);
  return <>{decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString()}</>;
}

function SignalRing({ size = 150 }: { size?: number }) {
  const stroke = 6;
  const r = size / 2 - stroke - 7;
  const circ = 2 * Math.PI * r;
  const gap = circ * 0.17; // the deliberate gap — the loop never fully closes
  const arc = circ - gap;
  const c = size / 2;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* soft core glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(24,155,245,0.28), rgba(24,155,245,0.04) 56%, transparent 72%)", filter: "blur(4px)" }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 signal-spin">
        <defs>
          <linearGradient id="sgRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1346d8" />
            <stop offset="55%" stopColor="#189bf5" />
            <stop offset="100%" stopColor="#7cc2fb" />
          </linearGradient>
        </defs>
        {/* faint full track */}
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(120,160,210,0.10)" strokeWidth={stroke} />
        {/* the gapped signal arc */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="url(#sgRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${gap}`}
          transform={`rotate(-94 ${c} ${c})`}
          style={{ filter: "drop-shadow(0 0 6px rgba(24,155,245,0.5))" }}
        />
        {/* the bright node — the signal peak */}
        <circle cx={c} cy={c - r} r={5} fill="#eafff7" style={{ filter: "drop-shadow(0 0 7px rgba(47,227,168,0.95))" }} />
      </svg>
    </div>
  );
}

export function SignalHero({
  eyebrow,
  title,
  stat,
  statUnit,
  statSub,
  decimals = 0,
  accentVar = "#2fe3a8",
  caption,
}: {
  eyebrow: string;
  title: string;
  stat?: number | null;
  statUnit?: string;
  statSub?: string;
  decimals?: number;
  /** kept for API compatibility (unused) */
  ringColor?: number;
  nodeColor?: number;
  accentVar?: string;
  caption?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-bg-1 mb-4 flex items-center animate-fade-in" style={{ minHeight: 168 }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(120% 140% at 86% 50%, color-mix(in oklab, ${accentVar} 13%, transparent) 0%, transparent 55%)` }}
      />
      {/* signal ring, right side, faded into the card */}
      <div
        className="absolute top-0 right-4 bottom-0 hidden sm:flex items-center justify-center pointer-events-none"
        style={{ width: 220, maskImage: "linear-gradient(90deg, transparent, #000 38%)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 38%)" }}
      >
        <SignalRing size={150} />
      </div>
      <div className="relative z-[2] px-6 py-6">
        <div className="lab-label mb-2.5 flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentVar, boxShadow: `0 0 8px ${accentVar}` }} />
          {eyebrow}
        </div>
        <div className="font-display font-bold tracking-tight leading-[1.05] text-[27px] max-w-[360px]">{title}</div>
        {stat != null && (
          <div className="flex items-baseline gap-2 mt-3.5">
            <span className="font-display font-bold leading-none tracking-tight tabular-nums text-[38px]" style={{ color: accentVar }}>
              <CountUp value={stat} decimals={decimals} />
            </span>
            {statUnit && <span className="data text-[13px] text-text-3">{statUnit}</span>}
            {statSub && <span className="data text-[12px] text-status-green ml-1">{statSub}</span>}
          </div>
        )}
        {caption && <div className="text-[12.5px] text-text-3 mt-2.5 max-w-[320px] leading-[1.45]">{caption}</div>}
      </div>
    </div>
  );
}
