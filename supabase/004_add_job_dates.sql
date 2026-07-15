-- ============================================================
--  Migration: Start-/Enddatum für Aufträge
--  Einmalig im Supabase SQL-Editor ausführen.
-- ============================================================

alter table public.jobs
  add column if not exists start_date date not null default current_date,
  add column if not exists end_date date;
