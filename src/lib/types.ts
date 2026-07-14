export type Kind = 'einnahme' | 'ausgabe'

export interface Transaction {
  id: string
  user_id: string
  kind: Kind
  amount: number
  category: string
  date: string // ISO YYYY-MM-DD
  note: string | null
  created_at: string
}

// Für neue/bearbeitete Buchungen (ohne server-seitige Felder)
export interface TransactionInput {
  kind: Kind
  amount: number
  category: string
  date: string
  note: string | null
}

export interface Category {
  id: string
  name: string
  kind: Kind
}
