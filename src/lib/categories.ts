import type { Kind } from './types'

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

// Emoji je Kategorie – rein optisch, macht die Liste schneller lesbar.
export const CATEGORY_ICON: Record<string, string> = {
  Gehalt: '💼',
  Bonus: '🎉',
  Erstattung: '↩️',
  Zinsen: '📈',
  Verkauf: '🏷️',
  Lebensmittel: '🛒',
  Miete: '🏠',
  'Wohnen & Nebenkosten': '💡',
  Transport: '🚌',
  Freizeit: '🎮',
  Restaurant: '🍽️',
  Gesundheit: '💊',
  Shopping: '🛍️',
  Abos: '🔁',
  Versicherung: '🛡️',
  Sonstiges: '📦',
}

export function iconFor(category: string): string {
  return CATEGORY_ICON[category] ?? '📦'
}
