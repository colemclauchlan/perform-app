"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

// Re-keyed on the route so content animates in fresh on each navigation. A
// subtle fade + rise gives every authenticated page a polished, app-like
// entrance without per-page work.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
