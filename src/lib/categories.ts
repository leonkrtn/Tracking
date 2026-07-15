import type { Kind } from './types'
import type { IconName } from '../components/Icon'

// Standard-Kategorien für eine Kfz-Werkstatt. Eigene Kategorien werden
// zusätzlich in der DB gespeichert.
export const DEFAULT_CATEGORIES: Record<Kind, string[]> = {
  einnahme: [
    'Arbeitslohn',
    'Ersatzteile-Verkauf',
    'Reifen & Räder',
    'TÜV / AU',
    'Inspektion & Wartung',
    'Karosserie & Lack',
    'Sonstiges',
  ],
  ausgabe: [
    'Ersatzteile-Einkauf',
    'Werkzeug & Maschinen',
    'Betriebsstoffe',
    'Miete Werkstatt',
    'Strom / Wasser / Gas',
    'Löhne & Personal',
    'Versicherung',
    'Kfz & Fuhrpark',
    'Marketing',
    'Bürokosten',
    'Sonstiges',
  ],
}

// Kategorie → Icon-Name
const CATEGORY_ICON: Record<string, IconName> = {
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
  Sonstiges: 'package',
}

export function iconFor(category: string): IconName {
  return CATEGORY_ICON[category] ?? 'package'
}

export const VAT_RATES = [0, 19] as const
