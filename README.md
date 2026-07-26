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

Das Schema liegt als Migration in
[`supabase/migrations/`](supabase/migrations/). Wer das Repo in Supabase
verbunden hat, bekommt sie beim Push auf den Produktions-Branch
automatisch angewendet – sonst per Hand:

### Neues / leeres Projekt

1. Supabase → **SQL Editor** → **New query**
2. Inhalt von
   [`supabase/migrations/20260726120000_init.sql`](supabase/migrations/20260726120000_init.sql)
   einfügen → **Run**. Das ist der komplette Stand; in
   `supabase/legacy/` nichts zusätzlich ausführen.
3. **Authentication** → **Sign In / Providers** → **Email** → **„Confirm
   email"** ausschalten → **Save**
4. In der App „Konto anlegen" → Benutzername + Passwort

### Bestehendes Projekt auf den aktuellen Stand bringen

Läuft schon eine ältere Version, ziehen die Einzelschritte in
[`supabase/legacy/`](supabase/legacy/) sie nach – Reihenfolge und
Voraussetzungen stehen dort im README.

### Künftige Schema-Änderungen

Neue Datei in `supabase/migrations/` anlegen (Name:
`YYYYMMDDHHMMSS_beschreibung.sql`), nie die bestehende ändern und nichts
mehr direkt im SQL-Editor „nebenbei" ausführen – sonst laufen Repo und
Datenbank auseinander.

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
