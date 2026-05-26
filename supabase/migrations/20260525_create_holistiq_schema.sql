create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_profiles (
  user_id text primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.check_in_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.user_profiles(user_id) on delete cascade,
  entry_date date not null,
  week_key date not null,
  period text not null check (period in ('morning', 'night', 'weekly')),
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uq_user_check_in unique (user_id, entry_date, period)
);

create table if not exists public.reminder_settings (
  user_id text primary key references public.user_profiles(user_id) on delete cascade,
  night_reminder_enabled boolean not null default true,
  night_reminder_hour integer not null default 20 check (night_reminder_hour between 0 and 23),
  family_nudges_enabled boolean not null default true,
  night_reminder_last_sent_date date,
  family_nudge_last_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.privacy_settings (
  user_id text primary key references public.user_profiles(user_id) on delete cascade,
  share_graphs_with_family boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null references public.user_profiles(user_id) on delete cascade,
  invited_user_id text,
  invite_email text,
  name text not null,
  relation text not null default 'Family member',
  status text not null default 'pending' check (status in ('pending', 'active', 'archived')),
  can_view_graphs boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.connected_app_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.user_profiles(user_id) on delete cascade,
  snapshot_date date not null,
  source text not null check (source in ('myfitnesspal', 'wearable', 'medication_tracker', 'environment_journal')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uq_user_snapshot_source unique (user_id, snapshot_date, source)
);

create index if not exists idx_check_in_sessions_user_date
  on public.check_in_sessions (user_id, entry_date);

create index if not exists idx_check_in_sessions_user_week
  on public.check_in_sessions (user_id, week_key);

create index if not exists idx_family_members_owner
  on public.family_members (owner_user_id);

create index if not exists idx_family_members_invited_user
  on public.family_members (invited_user_id);

create index if not exists idx_connected_app_snapshots_user_date
  on public.connected_app_snapshots (user_id, snapshot_date);

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_check_in_sessions_updated_at on public.check_in_sessions;
create trigger set_check_in_sessions_updated_at
before update on public.check_in_sessions
for each row execute procedure public.set_updated_at();

drop trigger if exists set_reminder_settings_updated_at on public.reminder_settings;
create trigger set_reminder_settings_updated_at
before update on public.reminder_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists set_privacy_settings_updated_at on public.privacy_settings;
create trigger set_privacy_settings_updated_at
before update on public.privacy_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists set_family_members_updated_at on public.family_members;
create trigger set_family_members_updated_at
before update on public.family_members
for each row execute procedure public.set_updated_at();

drop trigger if exists set_connected_app_snapshots_updated_at on public.connected_app_snapshots;
create trigger set_connected_app_snapshots_updated_at
before update on public.connected_app_snapshots
for each row execute procedure public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.check_in_sessions enable row level security;
alter table public.reminder_settings enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.family_members enable row level security;
alter table public.connected_app_snapshots enable row level security;

drop policy if exists "users manage own profile" on public.user_profiles;
create policy "users manage own profile"
on public.user_profiles
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

drop policy if exists "users manage own check ins" on public.check_in_sessions;
create policy "users manage own check ins"
on public.check_in_sessions
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

drop policy if exists "users manage own reminder settings" on public.reminder_settings;
create policy "users manage own reminder settings"
on public.reminder_settings
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

drop policy if exists "users manage own privacy settings" on public.privacy_settings;
create policy "users manage own privacy settings"
on public.privacy_settings
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

drop policy if exists "owners manage family members" on public.family_members;
create policy "owners manage family members"
on public.family_members
for all
using (auth.uid()::text = owner_user_id)
with check (auth.uid()::text = owner_user_id);

drop policy if exists "invited users can view linked family rows" on public.family_members;
create policy "invited users can view linked family rows"
on public.family_members
for select
using (auth.uid()::text = invited_user_id);

drop policy if exists "users manage own connected app snapshots" on public.connected_app_snapshots;
create policy "users manage own connected app snapshots"
on public.connected_app_snapshots
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);
