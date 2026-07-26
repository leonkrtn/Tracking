const eur = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
})

export function formatEUR(value: number): string {
  return eur.format(value)
}

export function formatEURSigned(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return sign + eur.format(Math.abs(value))
}

const dateFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return dateFmt.format(new Date(y, m - 1, d))
}

const monthFmt = new Intl.DateTimeFormat('de-DE', {
  month: 'long',
  year: 'numeric',
})

// monthKey: "YYYY-MM"
export function formatMonth(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return monthFmt.format(new Date(y, m - 1, 1))
}

const monthShortFmt = new Intl.DateTimeFormat('de-DE', {
  month: 'short',
  year: 'numeric',
})

// Kurzform für schmale Displays: "Jul. 2026" statt "Juli 2026"
export function formatMonthShort(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return monthShortFmt.format(new Date(y, m - 1, 1))
}

export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7)
}

export function currentMonthKey(): string {
  return todayISO().slice(0, 7)
}

// verschiebt einen monthKey um n Monate
export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${yy}-${mm}`
}
