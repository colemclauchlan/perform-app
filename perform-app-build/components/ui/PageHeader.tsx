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
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-text-2 mt-1">{subtitle}</p>}
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
      <div className="text-[11px] text-text-3 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1.5 leading-none tabular-nums">
        {value}
        {unit && <span className="text-sm text-text-2 ml-1">{unit}</span>}
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
