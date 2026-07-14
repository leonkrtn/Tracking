# 💶 Geld-Tracker

Eine einfache Handy-App (PWA), um **Einnahmen und Ausgaben** zu erfassen und
auszuwerten. Gebaut mit React + TypeScript + Vite + Tailwind, Daten in **Supabase**.

## Funktionen

- **Einträge** erfassen, bearbeiten und löschen (Betrag, Typ, Kategorie, Datum, Notiz)
- **Auswertung**: Saldo des Monats, Tortendiagramm (Ausgaben nach Kategorie),
  6-Monats-Verlauf, filterbare Liste
- Monatsweise blättern
- Eigene Kategorien anlegen (zusätzlich zu den Standard-Kategorien)
- **Login mit Benutzername + Passwort** (ein Benutzer genügt)
- **Excel-Export** (`.xlsx`) + JSON-Backup/-Wiederherstellung
- Hell-/Dunkel-Modus (folgt dem Handy-Setting), untere Tab-Leiste, schwebender „＋"
- **PWA**: auf dem Homescreen installierbar

---

## Einrichtung (einmalig, ca. 2 Minuten)

Das Supabase-Projekt **„Tracking"** ist bereits im Code hinterlegt
(`src/lib/supabase.ts`). Es sind nur zwei Schritte im Supabase-Dashboard nötig:

### 1. Datenbank-Tabellen anlegen

1. Supabase öffnen → Projekt **Tracking** → **SQL Editor** → **New query**
2. Den kompletten Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen
3. **Run** klicken

### 2. Passwort-Login ohne E-Mail-Bestätigung erlauben

Da wir mit Benutzername statt echter E-Mail arbeiten, muss die
E-Mail-Bestätigung aus sein:

1. Supabase → **Authentication** → **Sign In / Providers** → **Email**
2. **„Confirm email"** ausschalten → **Save**

> Ohne diesen Schritt kann das Konto zwar angelegt, aber nicht sofort
> eingeloggt werden.

---

## Lokal starten

```bash
npm install
npm run dev
```

Dann im Browser (am besten Handy-Ansicht) öffnen, beim ersten Mal
**„Noch kein Konto? Jetzt anlegen"** → Benutzername + Passwort festlegen. Fertig.

## Build (für Deployment)

```bash
npm run build     # erzeugt den Ordner dist/
npm run preview   # lokale Vorschau des Builds
```

Die App ist eine statische Seite und kann z. B. auf **Vercel** oder
**Netlify** deployt werden (Build-Command `npm run build`, Output `dist`).

### Eigenes Supabase-Projekt verwenden (optional)

Lege eine Datei `.env.local` an:

```
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=dein_publishable_key
```

---

## Auf dem Handy installieren

Nach dem Deployment die Seite im Handy-Browser öffnen →
Teilen-Menü → **„Zum Home-Bildschirm"**. Dann startet sie wie eine echte App.
