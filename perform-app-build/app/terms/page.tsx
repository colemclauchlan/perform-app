import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — BodyTracker",
  description: "The terms that govern your use of BodyTracker.",
};

const CONTACT_EMAIL = "support@bodytracker.app";
const EFFECTIVE = "June 18, 2026";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Terms of Service
        </h1>
        <p className="text-text-3 text-sm mb-8">Effective {EFFECTIVE}</p>

        <div className="space-y-7 text-[15px] leading-relaxed text-text-2">
          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              Acceptance
            </h2>
            <p>
              By creating an account or using BodyTracker (&ldquo;the app&rdquo;),
              you agree to these Terms. If you do not agree, do not use the app.
              You must be at least 17 years old to use BodyTracker.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              Not medical advice
            </h2>
            <p>
              BodyTracker is a personal tracking tool. It is not a medical device
              and does not provide medical advice, diagnosis, or treatment. All
              content, including AI-generated coaching and any information about
              training, nutrition, supplements, hormones, or compounds (including
              performance-enhancing drugs), is provided for informational and
              educational purposes only. It is not a recommendation or
              prescription. The app does not encourage the unlawful use of any
              substance.
            </p>
            <p className="mt-3">
              Always consult a qualified, licensed healthcare professional before
              starting, stopping, or changing any diet, training program,
              supplement, medication, or substance. You are solely responsible for
              your health decisions. Never disregard professional medical advice
              because of something you read in this app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              Your account &amp; data
            </h2>
            <p>
              You are responsible for the accuracy of the information you enter and
              for keeping your login credentials secure. You may delete your
              account and all associated data at any time from Settings &rarr;
              Account &amp; Security. Our handling of your data is described in our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              Acceptable use
            </h2>
            <p>
              Use the app only for your own lawful, personal tracking. Do not
              attempt to disrupt, reverse engineer, or gain unauthorized access to
              the app or other users&rsquo; data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">
              Disclaimer of warranties &amp; limitation of liability
            </h2>
            <p>
              The app is provided &ldquo;as is&rdquo; without warranties of any
              kind. To the maximum extent permitted by law, we are not liable for
              any injury, loss, or damages arising from your use of the app or
              reliance on its content, including AI-generated suggestions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">Changes</h2>
            <p>
              We may update these Terms from time to time. Continued use after an
              update constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-1 mb-2">Contact</h2>
            <p>
              Questions about these Terms? Email{" "}
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
          <Link href="/privacy" className="hover:text-text-1 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </main>
    </div>
  );
}
