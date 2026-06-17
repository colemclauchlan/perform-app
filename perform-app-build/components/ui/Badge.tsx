import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  accent: "bg-accent/15 text-accent ring-1 ring-inset ring-accent/20",
  green: "bg-status-green/15 text-status-green ring-1 ring-inset ring-status-green/20",
  red: "bg-status-red/15 text-status-red ring-1 ring-inset ring-status-red/20",
  amber: "bg-status-amber/15 text-status-amber ring-1 ring-inset ring-status-amber/20",
  teal: "bg-status-teal/15 text-status-teal ring-1 ring-inset ring-status-teal/20",
  coral: "bg-status-coral/15 text-status-coral ring-1 ring-inset ring-status-coral/20",
  default: "bg-bg-3 text-text-2 border border-border",
};

export function Badge({
  children,
  variant = "accent",
  className,
  style,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={cn("badge", variants[variant], className)} style={style}>
      {children}
    </span>
  );
}

// Map compound types to badge colors
export function compoundBadgeVariant(type: string): keyof typeof variants {
  const map: Record<string, keyof typeof variants> = {
    Steroid: "accent",
    Peptide: "teal",
    "GLP-1": "green",
    "AI / SERM": "amber",
    Ancillary: "red",
    SARMs: "green",
    Supplement: "teal",
    Other: "coral",
  };
  return map[type] || "accent";
}
