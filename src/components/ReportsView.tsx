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
import type { Job, Transaction } from '../lib/types'
import { formatDate, formatEUR, formatEURSigned, formatMonth, monthKeyOf, shiftMonth } from '../lib/format'
import { iconFor } from '../lib/categories'
import { vatAmount } from '../lib/vat'
import Icon from './Icon'

// Ruhige, abgestufte Palette (kein Neon)
const PIE_COLORS = [
  '#0f172a', '#334155', '#475569', '#64748b', '#94a3b8',
  '#0d9488', '#0891b2', '#4f46e5', '#7c3aed', '#be123c',
  '#b45309',
]

interface Props {
  transactions: Transaction[]
  jobs: Job[]
  month: string
}

export default function ReportsView({ transactions, jobs, month }: Props) {
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

  const money = useMemo(() => {
    let income = 0
    let expense = 0
    let cashIn = 0
    let cashOut = 0
    for (const t of monthTx) {
      if (t.kind === 'einnahme') {
        income += t.amount
        if (t.paid) cashIn += t.amount
      } else {
        expense += t.amount
        if (t.paid) cashOut += t.amount
      }
    }
    return {
      income,
      expense,
      profit: income - expense,
      cashflow: cashIn - cashOut,
    }
  }, [monthTx])

  // Offene Posten – über alle Zeit, nicht nur den gewählten Monat
  const jobsById = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs])
  const openForderungen = useMemo(
    () =>
      transactions
        .filter((t) => t.kind === 'einnahme' && !t.paid)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions],
  )
  const openVerbindlichkeiten = useMemo(
    () =>
      transactions
        .filter((t) => t.kind === 'ausgabe' && !t.paid)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions],
  )
  const sumForderungen = openForderungen.reduce((s, t) => s + t.amount, 0)
  const sumVerbindlichkeiten = openVerbindlichkeiten.reduce((s, t) => s + t.amount, 0)

  // Vormonatsvergleich
  const prevMonthKey = shiftMonth(month, -1)
  const compare = useMemo(() => {
    let prevIncome = 0
    let prevExpense = 0
    for (const t of transactions) {
      if (monthKeyOf(t.date) !== prevMonthKey) continue
      if (t.kind === 'einnahme') prevIncome += t.amount
      else prevExpense += t.amount
    }
    const prevProfit = prevIncome - prevExpense
    const pct = (cur: number, prev: number): number | null => {
      if (prev === 0) return null
      return ((cur - prev) / Math.abs(prev)) * 100
    }
    return {
      hasPrevData: prevIncome > 0 || prevExpense > 0,
      incomeDelta: pct(money.income, prevIncome),
      expenseDelta: pct(money.expense, prevExpense),
      profitDelta: pct(money.profit, prevProfit),
    }
  }, [transactions, prevMonthKey, money.income, money.expense, money.profit])

  // Auftrags-Kennzahlen (über alle Zeit, nicht nur den gewählten Monat)
  const jobStats = useMemo(() => {
    const byJob = new Map<string, { income: number; expense: number }>()
    for (const t of transactions) {
      if (!t.job_id) continue
      const entry = byJob.get(t.job_id) ?? { income: 0, expense: 0 }
      if (t.kind === 'einnahme') entry.income += t.amount
      else entry.expense += t.amount
      byJob.set(t.job_id, entry)
    }

    const ranking = jobs
      .map((j) => {
        const v = byJob.get(j.id) ?? { income: 0, expense: 0 }
        return { job: j, income: v.income, profit: v.income - v.expense }
      })
      .filter((r) => r.income > 0 || r.profit !== 0)
      .sort((a, b) => b.profit - a.profit)

    const finished = jobs.filter((j) => j.end_date)
    let finishedIncome = 0
    let finishedProfit = 0
    let totalDays = 0
    let daysCount = 0
    for (const j of finished) {
      const v = byJob.get(j.id) ?? { income: 0, expense: 0 }
      finishedIncome += v.income
      finishedProfit += v.income - v.expense
      const days = Math.round(
        (new Date(j.end_date!).getTime() - new Date(j.start_date).getTime()) /
          (1000 * 60 * 60 * 24),
      )
      if (days >= 0) {
        totalDays += days
        daysCount++
      }
    }

    return {
      ranking,
      avgValue: finished.length > 0 ? finishedIncome / finished.length : null,
      avgMargin: finishedIncome > 0 ? (finishedProfit / finishedIncome) * 100 : null,
      avgDuration: daysCount > 0 ? totalDays / daysCount : null,
      finishedCount: finished.length,
    }
  }, [transactions, jobs])


  // Aufträge nach MwSt-Satz ihrer Einnahmen (über alle Zeit)
  const jobsByRate = useMemo(() => {
    const sums = new Map<string, { rate19: number; rate0: number }>()
    for (const t of transactions) {
      if (!t.job_id || t.kind !== 'einnahme') continue
      const entry = sums.get(t.job_id) ?? { rate19: 0, rate0: 0 }
      if ((t.vat_rate ?? 0) >= 19) entry.rate19 += t.amount
      else entry.rate0 += t.amount
      sums.set(t.job_id, entry)
    }
    const rate19: { job: Job; amount: number }[] = []
    const rate0: { job: Job; amount: number }[] = []
    for (const j of jobs) {
      const s = sums.get(j.id)
      if (!s) continue
      if (s.rate19 > 0) rate19.push({ job: j, amount: s.rate19 })
      if (s.rate0 > 0) rate0.push({ job: j, amount: s.rate0 })
    }
    rate19.sort((a, b) => b.amount - a.amount)
    rate0.sort((a, b) => b.amount - a.amount)
    return { rate19, rate0 }
  }, [transactions, jobs])

  const vat = useMemo(() => {
    let vereinnahmt = 0
    let gezahlt = 0
    for (const t of monthTx) {
      if (t.vat_rate == null) continue
      const v = vatAmount(t.amount, t.vat_rate)
      if (t.kind === 'einnahme') vereinnahmt += v
      else gezahlt += v
    }
    return { vereinnahmt, gezahlt, zahllast: vereinnahmt - gezahlt }
  }, [monthTx])
  const hasVat = vat.vereinnahmt > 0 || vat.gezahlt > 0

  // Umsatz nach Steuersatz (0 % vs. 19 % etc.)
  const revenueByVat = useMemo(() => {
    const map = new Map<number, number>()
    for (const t of monthTx) {
      if (t.kind !== 'einnahme') continue
      const rate = t.vat_rate ?? 0
      map.set(rate, (map.get(rate) ?? 0) + t.amount)
    }
    const rows = Array.from(map.entries())
      .map(([rate, amount]) => ({ rate, amount }))
      .sort((a, b) => b.amount - a.amount)
    const total = rows.reduce((s, r) => s + r.amount, 0)
    return { rows, total }
  }, [monthTx])

  // Auffälligkeit: Einnahmen ohne MwSt, obwohl bei Ausgaben MwSt anfiel
  const einnahmenOhneMwSt = useMemo(
    () => monthTx.filter((t) => t.kind === 'einnahme' && (t.vat_rate ?? 0) === 0),
    [monthTx],
  )
  const hatAusgabenMitMwSt = useMemo(
    () => monthTx.some((t) => t.kind === 'ausgabe' && (t.vat_rate ?? 0) > 0),
    [monthTx],
  )
  const summeOhneMwSt = einnahmenOhneMwSt.reduce((s, t) => s + t.amount, 0)

  if (monthTx.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
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
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="card min-w-0 p-4">
            <p className="stat-label">
              Gewinn
            </p>
            <p
              className={`mt-1 truncate text-xl font-semibold tabular-nums ${
                money.profit >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatEURSigned(money.profit)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Einnahmen − Ausgaben</p>
          </div>
          <div className="card min-w-0 p-4">
            <p className="stat-label">
              Cashflow
            </p>
            <p
              className={`mt-1 truncate text-xl font-semibold tabular-nums ${
                money.cashflow >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatEURSigned(money.cashflow)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Nur bezahlte Buchungen</p>
          </div>
        </div>
        {(openForderungen.length > 0 || openVerbindlichkeiten.length > 0) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <OpenItemsCard
              label="Offene Forderungen"
              hint="Noch nicht bezahlte Einnahmen"
              sum={sumForderungen}
              items={openForderungen}
              jobsById={jobsById}
              tone="amber"
            />
            <OpenItemsCard
              label="Offene Verbindlichkeiten"
              hint="Noch nicht bezahlte Ausgaben"
              sum={sumVerbindlichkeiten}
              items={openVerbindlichkeiten}
              jobsById={jobsById}
              tone="rose"
            />
          </div>
        )}
      </div>

      {compare.hasPrevData && (
        <div>
          <p className="stat-label mb-2">Vormonatsvergleich</p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="card min-w-0 p-3 text-center">
              <p className="truncate text-[11px] text-slate-400 sm:text-xs">Einnahmen</p>
              <DeltaBadge value={compare.incomeDelta} />
            </div>
            <div className="card min-w-0 p-3 text-center">
              <p className="truncate text-[11px] text-slate-400 sm:text-xs">Ausgaben</p>
              <DeltaBadge value={compare.expenseDelta} goodIsUp={false} />
            </div>
            <div className="card min-w-0 p-3 text-center">
              <p className="truncate text-[11px] text-slate-400 sm:text-xs">Gewinn</p>
              <DeltaBadge value={compare.profitDelta} />
            </div>
          </div>
        </div>
      )}

      {hasVat && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="card min-w-0 p-4">
            <p className="stat-label">
              Vereinnahmte MwSt
            </p>
            <p className="mt-1 truncate text-xl font-semibold tabular-nums text-slate-900">
              {formatEUR(vat.vereinnahmt)}
            </p>
          </div>
          <div className="card min-w-0 p-4">
            <p className="stat-label">
              Gezahlte MwSt
            </p>
            <p className="mt-1 truncate text-xl font-semibold tabular-nums text-slate-900">
              {formatEUR(vat.gezahlt)}
            </p>
          </div>
          <div className="card min-w-0 p-4">
            <p className="stat-label">
              Zahllast (Saldo)
            </p>
            <p
              className={`mt-1 truncate text-xl font-semibold tabular-nums ${
                vat.zahllast >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatEURSigned(vat.zahllast)}
            </p>
          </div>
        </div>
      )}

      {revenueByVat.rows.length > 0 && (
        <section className="card p-4 sm:p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Umsatz nach Steuersatz
            </h2>
            <span className="text-sm font-medium text-slate-500">
              {formatEUR(revenueByVat.total)}
            </span>
          </div>
          <ul className="space-y-3">
            {revenueByVat.rows.map((r) => {
              const pct =
                revenueByVat.total > 0
                  ? Math.round((r.amount / revenueByVat.total) * 100)
                  : 0
              return (
                <li key={r.rate}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{r.rate} % MwSt</span>
                    <span className="tabular-nums text-slate-600">
                      {formatEUR(r.amount)}{' '}
                      <span className="text-slate-400">({pct} %)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {einnahmenOhneMwSt.length > 0 && (
        <div
          className={`rounded-xl border p-4 ${
            hatAusgabenMitMwSt
              ? 'border-amber-200 bg-amber-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="mb-2 flex items-baseline justify-between">
            <p
              className={`text-xs font-medium uppercase tracking-wide ${
                hatAusgabenMitMwSt ? 'text-amber-700' : 'text-slate-400'
              }`}
            >
              Einnahmen ohne MwSt
            </p>
            <p
              className={`text-sm font-semibold tabular-nums ${
                hatAusgabenMitMwSt ? 'text-amber-700' : 'text-slate-700'
              }`}
            >
              {formatEUR(summeOhneMwSt)}
            </p>
          </div>
          {hatAusgabenMitMwSt && (
            <p className="mb-3 text-xs text-amber-600">
              Bei Ausgaben wurde diesen Monat MwSt gezahlt, bei diesen
              Einnahmen nicht – bitte prüfen, ob das so gewollt ist.
            </p>
          )}
          <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 bg-white">
            {einnahmenOhneMwSt.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon name={iconFor(t.category)} size={15} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {t.category}
                </span>
                <span className="text-sm font-medium tabular-nums text-slate-800">
                  {formatEUR(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Tortendiagramm */}
        <section className="card p-4 sm:p-5">
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
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
              <div className="h-44 w-44 shrink-0 sm:h-44 sm:w-44">
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
              <ul className="w-full space-y-2.5">
                {byCategory.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2.5 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-slate-700">{c.name}</span>
                    <span className="shrink-0 font-medium tabular-nums text-slate-800">
                      {formatEUR(c.value)}
                    </span>
                    <span className="w-11 shrink-0 text-right text-xs tabular-nums text-slate-400">
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
        <section className="card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Verlauf (6 Monate)
          </h2>
          {/* Auf dem Handy etwas höher – bei 176px waren die Balken kaum lesbar */}
          <div className="h-52 w-full sm:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} barGap={2}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  dy={4}
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

      {jobStats.ranking.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Auftrags-Kennzahlen */}
          <section className="card p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">
              Auftrags-Kennzahlen
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-xs text-slate-400">Ø Auftragswert</p>
                <p className="mt-1 truncate text-lg font-semibold tabular-nums text-slate-900">
                  {jobStats.avgValue != null ? formatEUR(jobStats.avgValue) : '–'}
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-xs text-slate-400">Ø Marge</p>
                <p className="mt-1 truncate text-lg font-semibold tabular-nums text-slate-900">
                  {jobStats.avgMargin != null
                    ? `${jobStats.avgMargin.toFixed(0)} %`
                    : '–'}
                </p>
              </div>
            </div>
            <div className="mt-3 min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-xs text-slate-400">Ø Auftragsdurchlaufzeit</p>
              <p className="mt-1 truncate text-lg font-semibold tabular-nums text-slate-900">
                {jobStats.avgDuration != null
                  ? `${jobStats.avgDuration.toFixed(0)} Tage`
                  : '–'}
              </p>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Basiert auf {jobStats.finishedCount} abgeschlossenen{' '}
              {jobStats.finishedCount === 1 ? 'Auftrag' : 'Aufträgen'}.
            </p>
          </section>

          {/* Top-Aufträge nach Gewinn */}
          <section className="card p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">
              Top-Aufträge nach Gewinn
            </h2>
            <ul className="space-y-1">
              {jobStats.ranking.slice(0, 5).map((r) => (
                <li
                  key={r.job.id}
                  className="flex items-center gap-3 rounded-lg px-1 py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon name="folder" size={15} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    {r.job.name}
                  </span>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      r.profit >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {formatEURSigned(r.profit)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {(jobsByRate.rate19.length > 0 || jobsByRate.rate0.length > 0) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <JobVatTable title="Aufträge mit 19 % MwSt" rows={jobsByRate.rate19} />
          <JobVatTable title="Aufträge mit 0 % MwSt" rows={jobsByRate.rate0} />
        </div>
      )}

      {/* Filterbare Liste */}
      <section>
        {/* Auf dem Handy eine scrollbare Zeile statt vier umbrechender */}
        <div className="no-scrollbar -mx-4 mb-3 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
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
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
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

function DeltaBadge({
  value,
  goodIsUp = true,
}: {
  value: number | null
  goodIsUp?: boolean
}) {
  if (value === null) {
    return <p className="mt-1 text-sm font-medium text-slate-400">neu</p>
  }
  const up = value >= 0
  const good = goodIsUp ? up : !up
  return (
    <p
      className={`mt-1 text-sm font-semibold tabular-nums ${
        good ? 'text-emerald-600' : 'text-rose-600'
      }`}
    >
      {up ? '▲' : '▼'} {Math.round(Math.abs(value))} %
    </p>
  )
}

function JobVatTable({
  title,
  rows,
}: {
  title: string
  rows: { job: Job; amount: number }[]
}) {
  const total = rows.reduce((s, r) => s + r.amount, 0)
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <span className="text-sm font-medium text-slate-500">{formatEUR(total)}</span>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Keine Aufträge.</p>
      ) : (
        // Container scrollt notfalls selbst, damit nie die ganze Seite wandert
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">Auftrag</th>
                <th className="pb-2 text-right font-medium">Umsatz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.job.id}>
                  <td className="min-w-0 max-w-0 truncate py-2.5 pr-3 text-slate-700">
                    {r.job.name}
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right font-medium tabular-nums text-slate-900">
                    {formatEUR(r.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function OpenItemsCard({
  label,
  hint,
  sum,
  items,
  jobsById,
  tone,
}: {
  label: string
  hint: string
  sum: number
  items: Transaction[]
  jobsById: Map<string, Job>
  tone: 'amber' | 'rose'
}) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) {
    return (
      <div className="card min-w-0 p-4">
        <p className="stat-label">{label}</p>
        <p className="mt-1 truncate text-xl font-semibold tabular-nums text-slate-300">
          {formatEUR(0)}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      </div>
    )
  }
  const colors =
    tone === 'amber'
      ? { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', textSoft: 'text-amber-600' }
      : { border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-700', textSoft: 'text-rose-600' }
  return (
    <div className={`overflow-hidden rounded-xl border ${colors.border} ${colors.bg}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition active:bg-white/40"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className={`block text-xs font-medium uppercase tracking-wide ${colors.text}`}>
            {label}
          </span>
          <span className={`mt-1 block truncate text-xl font-semibold tabular-nums ${colors.text}`}>
            {formatEUR(sum)}
          </span>
          <span className={`mt-0.5 block text-xs ${colors.textSoft}`}>{hint}</span>
        </span>
        <Icon
          name="chevron-right"
          size={16}
          className={`shrink-0 transition ${colors.text} ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="divide-y divide-white/60 border-t border-white/60 bg-white/60">
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500">
                <Icon name={iconFor(t.category)} size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-slate-700">
                  {t.category}
                </span>
                <span className="block truncate text-xs text-slate-400">
                  {formatDate(t.date)}
                  {' · '}
                  {t.job_id ? jobsById.get(t.job_id)?.name ?? 'Auftrag' : 'Einzelbuchung'}
                </span>
              </span>
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${colors.text}`}>
                {formatEUR(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
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
      className={`flex h-9 shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition ${
        active
          ? 'border-slate-900 bg-slate-900 text-white active:bg-slate-800'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100'
      }`}
    >
      {icon && <Icon name={iconFor(icon)} size={14} />}
      {label}
    </button>
  )
}
