-- ─── BODY MEASUREMENTS ────────────────────────────────────────────────────────
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_date date not null default current_date,
  chest_cm numeric(5,1),
  waist_cm numeric(5,1),
  hips_cm numeric(5,1),
  neck_cm numeric(5,1),
  left_arm_cm numeric(5,1),
  right_arm_cm numeric(5,1),
  left_thigh_cm numeric(5,1),
  right_thigh_cm numeric(5,1),
  left_calf_cm numeric(5,1),
  right_calf_cm numeric(5,1),
  body_fat_pct numeric(4,1),
  notes text,
  created_at timestamptz default now()
);

alter table public.body_measurements enable row level security;

create policy "Users manage own measurements" on public.body_measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists body_measurements_user_date on public.body_measurements(user_id, logged_date);

-- ─── HYDRATION ────────────────────────────────────────────────────────────────
create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_date date not null default current_date,
  amount_ml integer not null default 0,
  source text default 'manual',
  created_at timestamptz default now()
);

alter table public.hydration_logs enable row level security;

create policy "Users manage own hydration" on public.hydration_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists hydration_logs_user_date on public.hydration_logs(user_id, logged_date);

-- ─── SLEEP ───────────────────────────────────────────────────────────────────
create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_date date not null default current_date,
  sleep_start timestamptz,
  sleep_end timestamptz,
  duration_hours numeric(4,2),
  quality integer check (quality between 1 and 5),
  notes text,
  created_at timestamptz default now()
);

alter table public.sleep_logs enable row level security;

create policy "Users manage own sleep" on public.sleep_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists sleep_logs_user_date on public.sleep_logs(user_id, logged_date);
