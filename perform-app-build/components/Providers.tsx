"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CapacitorInit } from "@/components/CapacitorInit";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <CapacitorInit />
      {children}
    </QueryClientProvider>
  );
}
