"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProfile, useUpdateProfile } from "@/hooks/useNutrition";
import { createClient } from "@/lib/supabase-client";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const supabase = createClient();

  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");
  const [wu, setWu] = useState("lbs");

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
    a.href = URL.createObjectURL(blob);
    a.download = "perform_export.json";
    a.click();
    toast.success("Data exported", { id: "export" });
  }

  return (
    <div className="p-6 max-w-[1100px]">
      <PageHeader
        title="Settings"
        subtitle="Configure your targets and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
          <button className="btn btn-primary mt-3" onClick={handleSave}>
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
      </div>

      <div className="text-[11px] text-text-3 mt-6">
        Signed in as {profile?.email}
      </div>
    </div>
  );
}
