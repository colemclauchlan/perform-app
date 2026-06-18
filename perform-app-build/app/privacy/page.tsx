import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — BodyTracker",
  description:
    "How BodyTracker collects, stores, and protects your account and health data.",
};

// IMPORTANT: replace this with your real support email before submitting to the
// App Store (it is shown to users and referenced in the App Store listing).
const CONTACT_EMAIL = "support@bodytracker.app";
const EFFECTIVE = "June 18, 2026";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-30 glass">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo variant="full" size={28} className="rounded-lg" />
          </Link>
          <Link href="/" className="btn btn-ghost btn-sm">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 selectable">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Privacy Policy</h1>
        <p className="text-text-3 text-sm mb-8">Effective {EFFECTIVE}</p>

        <div className="space-y-7 text-[15px] leading-relaxed text-text-2">
          <section>
            <p>
              BodyTracker (&ldquo;the app,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;)
              is a personal fitness, nutrition, and health-tracking tool. This
              policy explains what we collect, how it is stored, and the control
              you have over your data. We do not sell your data, and we do not use
              it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              Information we collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-text-1">Account information:</strong> your
                email address and password (passwords are hashed by our
                authentication provider and never visible to us).
              </li>
              <li>
                <strong className="text-text-1">Health &amp; fitness data you
                enter:</strong> nutrition and macros, body weight, body
                measurements, check-in photos, workouts and sets, sleep,
                hydration, steps, bloodwork markers, and compound/PED protocols
                and dose logs.
              </li>
              <li>
                <strong className="text-text-1">Apple Health data (iOS only,
                optional):</strong> if you enable syncing, the app reads steps,
                body weight, and sleep from Apple Health to keep your dashboard up
                to date. This stays on your device until you sync it into your
                account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              How your data is stored and secured
            </h2>
            <p>
              Your data is stored in our managed database provider (Supabase).
              Every record is isolated to your account using row-level security,
              so other users cannot access your data. Connections are encrypted in
              transit (HTTPS/TLS).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              AI Coach &amp; AI features
            </h2>
            <p>
              If you use the optional AI Coach or AI meal-plan review, a snapshot
              of your relevant tracked data is sent to our AI provider (Anthropic)
              to generate a response. This data is used only to produce your
              response and is not used to train models. Don&rsquo;t use the AI
              features if you do not want your data processed this way.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              Your controls
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-text-1">Edit or delete entries</strong> at
                any time within the app.
              </li>
              <li>
                <strong className="text-text-1">Delete your account:</strong> go to
                Settings &rarr; Account &amp; Security &rarr; Delete account. This
                permanently removes your account and all associated data.
              </li>
              <li>
                <strong className="text-text-1">Revoke Apple Health access</strong>{" "}
                anytime in the iOS Settings &rarr; Privacy &amp; Security &rarr;
                Health.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              Data sharing
            </h2>
            <p>
              We share data only with the service providers required to run the
              app: our database/auth provider (Supabase), hosting provider
              (Vercel), and, when you use AI features, our AI provider
              (Anthropic). We do not sell your data or share it with advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              Medical disclaimer
            </h2>
            <p>
              BodyTracker is a self-tracking tool, not a medical device or a
              source of medical advice. Content, including AI-generated
              suggestions and any information about training, nutrition,
              supplements, or compounds, is for informational purposes only and is
              not a substitute for professional medical guidance. Always consult a
              qualified healthcare provider before making decisions about your
              health, medications, or any substances.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">Children</h2>
            <p>
              BodyTracker is not intended for anyone under 17. We do not knowingly
              collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">Contact</h2>
            <p>
              Questions about this policy or your data? Email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-accent hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-sm text-text-3">
          <Link href="/terms" className="hover:text-text-1 transition-colors">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
