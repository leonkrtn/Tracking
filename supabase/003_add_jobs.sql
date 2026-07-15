-- ============================================================
--  Migration: Aufträge (Jobs) hinzufügen
--  Einmalig im Supabase SQL-Editor ausführen.
-- ============================================================

create table if not exists public.jobs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

drop policy if exists "own jobs – all" on public.jobs;
create policy "own jobs – all" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.transactions
  add column if not exists job_id uuid references public.jobs (id) on delete cascade;

create index if not exists transactions_job_idx on public.transactions (job_id);
