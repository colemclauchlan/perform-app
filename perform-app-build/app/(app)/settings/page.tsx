"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { useProfile, useUpdateProfile } from "@/hooks/useNutrition";
import { createClient } from "@/lib/supabase-client";
import { Download, KeyRound, LogOut, Mail, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { DeviceFeatures } from "@/components/settings/DeviceFeatures";
import { Reveal } from "@/components/visual/Motion";

export default function SettingsPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const supabase = createClient();

  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");
  const [wu, setWu] = useState("lbs");

  // Account management state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function changeEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (email === profile?.email?.toLowerCase()) {
      toast.error("That's already your email.");
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/auth/callback` }
    );
    setEmailLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewEmail("");
    toast.success(
      "Confirmation links sent. Check both your old and new inboxes to finish the change.",
      { duration: 6000 }
    );
  }

  async function changePassword() {
    if (newPw.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords don't match.");
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPw("");
    setConfirmPw("");
    toast.success("Password updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  async function deleteAccount() {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      toast.error('Type DELETE to confirm.');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to delete account.");
        setDeleting(false);
        return;
      }
      toast.success("Account deleted.");
      router.push("/auth/login");
      router.refresh();
    } catch {
      toast.error("Network error. Try again.");
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (profile) {
      setCal(String(profile.target_calories));
      setP(String(profile.target_protein));
      setC(String(profile.target_carbs));
      setF(String(profile.target_fat));
      setWu(profile.weight_unit);
    }
  }, [profile]);

  function handleSave() {
    updateProfile.mutate(
      {
        target_calories: parseInt(cal) || 2500,
        target_protein: parseInt(p) || 200,
        target_carbs: parseInt(c) || 250,
        target_fat: parseInt(f) || 80,
        weight_unit: wu as "lbs" | "kg",
      },
      {
        onSuccess: () => toast.success("Settings saved"),
        onError: (e) => toast.error(e.message),
      }
    );
  }

  async function exportData() {
    toast.loading("Gathering your data...", { id: "export" });
    const tables = [
      "food_log",
      "food_catalog",
      "compound_protocols",
      "protocol_compounds",
      "dose_logs",
      "workout_sessions",
      "workout_sets",
      "body_weight_logs",
      "step_logs",
      "exercise_catalog",
    ];
    const dump: Record<string, unknown> = { profile };
    for (const t of tables) {
      const { data } = await supabase.from(t).select("*");
      dump[t] = data;
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "perform_export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported", { id: "export" });
  }

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Settings"
        subtitle="Configure your targets and preferences"
      />

      <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card">
          <div className="card-title">Daily Macro Targets</div>
          <div className="space-y-3">
            <div>
              <label className="label">Calories (kcal)</label>
              <input
                type="number"
                value={cal}
                onChange={(e) => setCal(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Protein (g)</label>
              <input
                type="number"
                value={p}
                onChange={(e) => setP(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Carbs (g)</label>
              <input
                type="number"
                value={c}
                onChange={(e) => setC(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fat (g)</label>
              <input
                type="number"
                value={f}
                onChange={(e) => setF(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary group mt-3" onClick={handleSave}>
            <span className="shine-overlay" />
            Save Targets
          </button>
        </div>

        <div className="card">
          <div className="card-title">Units &amp; Preferences</div>
          <div>
            <label className="label">Weight unit</label>
            <select value={wu} onChange={(e) => setWu(e.target.value)}>
              <option>lbs</option>
              <option>kg</option>
            </select>
          </div>
          <button className="btn btn-primary mt-3" onClick={handleSave}>
            Save
          </button>

          <div className="h-px bg-border my-4" />

          <div className="card-title">Data</div>
          <p className="text-[13px] text-text-2 mb-3">
            Download all your logged data as a JSON file for backup.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={exportData}>
            <Download size={14} /> Export all data (JSON)
          </button>
        </div>
      </Reveal>

      {/* iPhone device features — Apple Health sync + Face ID lock */}
      <DeviceFeatures />

      {/* Account & security */}
      <div className="card mt-3">
        <div className="card-title flex items-center gap-2">
          <KeyRound size={14} className="text-accent" /> Account &amp; Security
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <div className="space-y-3">
            <div>
              <label className="label flex items-center gap-1.5">
                <Mail size={12} className="text-text-3" /> Email address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={profile?.email || "you@example.com"}
                autoComplete="email"
              />
              <p className="text-[11px] text-text-3 mt-1">
                Current: <span className="text-text-2">{profile?.email}</span>.
                Changing it sends a confirmation link to both addresses.
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={changeEmail}
              disabled={emailLoading}
            >
              {emailLoading ? "Sending..." : "Change email"}
            </button>

            <div className="h-px bg-border my-1" />

            <div>
              <label className="label">New password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
                minLength={8}
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                minLength={8}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={changePassword}
              disabled={pwLoading}
            >
              {pwLoading ? "Updating..." : "Change password"}
            </button>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <p className="text-[13px] text-text-2 mb-3">
                Signed in as{" "}
                <span className="text-text-1">{profile?.email}</span>
              </p>
              <button className="btn btn-ghost btn-sm" onClick={signOut}>
                <LogOut size={14} /> Sign out
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[11px] uppercase tracking-wide text-status-red/80 font-semibold mb-1">
                Danger zone
              </div>
              <p className="text-[12px] text-text-3 mb-2">
                Permanently delete your account and all logged data. This cannot
                be undone.
              </p>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={14} /> Delete account
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete account"
      >
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            This permanently deletes your account, profile, and every log
            (nutrition, workouts, compounds, doses, bloodwork, body metrics).
            This action is irreversible.
          </p>
          <div>
            <label className="label">
              Type <span className="text-status-red font-semibold">DELETE</span> to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              className="btn btn-danger"
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Permanently delete"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
