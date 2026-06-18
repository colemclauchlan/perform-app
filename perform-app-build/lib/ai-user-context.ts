import { createClient } from "@/lib/supabase-server";

// Builds a comprehensive, bounded snapshot of the authenticated user's tracked
// health data for the AI coach and nutrition reviewer. Every table is limited
// to a recent window / latest-N / aggregate so the breadth of the app's data is
// covered without blowing the prompt budget. All queries are best-effort —
// missing tables or empty data simply omit their line.

function num(n: unknown): number {
  return Number(n) || 0;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

export async function buildUserContext(userId: string): Promise<string> {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = isoDaysAgo(7);
  const twoWeeksAgo = isoDaysAgo(14);

  const [
    { data: profile },
    { data: sessions },
    { data: weights },
    { data: measurement },
    { data: foodWeek },
    { data: sleep },
    { data: hydration },
    { data: steps },
    { data: checkin },
    { data: weekSets },
    { data: protocols },
    { data: doses },
    { data: blood },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("workout_sessions")
      .select("name, session_date, duration_minutes")
      .order("session_date", { ascending: false })
      .limit(8),
    supabase
      .from("body_weight_logs")
      .select("weight, unit, logged_date")
      .order("logged_date", { ascending: false })
      .limit(30),
    supabase
      .from("body_measurements")
      .select("*")
      .order("logged_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("food_log")
      .select("logged_date, calories, protein, carbs, fat")
      .gte("logged_date", weekAgo),
    supabase
      .from("sleep_logs")
      .select("logged_date, duration_hours, quality")
      .order("logged_date", { ascending: false })
      .limit(7),
    supabase
      .from("hydration_logs")
      .select("logged_date, amount_ml")
      .gte("logged_date", weekAgo),
    supabase
      .from("step_logs")
      .select("logged_date, step_count")
      .gte("logged_date", twoWeeksAgo)
      .order("logged_date", { ascending: false }),
    supabase
      .from("checkin_photos")
      .select("taken_date, weight, body_fat, notes")
      .order("taken_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sets")
      .select("exercise_name, e1rm, weight_unit, created_at")
      .gte("created_at", `${twoWeeksAgo}T00:00:00`)
      .order("e1rm", { ascending: false })
      .limit(60),
    supabase
      .from("compound_protocols")
      .select(
        "name, start_date, end_date, protocol_compounds(compound_name, dose, compound_unit, frequency)"
      )
      .eq("is_active", true),
    supabase
      .from("dose_logs")
      .select("compound_name, dose_amount, compound_unit, logged_at, injection_site")
      .order("logged_at", { ascending: false })
      .limit(12),
    supabase
      .from("bloodwork_entries")
      .select(
        "drawn_date, lab_name, markers:bloodwork_markers(marker, value, unit, ref_low, ref_high, flag)"
      )
      .order("drawn_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const wu = profile?.weight_unit || "lbs";
  const lines: string[] = ["=== USER HEALTH PROFILE & HISTORY ==="];

  // Profile / targets
  if (profile) {
    const who = profile.display_name ? `${profile.display_name}. ` : "";
    const ht = profile.height_cm ? ` Height: ${profile.height_cm}cm.` : "";
    lines.push(
      `${who}Daily targets: ${num(profile.target_calories)} kcal, ${num(
        profile.target_protein
      )}g protein, ${num(profile.target_carbs)}g carbs, ${num(
        profile.target_fat
      )}g fat. Preferred weight unit: ${wu}.${ht}`
    );
  }

  // Body weight (latest + trend over the logged window)
  if (weights?.length) {
    const latest = weights[0];
    const oldest = weights[weights.length - 1];
    const delta = num(latest.weight) - num(oldest.weight);
    const trend =
      weights.length > 1
        ? ` Trend over last ${weights.length} entries: ${delta >= 0 ? "+" : ""}${delta.toFixed(
            1
          )} ${latest.unit} (since ${oldest.logged_date}).`
        : "";
    lines.push(
      `Body weight: ${latest.weight} ${latest.unit} on ${latest.logged_date}.${trend}`
    );
  }

  // Latest body measurements
  if (measurement) {
    const parts: string[] = [];
    if (measurement.body_fat_pct != null) parts.push(`body fat ${measurement.body_fat_pct}%`);
    if (measurement.waist_cm != null) parts.push(`waist ${measurement.waist_cm}cm`);
    if (measurement.chest_cm != null) parts.push(`chest ${measurement.chest_cm}cm`);
    const arm = measurement.right_arm_cm ?? measurement.left_arm_cm;
    if (arm != null) parts.push(`arm ${arm}cm`);
    const thigh = measurement.right_thigh_cm ?? measurement.left_thigh_cm;
    if (thigh != null) parts.push(`thigh ${thigh}cm`);
    if (parts.length)
      lines.push(`Latest measurements (${measurement.logged_date}): ${parts.join(", ")}.`);
  }

  // Latest check-in photo stats
  if (checkin && (checkin.weight != null || checkin.body_fat != null)) {
    const bits: string[] = [];
    if (checkin.weight != null) bits.push(`weight ${checkin.weight}`);
    if (checkin.body_fat != null) bits.push(`body fat ${checkin.body_fat}%`);
    lines.push(
      `Latest physique check-in (${checkin.taken_date}): ${bits.join(", ")}${
        checkin.notes ? ` — "${checkin.notes}"` : ""
      }.`
    );
  }

  // Nutrition: today + 7-day daily averages
  if (foodWeek?.length) {
    const todays = foodWeek.filter((f) => f.logged_date === today);
    const sum = (rows: typeof foodWeek) =>
      rows.reduce(
        (a, f) => ({
          cal: a.cal + num(f.calories),
          p: a.p + num(f.protein),
          c: a.c + num(f.carbs),
          ff: a.ff + num(f.fat),
        }),
        { cal: 0, p: 0, c: 0, ff: 0 }
      );
    const t = sum(todays);
    lines.push(
      `Today's intake so far: ${Math.round(t.cal)} kcal, ${Math.round(t.p)}g protein, ${Math.round(
        t.c
      )}g carbs, ${Math.round(t.ff)}g fat.`
    );
    const days = new Set(foodWeek.map((f) => f.logged_date)).size || 1;
    const w = sum(foodWeek);
    lines.push(
      `7-day average intake (${days} logged day${days === 1 ? "" : "s"}): ${Math.round(
        w.cal / days
      )} kcal, ${Math.round(w.p / days)}g protein, ${Math.round(w.c / days)}g carbs, ${Math.round(
        w.ff / days
      )}g fat per day.`
    );
  } else {
    lines.push("Nutrition: no food logged in the last 7 days.");
  }

  // Training: recent sessions + top lifts by e1RM
  if (sessions?.length) {
    lines.push(
      `Recent workouts: ${sessions
        .map(
          (s) =>
            `${s.name} (${s.session_date}${
              s.duration_minutes ? `, ${s.duration_minutes}min` : ""
            })`
        )
        .join("; ")}.`
    );
  } else {
    lines.push("Training: no workouts logged.");
  }
  if (weekSets?.length) {
    const bestByLift: Record<string, { e1rm: number; unit: string }> = {};
    weekSets.forEach((s) => {
      const e = num(s.e1rm);
      if (!bestByLift[s.exercise_name] || e > bestByLift[s.exercise_name].e1rm) {
        bestByLift[s.exercise_name] = { e1rm: e, unit: s.weight_unit };
      }
    });
    const top = Object.entries(bestByLift)
      .sort((a, b) => b[1].e1rm - a[1].e1rm)
      .slice(0, 8)
      .map(([n, v]) => `${n} ~${Math.round(v.e1rm)}${v.unit}`)
      .join("; ");
    if (top) lines.push(`Top estimated 1RMs (last 14 days): ${top}.`);
  }

  // Sleep
  if (sleep?.length) {
    const hrs = sleep.map((s) => num(s.duration_hours)).filter((h) => h > 0);
    const q = sleep.map((s) => num(s.quality)).filter((v) => v > 0);
    const avgHrs = avg(hrs);
    lines.push(
      `Sleep (last ${sleep.length} nights): avg ${avgHrs ? avgHrs.toFixed(1) : "—"}h${
        q.length ? `, avg quality ${avg(q).toFixed(1)}/5` : ""
      }.`
    );
  }

  // Hydration: today + 7-day daily average
  if (hydration?.length) {
    const todayMl = hydration
      .filter((h) => h.logged_date === today)
      .reduce((a, h) => a + num(h.amount_ml), 0);
    const days = new Set(hydration.map((h) => h.logged_date)).size || 1;
    const totalMl = hydration.reduce((a, h) => a + num(h.amount_ml), 0);
    lines.push(
      `Hydration: ${Math.round(todayMl)}ml today, ~${Math.round(
        totalMl / days
      )}ml/day average over the last week.`
    );
  }

  // Steps
  if (steps?.length) {
    const avgSteps = avg(steps.map((s) => num(s.step_count)));
    lines.push(
      `Steps: ~${Math.round(avgSteps).toLocaleString()}/day average over the last ${
        steps.length
      } days.`
    );
  }

  // Compound protocols + recent doses
  if (protocols?.length) {
    const lines2 = protocols.map((p) => {
      const comps = Array.isArray(p.protocol_compounds)
        ? p.protocol_compounds
            .map(
              (c: {
                compound_name: string;
                dose: number;
                compound_unit: string;
                frequency: string;
              }) => `${c.compound_name} ${num(c.dose)}${c.compound_unit} ${c.frequency}`
            )
            .join(", ")
        : "";
      return `${p.name}${p.start_date ? ` (since ${p.start_date})` : ""}${
        comps ? `: ${comps}` : ""
      }`;
    });
    lines.push(`Active compound protocols — ${lines2.join(" | ")}.`);
  }
  if (doses?.length) {
    const recent = doses
      .slice(0, 8)
      .map(
        (d) =>
          `${d.compound_name} ${num(d.dose_amount)}${d.compound_unit} (${String(
            d.logged_at
          ).slice(0, 10)}${d.injection_site ? `, ${d.injection_site}` : ""})`
      )
      .join("; ");
    lines.push(`Recent doses: ${recent}.`);
  }

  // Latest bloodwork with flagged markers highlighted
  if (blood) {
    const markers = Array.isArray(blood.markers) ? blood.markers : [];
    const flagged = markers.filter(
      (m: { flag: string | null }) => m.flag && m.flag.toLowerCase() !== "normal"
    );
    const shown = (flagged.length ? flagged : markers).slice(0, 12);
    const markerStr = shown
      .map(
        (m: { marker: string; value: number | null; unit: string | null; flag: string | null }) =>
          `${m.marker} ${m.value ?? "—"}${m.unit || ""}${
            m.flag && m.flag.toLowerCase() !== "normal" ? ` [${m.flag}]` : ""
          }`
      )
      .join(", ");
    lines.push(
      `Latest bloodwork (${blood.drawn_date}${blood.lab_name ? `, ${blood.lab_name}` : ""}): ${
        markerStr || "no markers recorded"
      }.${flagged.length ? " (Out-of-range markers shown.)" : ""}`
    );
  }

  return lines.join("\n");
}
