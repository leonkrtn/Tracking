import type { Kind } from './types'
import type { IconName } from '../components/Icon'

// Standard-Kategorien. Eigene Kategorien werden zusätzlich in der DB gespeichert.
export const DEFAULT_CATEGORIES: Record<Kind, string[]> = {
  einnahme: ['Gehalt', 'Bonus', 'Erstattung', 'Zinsen', 'Verkauf', 'Sonstiges'],
  ausgabe: [
    'Lebensmittel',
    'Miete',
    'Wohnen & Nebenkosten',
    'Transport',
    'Freizeit',
    'Restaurant',
    'Gesundheit',
    'Shopping',
    'Abos',
    'Versicherung',
    'Sonstiges',
  ],
}

// Kategorie → Icon-Name
const CATEGORY_ICON: Record<string, IconName> = {
  Gehalt: 'briefcase',
  Bonus: 'gift',
  Erstattung: 'refresh',
  Zinsen: 'trending-up',
  Verkauf: 'tag',
  Lebensmittel: 'cart',
  Miete: 'home',
  'Wohnen & Nebenkosten': 'zap',
  Transport: 'car',
  Freizeit: 'gamepad',
  Restaurant: 'utensils',
  Gesundheit: 'heart',
  Shopping: 'bag',
  Abos: 'repeat',
  Versicherung: 'shield',
  Sonstiges: 'package',
}

export function iconFor(category: string): IconName {
  return CATEGORY_ICON[category] ?? 'package'
}
