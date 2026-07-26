# Umzug in einen anderen Supabase-Account

Kurzantwort auf die Frage „kann ich einfach die Migrationen nacheinander
ausführen?" → **Nein, nicht nacheinander – es ist genau eine Migration:**
[`migrations/20260726120000_init.sql`](migrations/20260726120000_init.sql).

Die Datei ist der komplette aktuelle Stand (inkl. `vat_rate`, `jobs`,
Start-/Enddatum, `job_id`, `paid`). Die alten Einzelschritte liegen in
[`legacy/`](legacy/) und sind reine Nachrüst-Schritte für ein
**bestehendes** Projekt. Auf einem leeren Projekt würde `002` sogar
fehlschlagen, weil es `public.transactions` ändert – die Tabelle gibt es
zu dem Zeitpunkt noch nicht.

Zweiter wichtiger Punkt: **Ein Datenbank-Schema ist nicht der ganze
Umzug.** Der Login-Benutzer liegt in `auth.users` und wird von der
Migration nicht angelegt. Ohne diesen Schritt startet die App im neuen
Projekt mit leerem Login.

---

## Was mitkommt und was nicht

| | kommt mit |
|---|---|
| Tabellen, Spalten, Indizes, RLS-Policies | ✅ über die Migration |
| Login-Benutzer (`auth.users`) | ❌ neu registrieren |
| Auth-Einstellung „Confirm email" | ❌ neu setzen |
| Buchungen / Aufträge / eigene Kategorien | ❌ manuell (siehe unten) |
| Project-URL + API-Key | ❌ ändern sich, App anpassen |
| Storage-Buckets, Edge Functions | – keine vorhanden |
| Migrations-Historie der Supabase-CLI | – ist auch im alten Projekt leer |

---

## Schritte

1. **Neues Projekt anlegen** im neuen Account.
   Region am besten wieder in der EU (`eu-central-1` oder
   `eu-north-1`). Das DB-Passwort sicher notieren.

2. **Schema anlegen** – zwei Wege:

   * Ist das Repo in Supabase verbunden (Integrations → GitHub), passiert
     das beim Push auf den Produktions-Branch automatisch. Voraussetzung:
     `supabase/config.toml` existiert und die Migration liegt in
     `supabase/migrations/` – beides ist im Repo vorhanden.
   * Oder per Hand: SQL Editor → New query → Inhalt von
     [`migrations/20260726120000_init.sql`](migrations/20260726120000_init.sql)
     einfügen → **Run**. In `legacy/` nichts zusätzlich ausführen.

3. **Authentication → Sign In / Providers → Email**:
   „Confirm email" **ausschalten** → Save.
   Ohne das liefert die Registrierung keine Session und der Login
   funktioniert nicht (die App zeigt dann genau diesen Hinweis an).

4. Optional, aber empfohlen: **Authentication → Passwords** →
   „Leaked password protection" **einschalten** (prüft Passwörter gegen
   HaveIBeenPwned). Im alten Projekt ist das aus.

5. **Project Settings → API**: `Project URL` und den
   `publishable` / `anon` Key kopieren.

6. **App auf das neue Projekt zeigen lassen** – eine der beiden Wege:

   * **Ohne Code-Änderung** (empfohlen): beim Hoster (Vercel / Netlify)
     die Environment-Variablen setzen und neu deployen:

     ```
     VITE_SUPABASE_URL=https://DEIN-NEUES-PROJEKT.supabase.co
     VITE_SUPABASE_ANON_KEY=sb_publishable_...
     ```

     Lokal dasselbe in `.env.local` (Vorlage: `.env.example`).

   * **Oder** die beiden Konstanten in `src/lib/supabase.ts` ändern und
     committen.

7. **Benutzer neu anlegen**: App öffnen → „Noch kein Konto? Jetzt
   anlegen" → **denselben Benutzernamen und dasselbe Passwort** wie
   vorher verwenden. Die App bildet den Benutzernamen intern auf
   `benutzername@geldtracker.de` ab – der Name muss also identisch sein,
   sonst passen später übernommene Daten nicht.

8. **Daten übernehmen** – siehe nächster Abschnitt. Bei sehr wenigen
   Buchungen ist Neu-Eintippen in der App der schnellste Weg.

9. **Prüfen**: Buchung anlegen, Auftrag anlegen, Auswertung, Steuer-Tab,
   Excel-Export.

10. **Altes Projekt erst pausieren/löschen**, wenn alles ein paar Tage
    läuft. Solange es aktiv ist, ist es der Fallback.

---

## Daten übernehmen (nur wenn nötig)

Ein einfacher CSV-Export/Import geht **nicht** sauber: jede Zeile hat
eine `user_id`, die auf `auth.users` des **alten** Projekts zeigt. Im
neuen Projekt gibt es diese UUID nicht → Fremdschlüssel-Fehler, und
selbst mit Trick wären die Zeilen durch RLS unsichtbar.

