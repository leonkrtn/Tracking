# 🔧 Meister-Kasse

Einfache Buchhaltungs-App (PWA) für die **Werkstatt** – Einnahmen und
Ausgaben erfassen und auswerten. Gebaut mit React + TypeScript + Vite +
Tailwind, Daten in **Supabase**.

## Funktionen

- **Buchungen** erfassen, bearbeiten und löschen (Betrag, Typ, Kategorie,
  Datum, Notiz)
- **MwSt togglebar**: pro Buchung Netto-Betrag + Satz (19 % / 7 % / 0 %)
  eingeben, Brutto wird automatisch berechnet
- Kategorien für den Werkstattbetrieb (Arbeitslohn, Ersatzteile, Reifen,
  TÜV/AU, Werkzeug, Miete, Löhne, Versicherung, Kfz/Fuhrpark, …) – eigene
  Kategorien zusätzlich anlegbar
- **Auswertung**: Saldo des Monats, Ausgaben nach Kategorie (Diagramm),
  6-Monats-Verlauf, MwSt-Übersicht (vereinnahmt / gezahlt / Zahllast),
  filterbare Liste
- Monatsweise blättern
- **Login mit Benutzername + Passwort** (ein Benutzer genügt)
- **Excel-Export** (`.xlsx`, inkl. Netto/MwSt/Brutto) + JSON-Backup/-Wiederherstellung
- Helles, cleanes Design, eigenes Icon-Set (keine Emojis)
- **Desktop-Ansicht** mit Seitenleiste + **Handy-Ansicht** mit Bottom-Tabs
- **PWA**: auf dem Homescreen installierbar

---

## Einrichtung (einmalig)

Das Supabase-Projekt **„Tracking"** ist bereits im Code hinterlegt
(`src/lib/supabase.ts`).

### Neuinstallation (Tabellen existieren noch nicht)

1. Supabase → Projekt **Tracking** → **SQL Editor** → **New query**
2. Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen → **Run**
3. **Authentication** → **Sign In / Providers** → **Email** → **„Confirm
   email"** ausschalten → **Save**

### Bestehende Installation (Tabellen sind schon da)

Nur die MwSt-Spalte nachrüsten – im SQL Editor:

```sql
alter table public.transactions
  add column if not exists vat_rate numeric(5, 2);
```

(steht auch in [`supabase/002_add_vat_rate.sql`](supabase/002_add_vat_rate.sql))

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

### Eigenes Supabase-Projekt verwenden (optional)

`.env.local` anlegen:

```
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=dein_publishable_key
```

---

## Auf dem Handy installieren

Seite im Handy-Browser öffnen → Teilen-Menü → **„Zum Home-Bildschirm"**.
