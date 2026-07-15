export type Kind = 'einnahme' | 'ausgabe'

export interface Transaction {
  id: string
  user_id: string
  kind: Kind
  amount: number // Bruttobetrag
  category: string
  date: string // ISO YYYY-MM-DD
  note: string | null
  vat_rate: number | null // MwSt-Satz in % (z. B. 19), null = ohne MwSt erfasst
  created_at: string
}

// Für neue/bearbeitete Buchungen (ohne server-seitige Felder)
export interface TransactionInput {
  kind: Kind
  amount: number
  category: string
  date: string
  note: string | null
  vat_rate: number | null
}

export interface Category {
  id: string
  name: string
  kind: Kind
}
