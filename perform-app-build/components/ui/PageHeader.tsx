import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start mb-6 flex-wrap gap-3 animate-fade-in">
      <div className="relative pl-3.5">
        {/* Brand-gradient accent bar — a small signature detail on every page */}
        <span className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-brand-gradient" />
        <h1 className="text-2xl font-display font-bold tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="text-sm text-text-2 mt-1.5">{subtitle}</p>}
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
  return (
    <div className="card-sm card-hover">
      <div className="text-[11px] text-text-3 uppercase tracking-[0.12em] font-semibold">{label}</div>
      <div className="text-2xl font-display font-bold mt-1.5 leading-none tabular-nums">
        {value}
        {unit && <span className="text-sm text-text-2 ml-1 font-normal">{unit}</span>}
      </div>
      {sub && (
        <div
          className={cn(
            "text-[11px] mt-1",
            trend === "up" && "text-status-green",
            trend === "down" && "text-status-red",
            (!trend || trend === "neutral") && "text-text-3"
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
