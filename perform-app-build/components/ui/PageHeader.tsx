import { cn } from "@/lib/utils";

/**
 * In-content page header. The shell's TopBar now owns the page title + subtitle
 * (matching the Vital Signal kit), so on desktop this renders only the page's
 * action buttons (right-aligned). On mobile — where there is no desktop TopBar —
 * it still shows the title so the screen is labelled.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string;
  subtitle?: string;
  /** Optional mono lab-label above the title (mobile only). */
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start mb-5 flex-wrap gap-3 animate-fade-in">
      {/* Mobile-only title (desktop gets it from the TopBar). */}
      <div className="md:hidden relative pl-4">
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-gradient" />
        {eyebrow && <div className="lab-label mb-1.5">{eyebrow}</div>}
        <h1 className="font-display font-bold tracking-tight leading-[1.02] text-[24px]">{title}</h1>
        {subtitle && <p className="text-sm text-text-2 mt-1.5">{subtitle}</p>}
      </div>
      {/* Spacer keeps the action right-aligned on desktop. */}
      <div className="hidden md:block" />
      {action && <div className="flex-none">{action}</div>}
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
