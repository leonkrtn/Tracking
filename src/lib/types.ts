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
  job_id: string | null // Auftrag, dem diese Buchung zugeordnet ist (optional)
  paid: boolean // false = noch nicht gezahlt (offene Forderung/Verbindlichkeit)
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
  job_id: string | null
  paid: boolean
}

export interface Category {
  id: string
  name: string
  kind: Kind
}

export interface Job {
  id: string
  user_id: string
  name: string
  note: string | null
  start_date: string // ISO YYYY-MM-DD
  end_date: string | null // gesetzt, sobald der Auftrag beendet wurde
  created_at: string
}

export interface JobInput {
  name: string
  note: string | null
}
