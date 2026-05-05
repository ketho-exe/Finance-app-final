create extension if not exists "pgcrypto";

alter table public.profiles
  add column if not exists onboarding_version int not null default 0,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_skipped_at timestamptz,
  add column if not exists open_banking_intro_completed_at timestamptz,
  add column if not exists open_banking_intro_skipped_at timestamptz;

create table if not exists public.open_banking_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'gocardless',
  institution_id text not null,
  institution_name text,
  requisition_id text,
  agreement_id text,
  status text not null default 'pending',
  consent_expires_at timestamptz,
  last_synced_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.open_banking_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.open_banking_connections(id) on delete cascade,
  provider text not null default 'gocardless',
  external_account_id text not null,
  card_id uuid references public.cards(id) on delete set null,
  display_name text,
  iban_last4 text,
  currency text default 'GBP',
  account_type text,
  owner_name text,
  current_balance numeric(12, 2),
  available_balance numeric(12, 2),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_account_id)
);

alter table public.cards
  add column if not exists source text not null default 'manual',
  add column if not exists external_account_id text,
  add column if not exists open_banking_account_id uuid references public.open_banking_accounts(id) on delete set null,
  add column if not exists last_synced_at timestamptz;

alter table public.transactions
  add column if not exists external_account_id text,
  add column if not exists external_transaction_id text,
  add column if not exists imported_at timestamptz,
  add column if not exists pending boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_open_banking_unique'
  ) then
    alter table public.transactions
      add constraint transactions_open_banking_unique
      unique (user_id, external_account_id, external_transaction_id);
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_open_banking_connections_updated_at on public.open_banking_connections;
create trigger set_open_banking_connections_updated_at
before update on public.open_banking_connections
for each row execute function public.set_updated_at();

drop trigger if exists set_open_banking_accounts_updated_at on public.open_banking_accounts;
create trigger set_open_banking_accounts_updated_at
before update on public.open_banking_accounts
for each row execute function public.set_updated_at();

alter table public.open_banking_connections enable row level security;
alter table public.open_banking_accounts enable row level security;

drop policy if exists "Open banking connections are owned by users" on public.open_banking_connections;
create policy "Open banking connections are owned by users"
on public.open_banking_connections
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Open banking accounts are owned by users" on public.open_banking_accounts;
create policy "Open banking accounts are owned by users"
on public.open_banking_accounts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
