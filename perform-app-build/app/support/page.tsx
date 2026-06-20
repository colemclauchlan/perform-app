import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft, Mail, LifeBuoy, Trash2, KeyRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Support — BodyTracker",
  description: "Get help with BodyTracker, manage your account, or contact us.",
};

const CONTACT_EMAIL = "support@bodytracker.app";

const FAQ = [
  {
    q: "How do I reset my password?",
    a: "On the login screen, tap \u201CForgot password,\u201D enter your email, and follow the link we send to set a new password.",
  },
  {
    q: "How do I change my email?",
    a: "Go to Settings \u2192 Account & Security \u2192 change email. You\u2019ll confirm the change from both your old and new inboxes.",
  },
  {
    q: "How do I delete my account?",
    a: "Settings \u2192 Account & Security \u2192 Delete account. This permanently removes your account and all of your data.",
  },
  {
    q: "Apple Health isn\u2019t syncing.",
    a: "In the iOS app go to Settings \u2192 Apple Health \u2192 Sync, and make sure you granted the Health permission. You can manage access in iOS Settings \u2192 Privacy & Security \u2192 Health.",
  },
];

export default function SupportPage() {
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

      <main className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-accent-dim flex items-center justify-center">
            <LifeBuoy size={20} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        </div>
        <p className="text-text-2 mb-8 selectable">
          We&rsquo;re here to help. Most questions are answered below — if you
          still need a hand, email us and we&rsquo;ll get back to you.
        </p>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="card card-hover flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-dim flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-accent" />
          </div>
          <div>
            <div className="font-semibold text-sm">Email support</div>
            <div className="text-sm text-accent">{CONTACT_EMAIL}</div>
          </div>
        </a>

        <h2 className="text-lg font-semibold mb-3">Common questions</h2>
        <div className="space-y-3 mb-8">
          {FAQ.map((f) => (
            <div key={f.q} className="card">
              <h3 className="font-medium text-text-1 mb-1">{f.q}</h3>
              <p className="text-sm text-text-2 leading-relaxed selectable">
                {f.a}
              </p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="card flex items-center gap-3">
            <KeyRound size={18} className="text-text-3 flex-shrink-0" />
            <p className="text-sm text-text-2">
              Manage your login in{" "}
              <span className="text-text-1">Settings &rarr; Account</span>.
            </p>
          </div>
          <div className="card flex items-center gap-3">
            <Trash2 size={18} className="text-text-3 flex-shrink-0" />
            <p className="text-sm text-text-2">
              Delete your account &amp; data anytime, in-app.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-sm text-text-3 flex gap-5">
          <Link href="/privacy" className="hover:text-text-1 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-text-1 transition-colors">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
