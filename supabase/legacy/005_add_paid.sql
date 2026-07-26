-- ============================================================
--  Migration: Bezahlt-Status für Buchungen
--  Einmalig im Supabase SQL-Editor ausführen.
-- ============================================================

alter table public.transactions
  add column if not exists paid boolean not null default true;
