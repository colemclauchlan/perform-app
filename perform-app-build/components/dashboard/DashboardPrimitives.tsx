"use client";

import { useEffect, useId, useState } from "react";

/**
 * Health Dashboard primitives — faithful TSX ports of the design kit
 * (ui_kits/app: BarChart, Sparkline, BarRow, ProgressBar, QuickActions, StatTile).
 * The kit's CSS-var palette is mapped to the app's Vital Signal hex tokens here.
 */
export const C = {
  line: "#2d3e58",
  line2: "#3d5070",
  s1: "#1a2433",
  s2: "#1f2b3c",
  s3: "#27344a",
  s4: "#323f59",
  t1: "#eef3fa",
  t2: "#aebccd",
  t3: "#6c7f99",
  accent: "#189bf5",
  accentBright: "#3aa6f7",
  mint: "#2fe3a8",
  high: "#f56565",
  warn: "#f6ad55",
  steel: "#9fb0c0",
  ink: "#0c1422",
  sProtein: "#189bf5",
  sCarbs: "#2dd4bf",
  sFat: "#f6ad55",
  sleep: "#7cc2fb",
};

type Bar = { label: string; value: number; color?: string; glow?: string; bright?: boolean; tip?: string | string[] };

export function BarChart({
  data,
  height = 150,
  target = null,
  targetLabel = "Target",
  defaultColor = C.accent,
  valueFormat = (v: number) => String(Math.round(v)),
}: {
  data: Bar[];
  height?: number;
  target?: number | null;
  targetLabel?: string;
  defaultColor?: string;
  valueFormat?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [grown, setGrown] = useState(false);
  const uid = useId().replace(/:/g, "");
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
    return () => cancelAnimationFrame(r);
  }, []);
  const W = 720,
    H = height + 44,
    padL = 12,
    padR = 12,
    padT = 22,
    padB = 22;
  const vals = data.map((d) => d.value);
  const hi = Math.max(...vals, target || 0) * 1.08 || 1;
  const plotH = H - padT - padB;
  const bw = (W - padL - padR) / data.length;
  const y = (v: number) => padT + (1 - v / hi) * plotH;
  const gy = [0.25, 0.5, 0.75];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} onMouseLeave={() => setHover(null)}>
      <defs>
        {data.map((d, i) => (
          <linearGradient key={i} id={`bar-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={d.color || defaultColor} stopOpacity={d.bright ? 1 : 0.85} />
            <stop offset="1" stopColor={d.color || defaultColor} stopOpacity={d.bright ? 0.7 : 0.4} />
          </linearGradient>
        ))}
      </defs>
      {gy.map((g) => (
        <line key={g} x1={padL} y1={padT + g * plotH} x2={W - padR} y2={padT + g * plotH} stroke={C.line} strokeDasharray="2 4" opacity="0.5" />
      ))}
      <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke={C.line} />
      {target != null && (
        <g>
          <line x1={padL} y1={y(target)} x2={W - padR} y2={y(target)} stroke={C.t3} strokeWidth="1.2" strokeDasharray="5 4" opacity="0.8" />
          <text x={W - padR} y={y(target) - 5} textAnchor="end" fontFamily="var(--font-geist-mono)" fontSize="9" fill={C.t3} letterSpacing="0.5">
            {targetLabel.toUpperCase()}
          </text>
        </g>
      )}
      {data.map((d, i) => {
        const cx = padL + i * bw + bw / 2;
        const barW = Math.min(38, bw * 0.56);
        const bh = Math.max(3, (d.value / hi) * plotH);
        const by = padT + plotH - bh;
        const on = hover === i;
        return (
          <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: "default" }}>
            <rect x={cx - bw / 2} y={padT} width={bw} height={plotH} fill="transparent" />
            <rect
              x={cx - barW / 2}
              y={by}
              width={barW}
              height={bh}
              rx="5"
              fill={`url(#bar-${uid}-${i})`}
              stroke={on ? d.color || defaultColor : "transparent"}
              strokeWidth="1.5"
              style={{
                transformBox: "fill-box",
                transformOrigin: "bottom",
                transform: grown ? "scaleY(1)" : "scaleY(0)",
                transition: `transform 0.7s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.05}s, filter 0.18s, stroke 0.18s`,
                filter: d.bright ? "drop-shadow(0 0 10px " + (d.glow || "rgba(24,155,245,0.35)") + ")" : "none",
              }}
            />
            <text
              x={cx}
              y={by - 7}
              textAnchor="middle"
              fontFamily="var(--font-geist-mono)"
              fontSize="10"
              fontWeight={d.bright ? 600 : 400}
              fill={on || d.bright ? C.t1 : C.t3}
              style={{ opacity: grown ? 1 : 0, transition: `opacity 0.4s ease ${0.3 + i * 0.05}s` }}
            >
              {valueFormat(d.value)}
            </text>
            <text x={cx} y={H - 7} textAnchor="middle" fontFamily="var(--font-geist-mono)" fontSize="10" fill={d.bright ? C.t2 : C.t3}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Sparkline({ data, w = 240, h = 56, color = C.accent }: { data: number[]; w?: number; h?: number; color?: string }) {
  const sid = "spk-" + useId().replace(/:/g, "");
  if (!data || data.length < 2) return <div style={{ height: h }} className="flex items-center justify-center data text-[11px] text-text-3">Not enough data</div>;
  const min = Math.min(...data),
    max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const yy = h - 6 - ((v - min) / rng) * (h - 12);
    return [x, yy] as [number, number];
  });
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = d + ` L ${w} ${h} L 0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={sid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(24,155,245,0.28)" />
          <stop offset="1" stopColor="rgba(24,155,245,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${sid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="#7cc2fb" style={{ filter: "drop-shadow(0 0 5px rgba(58,166,247,0.9))" }} />
    </svg>
  );
}

export function BarRow({ label, value, target, unit, color }: { label: string; value: number | string; target: number; unit: string; color: string }) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const pct = Math.min(100, Math.round((num / (target || 1)) * 100)) || 0;
  return (
    <div className="flex items-center gap-3 py-[9px] border-b border-border last:border-0">
      <span className="text-[13px] text-text-2 flex-none" style={{ width: 86 }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.s4 }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + "%", background: color }} />
      </div>
      <span className="data text-[12.5px] text-text-1 text-right flex-none" style={{ width: 92 }}>
        {value}
        <span className="text-text-3">{unit}</span>
      </span>
    </div>
  );
}

export function DashProgress({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const over = value > max;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[12px] text-text-2">{label}</span>
        <span className="data text-[12px]" style={{ color: over ? C.high : C.t1 }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.s4 }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + "%", background: over ? C.high : color }} />
      </div>
    </div>
  );
}

export function QuickActions({ actions }: { actions: { label: string; icon: React.ReactNode; href: string }[] }) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {actions.map((a) => (
        <a
          key={a.href + a.label}
          href={a.href}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-border bg-bg-2 text-text-2 text-[13px] font-semibold whitespace-nowrap transition-all duration-150 hover:border-accent/40 hover:bg-accent-dim hover:text-accent-bright active:scale-[0.98]"
        >
          {a.icon}
          {a.label}
        </a>
      ))}
    </div>
  );
}

const TONES: Record<string, { bg: string; fg: string }> = {
  blue: { bg: "rgba(24,155,245,0.12)", fg: C.accent },
  mint: { bg: "rgba(47,227,168,0.12)", fg: C.mint },
  high: { bg: "rgba(245,101,101,0.12)", fg: C.high },
  warn: { bg: "rgba(246,173,85,0.12)", fg: C.warn },
};

export function StatTile({
  label,
  value,
  unit,
  sub,
  trend,
  tone = "blue",
  icon,
  href,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  tone?: "blue" | "mint" | "high" | "warn";
  icon?: React.ReactNode;
  href?: string;
}) {
  const t = TONES[tone] || TONES.blue;
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "·";
  const trendColor = trend === "up" ? C.mint : trend === "down" ? C.high : C.t3;
  const inner = (
    <div className="card-sm card-hover h-full">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="lab-label">{label}</div>
          <div className="metric mt-2 text-[31px] leading-none">
            {value}
            {unit && <span className="data text-text-2 text-[14px] ml-1 font-normal">{unit}</span>}
          </div>
          {sub && (
            <div className="data text-[11.5px] mt-2 flex items-center gap-1.5" style={{ color: trendColor }}>
              {trend && <span className="text-[8px]">{arrow}</span>}
              {sub}
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: t.bg, color: t.fg }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}
