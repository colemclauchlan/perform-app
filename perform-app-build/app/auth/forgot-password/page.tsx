"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // The recovery email links back through the OAuth-style callback, which
    // exchanges the code for a session and then forwards to /auth/reset-password.
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Always show the same confirmation regardless of whether the email exists
    // (avoids leaking which addresses have accounts).
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Logo variant="full" size={96} className="rounded-xl" />
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-status-green/15 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="text-status-green" size={22} />
              </div>
              <h1 className="text-lg font-semibold mb-1">Check your email</h1>
              <p className="text-sm text-text-2 mb-6">
                If an account exists for <span className="text-text-1">{email}</span>,
                we sent a link to reset your password.
              </p>
              <Link href="/auth/login" className="btn btn-ghost w-full justify-center">
                <ArrowLeft size={15} /> Back to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold mb-1">Reset your password</h1>
              <p className="text-sm text-text-2 mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full justify-center"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <div className="mt-4 text-center text-sm text-text-2">
                <Link href="/auth/login" className="text-accent hover:underline">
                  Back to log in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
