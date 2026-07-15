-- ============================================================
--  Migration: MwSt-Satz für bestehende Installationen nachrüsten
--  Einmalig im Supabase SQL-Editor ausführen (nur nötig, wenn die
--  Tabelle "transactions" schon existiert, siehe schema.sql).
-- ============================================================

alter table public.transactions
  add column if not exists vat_rate numeric(5, 2);
