-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  -- Macro targets
  target_calories integer default 2500,
  target_protein integer default 200,
  target_carbs integer default 250,
  target_fat integer default 80,
  -- Preferences
  weight_unit text default 'lbs' check (weight_unit in ('lbs', 'kg')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- ─── FOOD CATALOG ───────────────────────────────────────────────────────────
create table public.food_catalog (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'Other',
  -- Per 100g values
  calories_per_100g numeric(8,2) not null default 0,
  protein_per_100g numeric(8,2) not null default 0,
  carbs_per_100g numeric(8,2) not null default 0,
  fat_per_100g numeric(8,2) not null default 0,
  is_global boolean default false, -- built-in foods visible to all users
  created_at timestamptz default now()
);

alter table public.food_catalog enable row level security;
create policy "Users can view own and global foods" on public.food_catalog
  for select using (user_id = auth.uid() or is_global = true);
create policy "Users can insert own foods" on public.food_catalog
  for insert with check (user_id = auth.uid());
create policy "Users can update own foods" on public.food_catalog
  for update using (user_id = auth.uid());
create policy "Users can delete own foods" on public.food_catalog
  for delete using (user_id = auth.uid());

-- ─── FOOD LOG ───────────────────────────────────────────────────────────────
create table public.food_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  food_catalog_id uuid references public.food_catalog(id) on delete set null,
  name text not null,
  meal text not null default 'Breakfast' check (meal in ('Breakfast','Lunch','Dinner','Snack','Pre-workout','Post-workout')),
  logged_date date not null default current_date,
  quantity numeric(8,2) not null default 100,
  quantity_unit text not null default 'g',
  -- Calculated totals stored for performance
  calories numeric(8,2) not null default 0,
  protein numeric(8,2) not null default 0,
  carbs numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  created_at timestamptz default now()
);

alter table public.food_log enable row level security;
create policy "Users can manage own food log" on public.food_log
  for all using (user_id = auth.uid());

create index food_log_user_date on public.food_log(user_id, logged_date desc);

-- ─── COMPOUND CATALOG ───────────────────────────────────────────────────────
create table public.compound_catalog (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  type text not null default 'Other' check (type in ('Steroid','Peptide','SARMs','Ancillary','AI / SERM','Supplement','Other')),
  unit text not null default 'mg' check (unit in ('mg','mcg','IU','ml','capsules','g')),
  half_life_hours numeric(8,2),
  notes text,
  is_global boolean default false,
  created_at timestamptz default now()
);

alter table public.compound_catalog enable row level security;
create policy "Users can view own and global compounds" on public.compound_catalog
  for select using (user_id = auth.uid() or is_global = true);
create policy "Users can manage own compounds" on public.compound_catalog
  for all using (user_id = auth.uid());

-- ─── COMPOUND PROTOCOLS ─────────────────────────────────────────────────────
create table public.compound_protocols (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  start_date date not null,
  end_date date,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.compound_protocols enable row level security;
create policy "Users can manage own protocols" on public.compound_protocols
  for all using (user_id = auth.uid());

-- ─── PROTOCOL COMPOUNDS (items within a protocol) ───────────────────────────
create table public.protocol_compounds (
  id uuid default uuid_generate_v4() primary key,
  protocol_id uuid references public.compound_protocols(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  compound_catalog_id uuid references public.compound_catalog(id) on delete set null,
  compound_name text not null,
  compound_unit text not null default 'mg',
  half_life_hours numeric(8,2),
  dose numeric(10,3) not null,
  frequency text not null default 'Daily' check (frequency in ('Daily','EOD','E3D','Twice/week','Weekly','Twice/day')),
  scheduled_time time default '08:00:00',
  created_at timestamptz default now()
);

alter table public.protocol_compounds enable row level security;
create policy "Users can manage own protocol compounds" on public.protocol_compounds
  for all using (user_id = auth.uid());

-- ─── DOSE LOGS ──────────────────────────────────────────────────────────────
create table public.dose_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  protocol_id uuid references public.compound_protocols(id) on delete cascade not null,
  protocol_compound_id uuid references public.protocol_compounds(id) on delete set null,
  compound_name text not null,
  compound_unit text not null default 'mg',
  dose_amount numeric(10,3) not null,
  logged_at timestamptz not null default now(),
  injection_site text,
  batch_lot text,
  notes text,
  created_at timestamptz default now()
);

alter table public.dose_logs enable row level security;
create policy "Users can manage own dose logs" on public.dose_logs
  for all using (user_id = auth.uid());

create index dose_logs_user_protocol on public.dose_logs(user_id, protocol_id, logged_at desc);

-- ─── EXERCISE CATALOG ───────────────────────────────────────────────────────
create table public.exercise_catalog (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  muscle_group text not null default 'Other',
  equipment text not null default 'Barbell',
  exercise_type text not null default 'Strength',
  is_global boolean default false,
  created_at timestamptz default now()
);

alter table public.exercise_catalog enable row level security;
create policy "Users can view own and global exercises" on public.exercise_catalog
  for select using (user_id = auth.uid() or is_global = true);
create policy "Users can manage own exercises" on public.exercise_catalog
  for all using (user_id = auth.uid());

-- ─── WORKOUT SESSIONS ───────────────────────────────────────────────────────
create table public.workout_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  session_date date not null default current_date,
  duration_minutes integer,
  notes text,
  created_at timestamptz default now()
);

