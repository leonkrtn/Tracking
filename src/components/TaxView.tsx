import { useMemo, useState } from 'react'
import type { Transaction } from '../lib/types'
import { formatDate, formatEUR, formatEURSigned, formatMonth, monthKeyOf } from '../lib/format'
import { iconFor } from '../lib/categories'
import { nettoFromBrutto, vatAmount } from '../lib/vat'
import Icon from './Icon'

interface Props {
  transactions: Transaction[]
  month: string
}

function isRate(t: Transaction, rate: 19 | 0): boolean {
  const r = t.vat_rate ?? 0
  return rate === 19 ? r >= 19 : r < 19
}

export default function TaxView({ transactions, month }: Props) {
  const [rate, setRate] = useState<19 | 0>(19)
  const year = month.slice(0, 4)

  const monthTx = useMemo(
    () =>
      transactions.filter((t) => monthKeyOf(t.date) === month && isRate(t, rate)),
    [transactions, month, rate],
  )

  const stats = useMemo(() => {
    let einnahmenNetto = 0
    let einnahmenBrutto = 0
    let einnahmenMwSt = 0
    let ausgabenNetto = 0
    let ausgabenBrutto = 0
    let ausgabenMwSt = 0
    for (const t of monthTx) {
      const r = t.vat_rate ?? 0
      const netto = nettoFromBrutto(t.amount, r)
      const mwst = vatAmount(t.amount, r)
      if (t.kind === 'einnahme') {
        einnahmenNetto += netto
        einnahmenBrutto += t.amount
        einnahmenMwSt += mwst
      } else {
        ausgabenNetto += netto
        ausgabenBrutto += t.amount
        ausgabenMwSt += mwst
      }
    }
    return {
      einnahmenNetto,
      einnahmenBrutto,
      einnahmenMwSt,
      ausgabenNetto,
      ausgabenBrutto,
      ausgabenMwSt,
      zahllast: einnahmenMwSt - ausgabenMwSt,
    }
  }, [monthTx])

  // Steuerplanung: USt-Zahllast seit Jahresbeginn bis zum gewählten Monat (nur 19 %-Satz relevant)
  const ytdZahllast = useMemo(() => {
    let sum = 0
    for (const t of transactions) {
      const mk = monthKeyOf(t.date)
      if (!mk.startsWith(year) || mk > month) continue
      if (!isRate(t, 19)) continue
      const r = t.vat_rate ?? 0
      const mwst = vatAmount(t.amount, r)
      sum += t.kind === 'einnahme' ? mwst : -mwst
    }
    return sum
  }, [transactions, year, month])

  return (
    <div className="space-y-5">
      {/* Umschalter 19 % / 0 % */}
      <div className="inline-flex rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setRate(19)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
            rate === 19 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          19 % MwSt
        </button>
        <button
          onClick={() => setRate(0)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
            rate === 0 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          0 % MwSt
        </button>
      </div>

      {monthTx.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Icon name="percent" size={22} />
          </span>
          <p className="text-sm font-medium text-slate-600">
            Keine Buchungen mit {rate} % MwSt in {formatMonth(month)}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Einnahmen (netto)
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600">
                {formatEUR(stats.einnahmenNetto)}
              </p>
              {rate === 19 && (
                <p className="mt-0.5 text-xs text-slate-400">
                  + {formatEUR(stats.einnahmenMwSt)} MwSt = {formatEUR(stats.einnahmenBrutto)} brutto
                </p>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Ausgaben (netto)
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
                {formatEUR(stats.ausgabenNetto)}
              </p>
              {rate === 19 && (
                <p className="mt-0.5 text-xs text-slate-400">
                  + {formatEUR(stats.ausgabenMwSt)} MwSt (Vorsteuer) = {formatEUR(stats.ausgabenBrutto)} brutto
                </p>
              )}
            </div>
          </div>

          {rate === 19 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                USt-Zahllast {formatMonth(month)}
              </p>
              <p
                className={`mt-1 text-xl font-semibold tabular-nums ${
                  stats.zahllast >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {formatEURSigned(stats.zahllast)}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Vereinnahmte MwSt ({formatEUR(stats.einnahmenMwSt)}) − Vorsteuer (
                {formatEUR(stats.ausgabenMwSt)})
                {stats.zahllast >= 0 ? ' – an das Finanzamt abzuführen.' : ' – Erstattung vom Finanzamt.'}
              </p>
            </div>
          )}

          {rate === 19 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Steuerplanung – seit Jahresbeginn {year}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-amber-700">
                {formatEURSigned(ytdZahllast)}
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                Aufsummierte USt-Zahllast (19 %) von Januar bis {formatMonth(month)}. Richtwert
                für die nächste Umsatzsteuer-Voranmeldung, ersetzt keine Steuerberatung.
              </p>
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Buchungen mit {rate} % MwSt – {formatMonth(month)}
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {monthTx
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        t.kind === 'einnahme'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon name={iconFor(t.category)} size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-700">
                        {t.category}
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        {formatDate(t.date)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
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
        </>
      )}
    </div>
  )
}