Der zuverlässige Weg: **`id`-Werte behalten, nur `user_id` ersetzen.**
So bleiben die Verknüpfungen `transactions.job_id → jobs.id` intakt.

**a) Im NEUEN Projekt** die eigene User-ID holen (nach Schritt 7):

```sql
select id, email from auth.users;
```

**b) Im ALTEN Projekt** fertige INSERT-Befehle erzeugen lassen
(`NEUE_USER_ID` unten durch die UUID aus a) ersetzen):

```sql
-- Aufträge
select format(
  'insert into public.jobs (id, user_id, name, note, start_date, end_date, created_at) values (%L, %L, %L, %L, %L, %L, %L);',
  id, 'NEUE_USER_ID', name, note, start_date, end_date, created_at
) from public.jobs order by created_at;

-- Eigene Kategorien
select format(
  'insert into public.categories (id, user_id, name, kind, created_at) values (%L, %L, %L, %L, %L);',
  id, 'NEUE_USER_ID', name, kind, created_at
) from public.categories order by created_at;

-- Buchungen
select format(
  'insert into public.transactions (id, user_id, kind, amount, category, date, note, vat_rate, job_id, paid, created_at) values (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
  id, 'NEUE_USER_ID', kind, amount, category, date, note, vat_rate, job_id, paid, created_at
) from public.transactions order by date;
```

**c)** Ergebnis-Spalte kopieren und **im NEUEN Projekt** ausführen –
Reihenfolge: **Aufträge → Kategorien → Buchungen** (Buchungen
verweisen auf Aufträge).

Der SQL-Editor arbeitet als `postgres`-Rolle und umgeht RLS, die
Inserts gehen also durch.

**d) Gegenprüfen**, dass in beiden Projekten dieselben Zahlen stehen:

```sql
select
  (select count(*) from public.jobs)         as auftraege,
  (select count(*) from public.transactions) as buchungen,
  (select coalesce(sum(amount), 0) from public.transactions
     where kind = 'einnahme')                as einnahmen,
  (select coalesce(sum(amount), 0) from public.transactions
     where kind = 'ausgabe')                 as ausgaben;
```

---

## Nach dem Umzug

* **Login-Bildschirm ist normal.** Die gespeicherte Session hängt am
  Projekt-Ref (`sb-<ref>-auth-token` im localStorage). Neues Projekt =
  neuer Schlüssel = keine alte Session. Nichts kaputt, einfach neu
  anmelden.
* **PWA auf dem Handy**: der Service Worker hat den alten Build noch im
  Cache. Er aktualisiert sich selbst (`registerType: 'autoUpdate'`),
  aber erst beim nächsten Start. App einmal komplett schließen und neu
  öffnen; im Zweifel vom Homescreen löschen und neu hinzufügen.
* **Der alte API-Key bleibt in der Git-Historie und im alten Build.**
  Das ist kein Leck (publishable Key + RLS), aber das alte Projekt ist
  damit erreichbar, solange es läuft. Wenn es endgültig weg soll:
  pausieren oder löschen.

---

## Migrationen sauber führen

Im **alten** Projekt wurde alles per Hand im SQL-Editor ausgeführt.
Supabase kennt dort deshalb **keine** Migrations-Historie
(`supabase_migrations.schema_migrations` ist leer) – es gibt also keine
Prüfung, welcher Stand wo läuft.

Das Repo ist jetzt auf das Layout umgestellt, das die Supabase-CLI und
die GitHub-Integration erwarten:

```
supabase/
  config.toml                        ← macht das Verzeichnis erkennbar
  migrations/
    20260726120000_init.sql          ← Schema, einzige Quelle der Wahrheit
  legacy/                            ← alte Handschritte, nur Referenz
```

**Wichtig:** Die Integration liest ausschließlich
`supabase/migrations/` und nur Dateien mit dem Namensmuster
`YYYYMMDDHHMMSS_beschreibung.sql`. Namen wie `schema.sql` oder
`002_add_vat_rate.sql` werden ignoriert – deshalb der Umbau.

Ab jetzt gilt: **neue Änderung = neue Datei**, bestehende Migrationen
nie nachträglich ändern (sie sind in der Ziel-DB schon verbucht):

```bash
npm i -D supabase
npx supabase link --project-ref <neuer-ref>
npx supabase migration new beschreibung   # erzeugt die Datei
npx supabase db push                      # spielt sie ein
```

Wer die GitHub-Integration nutzt, braucht `db push` nicht – dort reicht
der Push auf den Produktions-Branch. Der Branch muss in Supabase unter
**Integrations → GitHub** eingestellt sein; aktuell ist der
Standard-Branch des Repos `leon/eager-goodall-ootb3b`.
