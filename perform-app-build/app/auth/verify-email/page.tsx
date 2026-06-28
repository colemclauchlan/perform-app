"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { HeroBackdrop } from "@/components/visual/HeroBackdrop";
import { motion } from "framer-motion";
import { MailCheck, ArrowLeft } from "lucide-react";

function VerifyEmailInner() {
  const supabase = createClient();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [resending, setResending] = useState(false);

  async function resend() {
    if (!email) {
      toast.error("Open the link from your sign-up to resend.");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Verification email resent.");
  }

  return (
    <div className="glass hairline-top rounded-2xl text-center p-6">
      <div className="w-14 h-14 rounded-2xl bg-accent-dim flex items-center justify-center mx-auto mb-4 ring-1 ring-inset ring-accent/20 animate-float">
        <MailCheck className="text-accent" size={24} />
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-1">
        Verify your <span className="text-brand">email</span>
      </h1>
      <p className="text-sm text-text-2 mb-6">
        We sent a confirmation link{email ? <> to <span className="text-text-1">{email}</span></> : null}.
        Click it to activate your account, then log in.
      </p>
      <div className="space-y-2">
        <button
          onClick={resend}
          disabled={resending}
          className="btn btn-ghost w-full justify-center"
        >
          {resending ? "Resending..." : "Resend email"}
        </button>
        <Link href="/auth/login" className="btn btn-primary group w-full justify-center">
          <span className="shine-overlay" />
          <ArrowLeft size={15} /> Back to log in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <HeroBackdrop />
      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-center mb-7">
          <Logo variant="full" size={88} className="rounded-xl drop-shadow-[0_8px_30px_rgba(24,155,245,0.35)]" />
        </div>
        <Suspense fallback={<div className="glass rounded-2xl text-center py-8 text-text-3 text-sm">Loading…</div>}>
          <VerifyEmailInner />
        </Suspense>
      </motion.div>
    </div>
  );
}
