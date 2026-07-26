# Alte Einzelschritte (nur noch Referenz)

Diese Dateien wurden früher von Hand im Supabase-SQL-Editor ausgeführt,
bevor das Repo auf echte Migrationen (`supabase/migrations/`) umgestellt
wurde. Ihr Inhalt ist vollständig in
[`../migrations/20260726120000_init.sql`](../migrations/20260726120000_init.sql)
enthalten.

**Für ein neues oder leeres Projekt hier nichts ausführen** – das
erledigt die Migration in `supabase/migrations/`.

Relevant sind die Dateien nur noch für ein **bestehendes** Projekt, das
auf einem älteren Stand steht und schrittweise nachgezogen werden soll:

| Datei | Inhalt |
|---|---|
| `002_add_vat_rate.sql` | Spalte `vat_rate` |
| `003_add_jobs.sql` | Tabelle `jobs` + `transactions.job_id` |
| `004_add_job_dates.sql` | `start_date` / `end_date` |
| `005_add_paid.sql` | Spalte `paid` |
| `006_optimize_rls.sql` | schnellere RLS-Policies + Index auf `jobs.user_id` |

Die Reihenfolge ist bindend, und alle Schritte setzen voraus, dass die
Tabelle `public.transactions` bereits existiert.
