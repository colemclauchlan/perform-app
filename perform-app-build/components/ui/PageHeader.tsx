import { cn } from "@/lib/utils";
import { PulseLine } from "@/components/ui/PulseLine";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string;
  subtitle?: string;
  /** Optional mono lab-label above the title (e.g. "HEALTH · OVERVIEW"). */
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start mb-7 flex-wrap gap-3 animate-fade-in">
      <div className="relative pl-4">
        {/* Signal spine — a gradient rule capped by the bright node (signal peak). */}
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-gradient" />
        <span className="signal-node absolute left-[-2px] top-0.5 w-[7px] h-[7px] rounded-full bg-accent-bright" />

        {eyebrow && <div className="lab-label mb-1.5">{eyebrow}</div>}
        <h1 className="font-display font-bold tracking-tight leading-[1.02] text-[27px] sm:text-[32px]">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-text-2 mt-2">{subtitle}</p>}

        {/* Connective tissue — a single heartbeat threading under the title. */}
        <PulseLine className="mt-3 -ml-0.5" width={200} height={16} opacity={0.32} />
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  unit,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "·";
  return (
    <div className="card-sm card-hover">
      <div className="lab-label">{label}</div>
      <div className="metric mt-2 text-[26px]">
        {value}
        {unit && <span className="data text-text-2 text-[13px] ml-1 font-normal">{unit}</span>}
      </div>
      {sub && (
        <div
          className={cn(
            "data text-[11px] mt-2 flex items-center gap-1",
            trend === "up" && "text-status-green",
            trend === "down" && "text-status-red",
            (!trend || trend === "neutral") && "text-text-3"
          )}
        >
          {trend && trend !== "neutral" && <span className="text-[8px]">{arrow}</span>}
          {sub}
        </div>
      )}
    </div>
  );
}
