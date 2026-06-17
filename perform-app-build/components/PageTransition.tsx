"use client";

import { usePathname } from "next/navigation";

// Re-keyed on the route so page content fades in fresh on each navigation.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  );
}
