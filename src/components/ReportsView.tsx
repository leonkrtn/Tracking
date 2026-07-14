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
import { formatEUR, formatMonth, monthKeyOf, shiftMonth } from '../lib/format'
import { iconFor } from '../lib/categories'
import Icon from './Icon'

// Ruhige, abgestufte Palette (kein Neon)
const PIE_COLORS = [
  '#0f172a', '#334155', '#475569', '#64748b', '#94a3b8',
  '#0d9488', '#0891b2', '#4f46e5', '#7c3aed', '#be123c',
  '#b45309',
]

interface Props {
  transactions: Transaction[]
  month: string
}

export default function ReportsView({ transactions, month }: Props) {
  const [filterCat, setFilterCat] = useState<string | null>(null)

  const monthTx = useMemo(
    () => transactions.filter((t) => monthKeyOf(t.date) === month),
    [transactions, month],
  )

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

  const filtered = useMemo(() => {
    if (!filterCat) return monthTx
    return monthTx.filter((t) => t.category === filterCat)
  }, [monthTx, filterCat])

  const allCats = useMemo(
    () => Array.from(new Set(monthTx.map((t) => t.category))),
    [monthTx],
  )

  if (monthTx.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon name="chart" size={22} />
        </span>
        <p className="text-sm font-medium text-slate-600">
          Keine Daten für diesen Monat
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Tortendiagramm */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Ausgaben nach Kategorie
            </h2>
            <span className="text-sm font-medium text-slate-500">
              {formatEUR(totalExpense)}
            </span>
          </div>
          {byCategory.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              Keine Ausgaben in diesem Monat.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={44}
                      outerRadius={78}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {byCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatEUR(v)}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-2">
                {byCategory.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2.5 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="flex-1 truncate text-slate-700">{c.name}</span>
                    <span className="font-medium tabular-nums text-slate-800">
                      {formatEUR(c.value)}
                    </span>
                    <span className="w-9 text-right text-xs tabular-nums text-slate-400">
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
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
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
                  cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: 13,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                />
                <Bar dataKey="einnahme" name="Einnahmen" fill="#059669" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ausgabe" name="Ausgaben" fill="#e11d48" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Einnahmen
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> Ausgaben
            </span>
          </div>
        </section>
      </div>

      {/* Filterbare Liste */}
      <section>
        <div className="mb-3 flex flex-wrap gap-2">
          <FilterChip
            active={!filterCat}
            onClick={() => setFilterCat(null)}
            label="Alle"
          />
          {allCats.map((c) => (
            <FilterChip
              key={c}
              active={filterCat === c}
              onClick={() => setFilterCat(c)}
              label={c}
              icon={c}
            />
          ))}
        </div>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon name={iconFor(t.category)} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-slate-700">
                  {t.category}
                </span>
                {t.note && (
                  <span className="block truncate text-xs text-slate-400">
                    {t.note}
                  </span>
                )}
              </span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  t.kind === 'einnahme' ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {t.kind === 'einnahme' ? '+' : '−'}
                {formatEUR(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon && <Icon name={iconFor(icon)} size={14} />}
      {label}
    </button>
  )
}
