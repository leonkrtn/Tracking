-- ============================================================
--  Meister-Kasse – Datenbank-Schema
--  Einmalig im Supabase SQL-Editor ausführen:
--  Projekt "Tracking" → SQL Editor → New query → einfügen → Run
--
--  Hinweis: Läuft die App schon (Tabellen existieren bereits)?
--  Dann reichen die kleinen Migrationen in
--  supabase/002_add_vat_rate.sql, supabase/003_add_jobs.sql,
--  supabase/004_add_job_dates.sql und supabase/005_add_paid.sql –
--  dieses Skript hier ist für eine komplette Neuinstallation gedacht.
-- ============================================================

-- ---------- Tabelle: Aufträge ----------
create table if not exists public.jobs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  note       text,
  start_date date not null default current_date,
  end_date   date, -- gesetzt, sobald der Auftrag als beendet markiert wird
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

drop policy if exists "own jobs – all" on public.jobs;
create policy "own jobs – all" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Tabelle: Buchungen ----------
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('einnahme', 'ausgabe')),
  amount     numeric(12, 2) not null check (amount >= 0),
  category   text not null,
  date       date not null default current_date,
  note       text,
  vat_rate   numeric(5, 2), -- MwSt-Satz in % (z. B. 19.00), NULL = ohne MwSt erfasst
  job_id     uuid references public.jobs (id) on delete cascade, -- NULL = eigenständige Buchung
  paid       boolean not null default true, -- false = noch nicht gezahlt (offene Forderung/Verbindlichkeit)
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);
create index if not exists transactions_job_idx
  on public.transactions (job_id);

alter table public.transactions enable row level security;

drop policy if exists "own rows – select" on public.transactions;
create policy "own rows – select" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "own rows – insert" on public.transactions;
create policy "own rows – insert" on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "own rows – update" on public.transactions;
create policy "own rows – update" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows – delete" on public.transactions;
create policy "own rows – delete" on public.transactions
  for delete using (auth.uid() = user_id);

-- ---------- Tabelle: Eigene Kategorien ----------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  kind       text not null check (kind in ('einnahme', 'ausgabe')),
  created_at timestamptz not null default now(),
  unique (user_id, name, kind)
);

alter table public.categories enable row level security;

drop policy if exists "own categories – all" on public.categories;
create policy "own categories – all" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
