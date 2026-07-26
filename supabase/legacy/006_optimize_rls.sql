-- ============================================================
--  Migration: RLS-Policies beschleunigen + fehlenden Index ergänzen
--
--  Nur für ein BESTEHENDES Projekt nötig, in dem schon eine ältere
--  Version des Schemas läuft. Bei einem neuen/leeren Projekt ist
--  alles davon bereits in supabase/schema.sql enthalten.
--
--  Hintergrund (Supabase Performance Advisor):
--  1) auth_rls_initplan – `auth.uid()` wurde in den Policies für JEDE
--     Zeile neu ausgewertet. In `(select auth.uid())` gepackt wertet
--     Postgres den Wert einmal pro Abfrage aus.
--  2) unindexed_foreign_keys – jobs.user_id hatte keinen Index.
--
--  Fachlich ändert sich nichts: Es sieht weiterhin jeder nur seine
--  eigenen Zeilen.
-- ============================================================

-- ---------- 1) Fehlenden Index auf jobs.user_id ----------
create index if not exists jobs_user_created_idx
  on public.jobs (user_id, created_at desc);

-- ---------- 2) Policies neu setzen ----------
drop policy if exists "own jobs – all" on public.jobs;
create policy "own jobs – all" on public.jobs
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own rows – select" on public.transactions;
create policy "own rows – select" on public.transactions
  for select using ((select auth.uid()) = user_id);

drop policy if exists "own rows – insert" on public.transactions;
create policy "own rows – insert" on public.transactions
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "own rows – update" on public.transactions;
create policy "own rows – update" on public.transactions
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own rows – delete" on public.transactions;
create policy "own rows – delete" on public.transactions
  for delete using ((select auth.uid()) = user_id);

drop policy if exists "own categories – all" on public.categories;
create policy "own categories – all" on public.categories
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
