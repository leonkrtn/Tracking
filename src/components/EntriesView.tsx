import { useMemo } from 'react'
import type { Transaction } from '../lib/types'
import { formatDate, formatEUR, formatEURSigned, monthKeyOf } from '../lib/format'
import { iconFor } from '../lib/categories'
import MonthNav from './MonthNav'

interface Props {
  transactions: Transaction[]
  month: string
  onMonthChange: (m: string) => void
  onEdit: (t: Transaction) => void
}

export default function EntriesView({
  transactions,
  month,
  onMonthChange,
  onEdit,
}: Props) {
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

  // nach Datum gruppieren (bereits absteigend sortiert aus dem Store)
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
    <div className="space-y-4">
      <MonthNav month={month} onChange={onMonthChange} />

      {/* Saldo-Karte */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-lg dark:from-slate-800 dark:to-black">
        <p className="text-sm text-slate-300">Saldo diesen Monat</p>
        <p
          className={`mt-1 text-4xl font-bold ${
            balance >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {formatEURSigned(balance)}
        </p>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-white/10 px-3 py-2">
            <p className="text-xs text-slate-300">Einnahmen</p>
            <p className="text-base font-semibold text-emerald-400">
              {formatEUR(income)}
            </p>
          </div>
          <div className="flex-1 rounded-xl bg-white/10 px-3 py-2">
            <p className="text-xs text-slate-300">Ausgaben</p>
            <p className="text-base font-semibold text-red-400">
              {formatEUR(expense)}
            </p>
          </div>
        </div>
      </div>

      {/* Liste */}
      {monthTx.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-4xl">🗒️</p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Noch keine Einträge in diesem Monat.
          </p>
          <p className="text-sm text-slate-400">
            Tippe unten auf „＋", um zu starten.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([date, items]) => (
            <div key={date}>
              <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                {formatDate(date)}
              </p>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                {items.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => onEdit(t)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-50 dark:active:bg-slate-700/50 ${
                      i > 0 ? 'border-t border-slate-100 dark:border-slate-700/60' : ''
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg dark:bg-slate-700">
                      {iconFor(t.category)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                        {t.category}
                      </span>
                      {t.note && (
                        <span className="block truncate text-sm text-slate-400">
                          {t.note}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 font-semibold ${
                        t.kind === 'einnahme' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {t.kind === 'einnahme'
                        ? `+${formatEUR(t.amount)}`
                        : `−${formatEUR(t.amount)}`}
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
