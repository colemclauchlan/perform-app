"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { HeroBackdrop } from "@/components/visual/HeroBackdrop";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // The user lands here with a recovery session already established by the
  // callback route. Verify there is a session before allowing a password set.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error("Reset link expired or invalid. Request a new one.");
        router.replace("/auth/forgot-password");
        return;
      }
      setReady(true);
    });
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. You're all set.");
    router.push("/dashboard");
    router.refresh();
  }

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

        <div className="glass hairline-top rounded-2xl p-6">
          <h1 className="text-xl font-bold tracking-tight mb-1">
            Set a new <span className="text-brand">password</span>
          </h1>
          <p className="text-sm text-text-2 mb-6">
            Choose a strong password you don&apos;t use elsewhere.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                disabled={!ready}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                disabled={!ready}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !ready}
              className="btn btn-primary group w-full justify-center"
            >
              <span className="shine-overlay" />
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
