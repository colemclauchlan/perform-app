"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
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
    <div className="card text-center py-4">
      <div className="w-12 h-12 rounded-full bg-accent-dim flex items-center justify-center mx-auto mb-4">
        <MailCheck className="text-accent" size={22} />
      </div>
      <h1 className="text-lg font-semibold mb-1">Verify your email</h1>
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
        <Link href="/auth/login" className="btn btn-primary w-full justify-center">
          <ArrowLeft size={15} /> Back to log in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Logo variant="full" size={96} className="rounded-xl" />
        </div>
        <Suspense fallback={<div className="card text-center py-8 text-text-3 text-sm">Loading…</div>}>
          <VerifyEmailInner />
        </Suspense>
      </div>
    </div>
  );
}
