"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

// Route-level error boundary. Prevents a thrown render/data error from showing a
// blank white screen (critical inside the iOS WebView, where there is no browser
// chrome to recover with). Lets the user retry or return home.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in dev / native logs; no PII beyond the message.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-0 px-6 text-center">
      <AlertTriangle className="text-status-amber mb-4" size={40} />
      <h1 className="text-lg font-semibold text-text-1 mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-text-3 max-w-sm mb-6">
        An unexpected error occurred. You can try again, and if it keeps
        happening, head back to your dashboard.
      </p>
      <div className="flex gap-3">
        <button className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/dashboard" className="btn btn-ghost">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