alter table public.workout_sessions enable row level security;
create policy "Users can manage own workouts" on public.workout_sessions
  for all using (user_id = auth.uid());

create index workout_sessions_user_date on public.workout_sessions(user_id, session_date desc);

-- ─── WORKOUT SETS ───────────────────────────────────────────────────────────
create table public.workout_sets (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.workout_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  exercise_catalog_id uuid references public.exercise_catalog(id) on delete set null,
  exercise_name text not null,
  set_number integer not null default 1,
  reps text, -- text to allow "8-12", "AMRAP" etc
  weight numeric(8,2),
  weight_unit text default 'lbs',
  rpe numeric(3,1), -- rate of perceived exertion 1-10
  notes text,
  created_at timestamptz default now()
);

alter table public.workout_sets enable row level security;
create policy "Users can manage own workout sets" on public.workout_sets
  for all using (user_id = auth.uid());

create index workout_sets_session on public.workout_sets(session_id);
create index workout_sets_exercise on public.workout_sets(user_id, exercise_name, created_at desc);

-- ─── BODY WEIGHT ────────────────────────────────────────────────────────────
create table public.body_weight_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  weight numeric(8,2) not null,
  unit text not null default 'lbs' check (unit in ('lbs','kg')),
  logged_date date not null default current_date,
  logged_time time,
  notes text,
  created_at timestamptz default now()
);

alter table public.body_weight_logs enable row level security;
create policy "Users can manage own weight logs" on public.body_weight_logs
  for all using (user_id = auth.uid());

create index body_weight_user_date on public.body_weight_logs(user_id, logged_date desc);

-- ─── STEP LOGS (from Apple Health / manual) ─────────────────────────────────
create table public.step_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  logged_date date not null default current_date,
  step_count integer not null default 0,
  source text default 'manual' check (source in ('apple_health','manual')),
  created_at timestamptz default now(),
  unique(user_id, logged_date)
);

alter table public.step_logs enable row level security;
create policy "Users can manage own step logs" on public.step_logs
  for all using (user_id = auth.uid());

-- ─── TRIGGER: auto-create profile on signup ──────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── SEED: global food catalog ───────────────────────────────────────────────
insert into public.food_catalog (user_id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, is_global) values
  (null,'Chicken Breast (cooked)','Protein',165,31,0,3.6,true),
  (null,'Oats (dry)','Carb',389,17,66,7,true),
  (null,'Whole Eggs','Protein',155,13,1.1,11,true),
  (null,'Salmon (raw)','Protein',208,20,0,13,true),
  (null,'White Rice (cooked)','Carb',130,2.7,28,0.3,true),
  (null,'Sweet Potato','Carb',86,1.6,20,0.1,true),
  (null,'Ground Beef 90/10','Protein',215,26,0,12,true),
  (null,'Whey Protein','Supplement',120,25,3,2,true),
  (null,'Almonds','Fat',579,21,22,50,true),
  (null,'Greek Yogurt 0%','Dairy',59,10,3.6,0.4,true),
  (null,'Broccoli','Vegetable',34,2.8,7,0.4,true),
  (null,'Banana','Fruit',89,1.1,23,0.3,true),
  (null,'Olive Oil','Fat',884,0,0,100,true),
  (null,'Brown Rice (cooked)','Carb',216,5,45,1.8,true),
  (null,'Cottage Cheese 2%','Dairy',90,12,5,2.5,true),
  (null,'Beef Steak (sirloin)','Protein',207,26,0,11,true),
  (null,'Turkey Breast (cooked)','Protein',135,30,0,1,true),
  (null,'Tuna (canned in water)','Protein',116,26,0,1,true),
  (null,'Pasta (cooked)','Carb',158,5.8,31,0.9,true),
  (null,'Avocado','Fat',160,2,9,15,true),
  (null,'Peanut Butter','Fat',588,25,20,50,true),
  (null,'Egg Whites','Protein',52,11,0.7,0.2,true),
  (null,'Cheddar Cheese','Dairy',402,25,1.3,33,true),
  (null,'Blueberries','Fruit',57,0.7,14,0.3,true),
  (null,'Spinach','Vegetable',23,2.9,3.6,0.4,true);

