"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Logo variant="full" size={96} className="rounded-xl" />
        </div>

        <div className="card">
          <h1 className="text-lg font-semibold mb-1">Set a new password</h1>
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
              className="btn btn-primary w-full justify-center"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
