// Database types matching the Supabase schema

export type WeightUnit = "lbs" | "kg";
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Pre-workout" | "Post-workout";
export type CompoundType = "Steroid" | "Peptide" | "SARMs" | "Ancillary" | "AI / SERM" | "Supplement" | "Other";
export type CompoundUnit = "mg" | "mcg" | "IU" | "ml" | "capsules" | "g";
export type Frequency = "Daily" | "EOD" | "E3D" | "Twice/week" | "Weekly" | "Twice/day";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  weight_unit: WeightUnit;
  created_at: string;
  updated_at: string;
}

export interface FoodCatalogItem {
  id: string;
  user_id: string | null;
  name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  is_global: boolean;
  created_at: string;
}

export interface FoodLogEntry {
  id: string;
  user_id: string;
  food_catalog_id: string | null;
  name: string;
  meal: MealType;
  logged_date: string;
  quantity: number;
  quantity_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface CompoundCatalogItem {
  id: string;
  user_id: string | null;
  name: string;
  type: CompoundType;
  unit: CompoundUnit;
  half_life_hours: number | null;
  notes: string | null;
  is_global: boolean;
  created_at: string;
}

export interface CompoundProtocol {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  compounds?: ProtocolCompound[];
}

export interface ProtocolCompound {
  id: string;
  protocol_id: string;
  user_id: string;
  compound_catalog_id: string | null;
  compound_name: string;
  compound_unit: string;
  half_life_hours: number | null;
  dose: number;
  frequency: Frequency;
  scheduled_time: string | null;
  created_at: string;
  last_dose?: DoseLog | null;
}

export interface DoseLog {
  id: string;
  user_id: string;
  protocol_id: string;
  protocol_compound_id: string | null;
  compound_name: string;
  compound_unit: string;
  dose_amount: number;
  logged_at: string;
  injection_site: string | null;
  batch_lot: string | null;
  notes: string | null;
  created_at: string;
}

export interface ExerciseCatalogItem {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string;
  equipment: string;
  exercise_type: string;
  is_global: boolean;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  name: string;
  session_date: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  user_id: string;
  exercise_catalog_id: string | null;
  exercise_name: string;
  set_number: number;
  reps: string | null;
  weight: number | null;
  weight_unit: string;
  rpe: number | null;
  notes: string | null;
  created_at: string;
}

export interface BodyWeightLog {
  id: string;
  user_id: string;
  weight: number;
  unit: WeightUnit;
  logged_date: string;
  logged_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface StepLog {
  id: string;
  user_id: string;
  logged_date: string;
  step_count: number;
  source: "apple_health" | "manual";
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  logged_date: string;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  neck_cm: number | null;
  left_arm_cm: number | null;
  right_arm_cm: number | null;
  left_thigh_cm: number | null;
  right_thigh_cm: number | null;
  left_calf_cm: number | null;
  right_calf_cm: number | null;
  body_fat_pct: number | null;
  notes: string | null;
  created_at: string;
}

export interface HydrationLog {
  id: string;
  user_id: string;
  logged_date: string;
  amount_ml: number;
  source: string;
  created_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  logged_date: string;
  sleep_start: string | null;
  sleep_end: string | null;
  duration_hours: number | null;
  quality: number | null;
  notes: string | null;
  created_at: string;
}
