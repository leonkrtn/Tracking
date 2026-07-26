# 🔧 Meister-Kasse

Einfache Buchhaltungs-App (PWA) für die **Werkstatt** – Einnahmen und
Ausgaben erfassen und auswerten. Gebaut mit React + TypeScript + Vite +
Tailwind, Daten in **Supabase**.

## Funktionen

- **Buchungen** erfassen, bearbeiten und löschen (Betrag, Typ, Kategorie,
  Datum, Notiz)
- **MwSt**: pro Buchung Netto-Betrag + Satz (0 % / 19 %) eingeben,
  Brutto wird automatisch berechnet
- Kategorien für den Werkstattbetrieb (Arbeitslohn, Ersatzteile, Reifen,
  TÜV/AU, Werkzeug, Miete, Löhne, Versicherung, Kfz/Fuhrpark, …) – eigene
  Kategorien zusätzlich anlegbar
- **Auswertung**: Saldo des Monats, Ausgaben nach Kategorie (Diagramm),
  6-Monats-Verlauf, MwSt-Übersicht (vereinnahmt / gezahlt / Zahllast),
  filterbare Liste
- Monatsweise blättern
- **Login mit Benutzername + Passwort** (ein Benutzer genügt)
- **Export** als Excel (`.xlsx`) oder CSV, jeweils inkl. Netto/MwSt/Brutto
- Helles, cleanes Design, eigenes Icon-Set (keine Emojis)
- **Desktop-Ansicht** mit Seitenleiste + **Handy-Ansicht** mit Bottom-Tabs
- **PWA**: auf dem Homescreen installierbar

---

## Einrichtung (einmalig)

Das Supabase-Projekt **„Tracking"** ist bereits im Code hinterlegt
(`src/lib/supabase.ts`).

### Neues / leeres Projekt

1. Supabase → **SQL Editor** → **New query**
2. Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen → **Run**
   – das ist der komplette aktuelle Stand. Die Dateien `002_*.sql` …
   `006_*.sql` **nicht** zusätzlich ausführen.
3. **Authentication** → **Sign In / Providers** → **Email** → **„Confirm
   email"** ausschalten → **Save**
4. In der App „Konto anlegen" → Benutzername + Passwort

### Bestehendes Projekt auf den aktuellen Stand bringen

Die noch fehlenden Schritte einzeln im SQL Editor ausführen (alle
idempotent, mehrfaches Ausführen schadet nicht):

| Datei | Inhalt |
|---|---|
| [`002_add_vat_rate.sql`](supabase/002_add_vat_rate.sql) | Spalte `vat_rate` |
| [`003_add_jobs.sql`](supabase/003_add_jobs.sql) | Tabelle `jobs` + `transactions.job_id` |
| [`004_add_job_dates.sql`](supabase/004_add_job_dates.sql) | `start_date` / `end_date` |
| [`005_add_paid.sql`](supabase/005_add_paid.sql) | Spalte `paid` |
| [`006_optimize_rls.sql`](supabase/006_optimize_rls.sql) | schnellere RLS-Policies + Index auf `jobs.user_id` |

### Umzug in einen anderen Supabase-Account

Siehe [`supabase/UMZUG.md`](supabase/UMZUG.md) – dort steht, was
`schema.sql` abdeckt und was zusätzlich nötig ist (Benutzer, Auth-
Einstellungen, Daten, Keys).

---

## Lokal starten

```bash
npm install
npm run dev
```

Login: Benutzername + Passwort des angelegten Kontos.

## Build (für Deployment)

```bash
npm run build     # erzeugt den Ordner dist/
npm run preview   # lokale Vorschau des Builds
```

Statische Seite, z. B. auf **Vercel** oder **Netlify** deploybar
(Build-Command `npm run build`, Output `dist`).

### Anderes Supabase-Projekt verwenden

`.env.local` nach dem Muster von [`.env.example`](.env.example) anlegen:

```
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Beim Hoster (Vercel / Netlify) dieselben beiden Variablen setzen und neu
deployen – dann ist für einen Projektwechsel keine Code-Änderung nötig.

---

## Auf dem Handy installieren

Seite im Handy-Browser öffnen → Teilen-Menü → **„Zum Home-Bildschirm"**.
