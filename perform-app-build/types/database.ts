// Database types matching the Supabase schema

export type WeightUnit = "lbs" | "kg";
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Pre-workout" | "Post-workout";
export type CompoundType = "Steroid" | "Peptide" | "GLP-1" | "SARMs" | "Ancillary" | "AI / SERM" | "Supplement" | "Other";

export type ExerciseCategory =
  | "Free Weights"
  | "Cable Machines"
  | "Plate Loaded Machines"
  | "Selectorized Machines"
  | "Bodyweight / Calisthenics"
  | "Cardio";

export type SetType = "Warmup" | "Working" | "Failure" | "Backoff" | "Dropset";
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
  height_cm: number | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  tab_order?: string[];
  hidden_tabs?: string[];
  dashboard_widgets?: { id: string; w: number; h: number; order: number; hidden?: boolean }[];
  // Show/hide + order of sections on the Gym and PED dashboards.
  gym_sections?: { id: string; order: number; hidden?: boolean }[];
  ped_sections?: { id: string; order: number; hidden?: boolean }[];
  available_equipment?: string[];
  hydration_goal_ml?: number;
  sleep_weekly_goal_hours?: number;
  custom_blood_markers?: {
    name: string;
    unit: string;
    ref_low?: number | null;
    ref_high?: number | null;
    category?: string;
  }[];
  favorite_compounds?: string[];
  custom_food_categories?: { name: string; color: string }[];
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
  ai_description: string | null;
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
  category: ExerciseCategory | string;
  secondary_muscles: string | null;
  movement_pattern: string | null;
  difficulty: string;
  equipment_detail: string | null;
  instructions: string | null;
  tips: string | null;
  common_mistakes: string | null;
  is_compound: boolean;
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
  template_id: string | null;
  photo_urls: string[];
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
  rest_seconds: number | null;
  set_type: SetType;
  superset_group: string | null;
  e1rm: number | null;
  position: number;
  notes: string | null;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  data: TemplateExercise[];
  created_at: string;
  updated_at: string;
}

export interface TemplateExercise {
  exercise_name: string;
  category?: string;
  muscle_group?: string;
  superset_group?: string | null;
  sets: { weight: number | null; reps: string; rpe?: number | null; set_type?: SetType }[];
}

export interface ExerciseFavorite {
  id: string;
  user_id: string;
  exercise_name: string;
  created_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string | null;
  name: string;
  meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Pre-workout" | "Post-workout" | "Full Day";
  notes: string | null;
  is_global: boolean;
  created_at: string;
  // Custom display names for meal groups in a Full Day plan (keyed by MealType).
  meal_labels?: Record<string, string> | null;
  items?: MealPlanItem[];
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  user_id: string | null;
  food_catalog_id: string | null;
  name: string;
  meal: MealType;
  quantity: number;
  quantity_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface BloodworkEntry {
  id: string;
  user_id: string;
  drawn_date: string;
  lab_name: string | null;
  notes: string | null;
  created_at: string;
  markers?: BloodworkMarker[];
}

export interface BloodworkMarker {
  id: string;
  entry_id: string;
  user_id: string;
  marker: string;
  value: number | null;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  category: string;
  flag: string | null;
  created_at: string;
}

export interface BloodPressureLog {
  id: string;
  user_id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  logged_at: string;
  notes: string | null;
  created_at: string;
}

export interface BloodSugarLog {
  id: string;
  user_id: string;
  value: number;
  fasted: boolean;
  logged_at: string;
  notes: string | null;
  created_at: string;
}

export interface CheckinPhoto {
  id: string;
  user_id: string;
  taken_date: string;
  front_url: string | null;
  side_url: string | null;
  back_url: string | null;
  weight: number | null;
  body_fat: number | null;
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
