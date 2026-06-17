import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BodyTracker — Performance Dashboard",
    template: "%s · BodyTracker",
  },
  description:
    "Track nutrition & macros, workouts & lift progression, body metrics, bloodwork, and compound protocols — synced across web and iOS.",
  applicationName: "BodyTracker",
  keywords: [
    "fitness tracker",
    "nutrition tracker",
    "macro tracker",
    "workout log",
    "lift progression",
    "bloodwork",
    "body metrics",
  ],
  authors: [{ name: "BodyTracker" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BodyTracker",
  },
  openGraph: {
    type: "website",
    siteName: "BodyTracker",
    title: "BodyTracker — Performance Dashboard",
    description:
      "Your nutrition, training, body metrics, and protocols in one synced dashboard.",
    url: siteUrl,
    images: ["/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "BodyTracker — Performance Dashboard",
    description:
      "Your nutrition, training, body metrics, and protocols in one synced dashboard.",
    images: ["/icon-512.png"],
  },
  robots: {
    // The app is private/auth-gated; allow indexing of the public landing only.
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#080b12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#131922",
                color: "#e8edf5",
                border: "1px solid #1e2d45",
                fontSize: "13px",
                borderRadius: "10px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
