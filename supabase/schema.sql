-- Ledgerly full reset schema.
-- WARNING: This clears the app-owned public tables before recreating them.
-- It does not delete Supabase auth.users or other Supabase-managed internals.

drop table if exists public.report_exports cascade;
drop table if exists public.debt_plans cascade;
drop table if exists public.category_suggestions cascade;
drop table if exists public.csv_templates cascade;
drop table if exists public.household_members cascade;
drop table if exists public.households cascade;
drop table if exists public.budgets cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.salary_settings cascade;
drop table if exists public.wishlist_items cascade;
drop table if exists public.pots cascade;
drop table if exists public.transactions cascade;
drop table if exists public.categories cascade;
drop table if exists public.cards cascade;
drop table if exists public.profiles cascade;

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'GBP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My household',
  created_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'Viewer' check (role in ('Owner', 'Partner', 'Viewer')),
  monthly_contribution numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  name text not null,
  provider text not null,
  type text not null check (type in ('current', 'credit', 'savings')),
  balance numeric(12, 2) not null default 0,
  credit_limit numeric(12, 2),
  overdraft_limit numeric(12, 2),
  colour text not null default '#0f766e',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  colour text not null default '#2457c5',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  card_id uuid references public.cards(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  transaction_date date not null,
  merchant text not null,
  amount numeric(12, 2) not null,
  notes text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table public.pots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  name text not null,
  kind text not null check (kind in ('saving', 'goal')),
  current_amount numeric(12, 2) not null default 0,
  target_amount numeric(12, 2) not null,
  monthly_contribution numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  name text not null,
  price numeric(12, 2) not null,
  saved_amount numeric(12, 2) not null default 0,
  priority text not null check (priority in ('High', 'Medium', 'Low')),
  created_at timestamptz not null default now()
);

create table public.salary_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gross_annual numeric(12, 2) not null default 52000,
  pension_percent numeric(5, 2) not null default 5,
  student_loan_plan text not null default 'plan2' check (student_loan_plan in ('none', 'plan1', 'plan2', 'plan5')),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  card_id uuid references public.cards(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  amount numeric(12, 2) not null,
  renewal_day int not null check (renewal_day between 1 and 31),
  warning_days int not null default 7,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  category_id uuid references public.categories(id) on delete cascade,
  monthly_limit numeric(12, 2) not null,
  month_start date not null default date_trunc('month', now())::date,
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month_start)
);

create table public.csv_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  bank_name text not null,
  columns jsonb not null,
  mapping jsonb not null,
  created_at timestamptz not null default now()
);

create table public.category_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete cascade,
  merchant text not null,
  suggested_category text not null,
  confidence numeric(5, 4) not null,
  reason text,
  accepted boolean,
  created_at timestamptz not null default now()
);

create table public.debt_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid references public.cards(id) on delete cascade,
  monthly_payment numeric(12, 2) not null,
  apr numeric(7, 4) not null,
  months_to_payoff int,
  total_interest numeric(12, 2),
  created_at timestamptz not null default now()
);

create table public.report_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_month date not null,
  format text not null default 'pdf',
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.cards enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.pots enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.salary_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.budgets enable row level security;
alter table public.csv_templates enable row level security;
alter table public.category_suggestions enable row level security;
alter table public.debt_plans enable row level security;
alter table public.report_exports enable row level security;

create policy "Profiles are owned by users" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Households are owned by users" on public.households
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Household members follow owner access" on public.household_members
  for all using (
    exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid())
    or user_id = auth.uid()
  ) with check (
    exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid())
    or user_id = auth.uid()
  );

create policy "Cards are owned by users" on public.cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Categories are owned by users" on public.categories
  for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id);

create policy "Transactions are owned by users" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Pots are owned by users" on public.pots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Wishlist items are owned by users" on public.wishlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Salary settings are owned by users" on public.salary_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Subscriptions are owned by users" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Budgets are owned by users" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "CSV templates are user scoped" on public.csv_templates
  for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id);

create policy "Category suggestions are owned by users" on public.category_suggestions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Debt plans are owned by users" on public.debt_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Report exports are owned by users" on public.report_exports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
