import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "BodyTracker — Performance Dashboard",
  description: "Track nutrition, compounds, workouts, body metrics, and more",
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
};

export const viewport: Viewport = {
  themeColor: "#080b12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
