import type { Kind } from './types'
import type { IconName } from '../components/Icon'

// Standard-Kategorien – bewusst kurz gehalten, damit die Auswahl beim
// Buchen ein Tipp bleibt. Eigene Kategorien werden zusätzlich in der DB
// gespeichert und erscheinen hinter diesen.
//
// Ältere Buchungen können noch Kategorien aus der früheren, längeren Liste
// tragen (z. B. „Ersatzteile-Einkauf"). Die bleiben in der Datenbank und in
// den Auswertungen unverändert erhalten; nur die Vorauswahl beim Erfassen
// ist neu.
export const DEFAULT_CATEGORIES: Record<Kind, string[]> = {
  einnahme: ['Arbeitszeit', 'Material', 'Sonstiges'],
  ausgabe: ['Arbeitszeit', 'Material', 'Sonstiges'],
}

// Kategorie → Icon-Name. Die Einträge der früheren Liste stehen weiter
// drin, damit alte Buchungen ihr passendes Symbol behalten.
const CATEGORY_ICON: Record<string, IconName> = {
  Arbeitszeit: 'clock',
  Material: 'package',
  Sonstiges: 'file-text',

  // frühere Kategorien
  Arbeitslohn: 'banknote',
  'Ersatzteile-Verkauf': 'tag',
  'Reifen & Räder': 'disc',
  'TÜV / AU': 'clipboard-check',
  'Inspektion & Wartung': 'settings',
  'Karosserie & Lack': 'spray',
  'Ersatzteile-Einkauf': 'cart',
  'Werkzeug & Maschinen': 'wrench',
  Betriebsstoffe: 'droplet',
  'Miete Werkstatt': 'home',
  'Strom / Wasser / Gas': 'zap',
  'Löhne & Personal': 'users',
  Versicherung: 'shield',
  'Kfz & Fuhrpark': 'car',
  Marketing: 'megaphone',
  Bürokosten: 'file-text',
}

export function iconFor(category: string): IconName {
  return CATEGORY_ICON[category] ?? 'tag'
}

export const VAT_RATES = [0, 19] as const
