import Link from "next/link";
import { Compass } from "lucide-react";

// Friendly 404 instead of a bare default page (matters in the iOS WebView).
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-0 px-6 text-center">
      <Compass className="text-accent mb-4" size={40} />
      <h1 className="text-lg font-semibold text-text-1 mb-2">Page not found</h1>
      <p className="text-sm text-text-3 max-w-sm mb-6">
        That page doesn&apos;t exist or may have moved.
      </p>
      <Link href="/dashboard" className="btn btn-primary">
        Go to dashboard
      </Link>
    </div>
  );
}
