"use client";

import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { CapacitorInit } from "@/components/CapacitorInit";
import { AppLock } from "@/components/AppLock";
import { OfflineBanner } from "@/components/OfflineBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        // Surface every write failure. Many call sites optimistically show a
        // success toast before awaiting the mutation; without this a failed
        // save (RLS, network, validation) would otherwise fail silently and the
        // user would think their data was saved.
        mutationCache: new MutationCache({
          onError: (error) => {
            const message =
              error instanceof Error && error.message
                ? error.message
                : "Something went wrong. Please try again.";
            toast.error(message);
          },
        }),
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
      <OfflineBanner />
      {children}
      <AppLock />
    </QueryClientProvider>
  );
}
