import * as XLSX from 'xlsx'
import type { Kind, Transaction } from './types'
import { formatDate } from './format'
import { nettoFromBrutto, vatAmount } from './vat'

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

interface Row {
  Datum: string
  Typ: string
  Kategorie: string
  Netto: number
  MwStSatz: string
  MwSt: number
  Brutto: number
  Notiz: string
}

function typLabel(kind: Kind): string {
  return kind === 'einnahme' ? 'Einnahme' : 'Ausgabe'
}

function buildRows(transactions: Transaction[]): Row[] {
  return transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map((t) => {
      const sign = t.kind === 'ausgabe' ? -1 : 1
      const rate = t.vat_rate ?? 0
      return {
        Datum: formatDate(t.date),
        Typ: typLabel(t.kind),
        Kategorie: t.category,
        Netto: sign * nettoFromBrutto(t.amount, rate),
        MwStSatz: `${rate}%`,
        MwSt: sign * vatAmount(t.amount, rate),
        Brutto: sign * t.amount,
        Notiz: t.note ?? '',
      }
    })
}

/** Exportiert alle Buchungen als Excel-Datei (.xlsx). */
export function exportExcel(transactions: Transaction[]) {
  const rows = buildRows(transactions).map((r) => ({
    Datum: r.Datum,
    Typ: r.Typ,
    Kategorie: r.Kategorie,
    'Netto (€)': r.Netto,
    'MwSt-Satz': r.MwStSatz,
    'MwSt (€)': r.MwSt,
    'Brutto (€)': r.Brutto,
    Notiz: r.Notiz,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 }, { wch: 11 }, { wch: 24 }, { wch: 12 },
    { wch: 10 }, { wch: 11 }, { wch: 12 }, { wch: 30 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Buchungen')

  const stamp = new Date().toISOString().slice(0, 10)
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  download(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Meister-Kasse_${stamp}.xlsx`,
  )
}

/** Exportiert alle Buchungen als CSV-Datei (Semikolon-getrennt, für Excel/DE). */
export function exportCSV(transactions: Transaction[]) {
  const rows = buildRows(transactions)
  const headers = [
    'Datum', 'Typ', 'Kategorie', 'Netto (€)', 'MwSt-Satz', 'MwSt (€)', 'Brutto (€)', 'Notiz',
  ]
  const numFmt = (n: number) => n.toFixed(2).replace('.', ',')
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

  const lines = [
    headers.join(';'),
    ...rows.map((r) =>
      [
        esc(r.Datum),
        esc(r.Typ),
        esc(r.Kategorie),
        numFmt(r.Netto),
        esc(r.MwStSatz),
        numFmt(r.MwSt),
        numFmt(r.Brutto),
        esc(r.Notiz),
      ].join(';'),
    ),
  ]

  const stamp = new Date().toISOString().slice(0, 10)
  download(
    // BOM voranstellen, damit Umlaute in Excel korrekt dargestellt werden
    new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }),
    `Meister-Kasse_${stamp}.csv`,
  )
}
