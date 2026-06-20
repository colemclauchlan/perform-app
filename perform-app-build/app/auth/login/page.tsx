"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { HeroBackdrop } from "@/components/visual/HeroBackdrop";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Surface auth-callback errors (expired/invalid links) passed via ?error=.
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) {
      toast.error(err);
      window.history.replaceState({}, "", "/auth/login");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      if (password.length < 8) {
        toast.error("Use at least 8 characters for your password.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      // If email confirmation is enabled, there is no session yet — send the
      // user to the verify screen. Otherwise they are signed in immediately.
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      }
      setLoading(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    }
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
          <Logo variant="icon" size={96} className="rounded-full ring-1 ring-white/10 drop-shadow-[0_8px_30px_rgba(37,99,235,0.45)]" />
        </div>

        <div className="glass hairline-top rounded-2xl p-6">
          <h1 className="text-xl font-bold tracking-tight mb-1">
            {mode === "login" ? (
              <>Welcome <span className="text-brand">back</span></>
            ) : (
              "Create your account"
            )}
          </h1>
          <p className="text-sm text-text-2 mb-6">
            {mode === "login"
              ? "Log in to access your dashboard"
              : "Start tracking your performance"}
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
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                {mode === "login" && (
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={mode === "signup" ? 8 : 6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary group w-full justify-center disabled:opacity-50"
            >
              <span className="shine-overlay" />
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Log in"
                : "Sign up"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-text-2">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-accent hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-accent hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
