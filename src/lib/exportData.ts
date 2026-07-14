import * as XLSX from 'xlsx'
import type { Transaction } from './types'
import { formatDate } from './format'

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Exportiert alle Buchungen als Excel-Datei (.xlsx). */
export function exportExcel(transactions: Transaction[]) {
  const rows = transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map((t) => ({
      Datum: formatDate(t.date),
      Typ: t.kind === 'einnahme' ? 'Einnahme' : 'Ausgabe',
      Kategorie: t.category,
      // Ausgaben negativ, damit Summen in Excel direkt stimmen
      'Betrag (€)': t.kind === 'ausgabe' ? -t.amount : t.amount,
      Notiz: t.note ?? '',
    }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 },
    { wch: 11 },
    { wch: 22 },
    { wch: 12 },
    { wch: 30 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Buchungen')

  const stamp = new Date().toISOString().slice(0, 10)
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  download(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Geld-Tracker_${stamp}.xlsx`,
  )
}

/** Vollständiges JSON-Backup (zum Sichern / Wiederherstellen). */
export function exportJSON(transactions: Transaction[]) {
  const payload = {
    app: 'geld-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: transactions.map(({ user_id, ...rest }) => {
      void user_id
      return rest
    }),
  }
  const stamp = new Date().toISOString().slice(0, 10)
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `Geld-Tracker_Backup_${stamp}.json`,
  )
}
