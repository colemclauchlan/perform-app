import { PageHeader } from "@/components/ui/PageHeader";
import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  subtitle,
  bullets,
}: {
  title: string;
  subtitle?: string;
  bullets?: string[];
}) {
  return (
    <div className="p-6 max-w-[900px]">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card text-center py-14">
        <div className="w-12 h-12 rounded-xl bg-accent-dim border border-accent/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={22} className="text-accent" />
        </div>
        <div className="text-text-1 font-medium mb-1">Coming soon</div>
        <div className="text-text-3 text-sm max-w-md mx-auto">
          This section is being built. Here&apos;s what&apos;s on the way:
        </div>
        {bullets && (
          <ul className="mt-4 inline-block text-left space-y-1.5">
            {bullets.map((b) => (
              <li key={b} className="text-sm text-text-2 flex items-start gap-2">
                <span className="text-accent mt-1.5 w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
