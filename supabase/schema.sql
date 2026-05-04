-- Ledgerly full reset schema.
-- WARNING: This clears the app-owned public tables before recreating them.
-- It does not delete Supabase auth.users or other Supabase-managed internals.

drop table if exists public.report_exports cascade;
drop table if exists public.debt_plans cascade;
drop table if exists public.category_suggestions cascade;
drop table if exists public.credit_statement_cycles cascade;
drop table if exists public.balance_snapshots cascade;
drop table if exists public.loan_payments cascade;
drop table if exists public.loan_ledgers cascade;
drop table if exists public.bank_reconciliations cascade;
drop table if exists public.bank_import_rows cascade;
drop table if exists public.bank_import_batches cascade;
drop table if exists public.account_ledger_rows cascade;
drop table if exists public.ledger_categories cascade;
drop table if exists public.accounting_periods cascade;
drop table if exists public.finance_years cascade;
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
  apr numeric(7, 4),
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
  category text not null default 'Shopping',
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
  income_card_id uuid references public.cards(id) on delete set null,
  gross_annual numeric(12, 2) not null default 52000,
  pension_percent numeric(5, 2) not null default 5,
  pension_tax_timing text not null default 'before-tax' check (pension_tax_timing in ('before-tax', 'after-tax')),
  student_loan_plan text not null default 'plan2' check (student_loan_plan in ('none', 'plan1', 'plan2', 'plan5')),
  payday_day int not null default 25 check (payday_day between 1 and 31),
  updated_at timestamptz not null default now()
);

create table public.finance_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, label)
);

create table public.accounting_periods (
  id uuid primary key default gen_random_uuid(),
  finance_year_id uuid not null references public.finance_years(id) on delete cascade,
  period_index int not null check (period_index between 1 and 20),
  label text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  unique (finance_year_id, period_index)
);

create table public.ledger_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  finance_year_id uuid references public.finance_years(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  colour text not null default '#2457c5',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.account_ledger_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  finance_year_id uuid not null references public.finance_years(id) on delete cascade,
  account_id uuid not null references public.cards(id) on delete cascade,
  supplier text,
  external_ref text,
  description text,
  period_index int check (period_index between 1 and 20),
  transaction_date date,
  gross_amount numeric(12, 2) not null default 0,
  vat_amount numeric(12, 2) not null default 0,
  net_amount numeric(12, 2) generated always as (gross_amount - vat_amount) stored,
  category text not null default 'Uncategorised',
  notes text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create view public.ledger_category_totals as
select
  user_id,
  finance_year_id,
  account_id,
  period_index,
  category,
  sum(net_amount) as total
from public.account_ledger_rows
group by user_id, finance_year_id, account_id, period_index, category;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  card_id uuid references public.cards(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  category text not null default 'Bills',
  name text not null,
  amount numeric(12, 2) not null,
  renewal_day int not null check (renewal_day between 1 and 31),
  warning_days int not null default 7,
  repeat_pattern text not null default 'monthly' check (repeat_pattern in ('weekly', 'monthly', 'four-weekly', 'custom')),
  start_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  category_id uuid references public.categories(id) on delete cascade,
  card_id uuid references public.cards(id) on delete set null,
  category text not null default 'Shopping',
  monthly_limit numeric(12, 2) not null,
  commitment_type text not null default 'flexible' check (commitment_type in ('flexible', 'bill', 'reserve')),
  due_day int check (due_day between 1 and 31),
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

create table public.bank_import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.cards(id) on delete set null,
  source_name text not null,
  file_name text,
  imported_at timestamptz not null default now(),
  row_count int not null default 0,
  status text not null default 'staged' check (status in ('staged', 'imported', 'reconciled', 'discarded'))
);

create table public.bank_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.bank_import_batches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date,
  transaction_type text,
  description text,
  value numeric(12, 2) not null default 0,
  balance numeric(12, 2),
  account_name text,
  account_number text,
  fingerprint text not null,
  matched_transaction_id uuid references public.transactions(id) on delete set null,
  ignored boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, fingerprint)
);

create table public.bank_reconciliations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.cards(id) on delete cascade,
  reconciliation_date date not null,
  bank_balance numeric(12, 2) not null,
  money_in_after_date numeric(12, 2) not null default 0,
  money_out_after_date numeric(12, 2) not null default 0,
  expected_balance numeric(12, 2) not null,
  buffer_amount numeric(12, 2) not null default 500,
  difference numeric(12, 2) not null,
  status text not null default 'open' check (status in ('open', 'matched', 'needs_review')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.loan_ledgers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  lender_name text,
  original_amount numeric(12, 2) not null,
  current_balance numeric(12, 2) not null,
  monthly_payment numeric(12, 2),
  notes text,
  created_at timestamptz not null default now()
);

create table public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loan_ledgers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_date date not null,
  amount numeric(12, 2) not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('cash', 'bank', 'savings', 'investment', 'loan', 'hire_purchase', 'credit_card', 'asset', 'liability')),
  balance numeric(12, 2) not null,
  snapshot_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.credit_statement_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.cards(id) on delete cascade,
  statement_start date not null,
  statement_end date not null,
  statement_balance numeric(12, 2) not null,
  paid_amount numeric(12, 2) not null default 0,
  due_date date,
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
alter table public.finance_years enable row level security;
alter table public.accounting_periods enable row level security;
alter table public.ledger_categories enable row level security;
alter table public.account_ledger_rows enable row level security;
alter table public.subscriptions enable row level security;
alter table public.budgets enable row level security;
alter table public.csv_templates enable row level security;
alter table public.bank_import_batches enable row level security;
alter table public.bank_import_rows enable row level security;
alter table public.bank_reconciliations enable row level security;
alter table public.loan_ledgers enable row level security;
alter table public.loan_payments enable row level security;
alter table public.balance_snapshots enable row level security;
alter table public.credit_statement_cycles enable row level security;
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

create policy "Finance years are owned by users" on public.finance_years
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Accounting periods follow finance year ownership" on public.accounting_periods
  for all using (
    exists (select 1 from public.finance_years fy where fy.id = finance_year_id and fy.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.finance_years fy where fy.id = finance_year_id and fy.user_id = auth.uid())
  );

create policy "Ledger categories are owned by users" on public.ledger_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Ledger rows are owned by users" on public.account_ledger_rows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Subscriptions are owned by users" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Budgets are owned by users" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "CSV templates are user scoped" on public.csv_templates
  for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id);

create policy "Bank import batches are owned by users" on public.bank_import_batches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Bank import rows are owned by users" on public.bank_import_rows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Bank reconciliations are owned by users" on public.bank_reconciliations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Loan ledgers are owned by users" on public.loan_ledgers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Loan payments are owned by users" on public.loan_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Balance snapshots are owned by users" on public.balance_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Credit statement cycles are owned by users" on public.credit_statement_cycles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Category suggestions are owned by users" on public.category_suggestions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Debt plans are owned by users" on public.debt_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Report exports are owned by users" on public.report_exports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