-- ─── SEED: global compound catalog ───────────────────────────────────────────
insert into public.compound_catalog (user_id, name, type, unit, half_life_hours, notes, is_global) values
  (null,'Testosterone Enanthate','Steroid','mg',168,'Long-ester testosterone. IM injection 1-2x/week.',true),
  (null,'Testosterone Cypionate','Steroid','mg',192,'Long-ester. Similar to Enanthate. IM 1-2x/week.',true),
  (null,'Testosterone Propionate','Steroid','mg',48,'Short-ester. EOD injections required.',true),
  (null,'Testosterone Suspension','Steroid','mg',2,'No ester. Daily or pre-workout.',true),
  (null,'Nandrolone Decanoate (Deca)','Steroid','mg',336,'19-nor. Long ester. Weekly injection.',true),
  (null,'Trenbolone Acetate','Steroid','mg',72,'19-nor. Potent. EOD injections.',true),
  (null,'Masteron Propionate','Steroid','mg',48,'DHT-derivative. EOD injections.',true),
  (null,'Anastrozole (Arimidex)','AI / SERM','mg',46,'Aromatase inhibitor. On-cycle AI.',true),
  (null,'Exemestane (Aromasin)','AI / SERM','mg',27,'Suicidal AI. On-cycle.',true),
  (null,'Letrozole (Femara)','AI / SERM','mg',42,'Potent AI. Use with caution.',true),
  (null,'Nolvadex (Tamoxifen)','AI / SERM','mg',168,'SERM. PCT or gyno prevention.',true),
  (null,'Clomiphene (Clomid)','AI / SERM','mg',120,'SERM. PCT standard.',true),
  (null,'HCG','Ancillary','IU',36,'LH mimic. Prevents testicular atrophy.',true),
  (null,'BPC-157','Peptide','mcg',4,'Tissue healing peptide. SubQ or IM.',true),
  (null,'TB-500','Peptide','mg',8,'Thymosin Beta-4. Healing. SubQ.',true),
  (null,'CJC-1295 (DAC)','Peptide','mcg',336,'GHRH analogue. Weekly dosing.',true),
  (null,'Ipamorelin','Peptide','mcg',2,'GHRP. 3x daily before meals.',true),
  (null,'Semaglutide','Peptide','mg',168,'GLP-1. Weekly SubQ injection.',true),
  (null,'Creatine Monohydrate','Supplement','g',2,'5g daily. Load phase optional.',true),
  (null,'Metformin','Supplement','mg',6,'Insulin sensitizer. With meals.',true);

-- ─── SEED: global exercise catalog ───────────────────────────────────────────
insert into public.exercise_catalog (user_id, name, muscle_group, equipment, exercise_type, is_global) values
  (null,'Barbell Bench Press','Chest','Barbell','Strength',true),
  (null,'Incline Barbell Press','Chest','Barbell','Strength',true),
  (null,'Incline DB Press','Chest','Dumbbell','Hypertrophy',true),
  (null,'Cable Fly','Chest','Cable','Hypertrophy',true),
  (null,'Barbell Squat','Legs','Barbell','Strength',true),
  (null,'Front Squat','Legs','Barbell','Strength',true),
  (null,'Leg Press','Legs','Machine','Hypertrophy',true),
  (null,'Romanian Deadlift','Glutes','Barbell','Hypertrophy',true),
  (null,'Leg Curl','Legs','Machine','Hypertrophy',true),
  (null,'Leg Extension','Legs','Machine','Hypertrophy',true),
  (null,'Conventional Deadlift','Back','Barbell','Strength',true),
  (null,'Barbell Row','Back','Barbell','Strength',true),
  (null,'Pull-Up','Back','Bodyweight','Strength',true),
  (null,'Cable Lat Pulldown','Back','Cable','Hypertrophy',true),
  (null,'Seated Cable Row','Back','Cable','Hypertrophy',true),
  (null,'Overhead Press','Shoulders','Barbell','Strength',true),
  (null,'DB Lateral Raise','Shoulders','Dumbbell','Hypertrophy',true),
  (null,'Face Pull','Shoulders','Cable','Hypertrophy',true),
  (null,'Barbell Curl','Biceps','Barbell','Hypertrophy',true),
  (null,'Incline DB Curl','Biceps','Dumbbell','Hypertrophy',true),
  (null,'Tricep Pushdown','Triceps','Cable','Hypertrophy',true),
  (null,'Skull Crushers','Triceps','Barbell','Hypertrophy',true),
  (null,'Dip','Triceps','Bodyweight','Strength',true),
  (null,'Plank','Core','Bodyweight','Strength',true),
  (null,'Ab Wheel Rollout','Core','Bodyweight','Strength',true),
  (null,'Hip Thrust','Glutes','Barbell','Hypertrophy',true);
