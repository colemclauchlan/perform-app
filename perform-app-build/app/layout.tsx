import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

// Distinctive display face for headings / numerics — gives the UI a technical,
// engineered character instead of the default Inter-everywhere look.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

// Monospaced figures for the "Clinical Readout" instrument styling (data/units).
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
});

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
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
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
