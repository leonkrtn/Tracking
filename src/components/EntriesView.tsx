import { useMemo } from 'react'
import type { Transaction } from '../lib/types'
import { formatDate, formatEUR, formatEURSigned, monthKeyOf } from '../lib/format'
import { iconFor } from '../lib/categories'
import Icon from './Icon'

interface Props {
  transactions: Transaction[]
  month: string
  onEdit: (t: Transaction) => void
}

export default function EntriesView({ transactions, month, onEdit }: Props) {
  const monthTx = useMemo(
    () => transactions.filter((t) => monthKeyOf(t.date) === month),
    [transactions, month],
  )

  const { income, expense } = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of monthTx) {
      if (t.kind === 'einnahme') income += t.amount
      else expense += t.amount
    }
    return { income, expense }
  }, [monthTx])
  const balance = income - expense

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of monthTx) {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    }
    return Array.from(map.entries())
  }, [monthTx])

  return (
    <div className="space-y-5">
      {/* Stat-Kacheln */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Saldo
          </p>
          <p
            className={`mt-1 text-2xl font-semibold tracking-tight ${
              balance >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatEURSigned(balance)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Einnahmen
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-600">
            {formatEUR(income)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Ausgaben
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-rose-600">
            {formatEUR(expense)}
          </p>
        </div>
      </div>

      {/* Liste */}
      {monthTx.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-5">
          {groups.map(([date, items]) => (
            <div key={date}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                {formatDate(date)}
              </p>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onEdit(t)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        t.kind === 'einnahme'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon name={iconFor(t.category)} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {t.category}
                      </span>
                      {t.note && (
                        <span className="block truncate text-xs text-slate-400">
                          {t.note}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        t.kind === 'einnahme' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {t.kind === 'einnahme' ? '+' : '−'}
                      {formatEUR(t.amount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name="list" size={22} />
      </span>
      <p className="text-sm font-medium text-slate-600">
        Noch keine Buchungen in diesem Monat
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Lege mit „Neue Buchung" los.
      </p>
    </div>
  )
}
