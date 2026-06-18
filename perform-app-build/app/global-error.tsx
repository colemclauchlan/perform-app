"use client";

import { useEffect } from "react";

// Last-resort boundary for errors thrown in the root layout itself (where the
// normal error.tsx cannot render because the layout is what failed). Renders its
// own <html>/<body>. Kept dependency-free so it can never fail to mount.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080b12",
          color: "#e8edf5",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "#8a97a8", maxWidth: 360, marginBottom: 24 }}>
          The app hit an unexpected error. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
