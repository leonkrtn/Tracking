import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import type { Transaction } from '../lib/types'
import {
  formatEUR,
  formatMonth,
  monthKeyOf,
  shiftMonth,
} from '../lib/format'
import { iconFor } from '../lib/categories'
import MonthNav from './MonthNav'

const PIE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
  '#64748b',
]

interface Props {
  transactions: Transaction[]
  month: string
  onMonthChange: (m: string) => void
}

export default function ReportsView({ transactions, month, onMonthChange }: Props) {
  const [filterCat, setFilterCat] = useState<string | null>(null)

  const monthTx = useMemo(
    () => transactions.filter((t) => monthKeyOf(t.date) === month),
    [transactions, month],
  )

  // Ausgaben nach Kategorie (Tortendiagramm)
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of monthTx) {
      if (t.kind !== 'ausgabe') continue
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [monthTx])

  const totalExpense = byCategory.reduce((s, c) => s + c.value, 0)

  // Verlauf: letzte 6 Monate (Balken Einnahmen/Ausgaben)
  const trend = useMemo(() => {
    const out: { label: string; einnahme: number; ausgabe: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const mk = shiftMonth(month, -i)
      let einnahme = 0
      let ausgabe = 0
      for (const t of transactions) {
        if (monthKeyOf(t.date) !== mk) continue
        if (t.kind === 'einnahme') einnahme += t.amount
        else ausgabe += t.amount
      }
      out.push({ label: formatMonth(mk).slice(0, 3), einnahme, ausgabe })
    }
    return out
  }, [transactions, month])

  // gefilterte Einträge (nach Kategorie) für die Liste unten
  const filtered = useMemo(() => {
    if (!filterCat) return monthTx
    return monthTx.filter((t) => t.category === filterCat)
  }, [monthTx, filterCat])

  const allCats = useMemo(
    () => Array.from(new Set(monthTx.map((t) => t.category))),
    [monthTx],
  )

  return (
    <div className="space-y-5">
      <MonthNav month={month} onChange={onMonthChange} />

      {monthTx.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="text-4xl">📊</p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Keine Daten für diesen Monat.
          </p>
        </div>
      ) : (
        <>
          {/* Tortendiagramm Ausgaben */}
          <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Ausgaben nach Kategorie
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              Gesamt: {formatEUR(totalExpense)}
            </p>
            {byCategory.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Keine Ausgaben in diesem Monat.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {byCategory.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => formatEUR(v)}
                        contentStyle={{
                          borderRadius: 12,
                          border: 'none',
                          fontSize: 13,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full space-y-1.5">
                  {byCategory.map((c, i) => (
                    <li key={c.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="flex-1 truncate text-slate-700 dark:text-slate-200">
                        {iconFor(c.name)} {c.name}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {formatEUR(c.value)}
                      </span>
                      <span className="w-10 text-right text-xs text-slate-400">
                        {totalExpense > 0
                          ? Math.round((c.value / totalExpense) * 100)
                          : 0}
                        %
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Verlauf */}
          <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Verlauf (6 Monate)
            </h2>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} barGap={2}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    formatter={(v: number) => formatEUR(v)}
                    cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="einnahme" name="Einnahmen" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ausgabe" name="Ausgaben" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Filterbare Einträge */}
          <section>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCat(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  !filterCat
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Alle
              </button>
              {allCats.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    filterCat === c
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {iconFor(c)} {c}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
              {filtered.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 px-4 py-2.5 ${
                    i > 0 ? 'border-t border-slate-100 dark:border-slate-700/60' : ''
                  }`}
                >
                  <span className="text-lg">{iconFor(t.category)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-700 dark:text-slate-200">
                      {t.category}
                    </span>
                    {t.note && (
                      <span className="block truncate text-xs text-slate-400">
                        {t.note}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      t.kind === 'einnahme' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {t.kind === 'einnahme' ? '+' : '−'}
                    {formatEUR(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
