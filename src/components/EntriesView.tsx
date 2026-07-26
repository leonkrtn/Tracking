import { useMemo, useState } from 'react'
import type { Job, Transaction } from '../lib/types'
import { formatDate, formatEUR, formatEURSigned, monthKeyOf } from '../lib/format'
import { iconFor } from '../lib/categories'
import Icon from './Icon'

interface Props {
  transactions: Transaction[]
  jobs: Job[]
  month: string
  onEdit: (t: Transaction) => void
  onOpenJob: (job: Job) => void
}

export default function EntriesView({
  transactions,
  jobs,
  month,
  onEdit,
  onOpenJob,
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

  // Eigenständige Buchungen (ohne Auftrag) – Aufträge werden separat als Karten gezeigt
  const standaloneTx = useMemo(
    () => monthTx.filter((t) => !t.job_id),
    [monthTx],
  )

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of standaloneTx) {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    }
    return Array.from(map.entries())
  }, [standaloneTx])

  const [jobSearch, setJobSearch] = useState('')
  const [jobStatus, setJobStatus] = useState<'all' | 'open' | 'done'>('all')
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)

  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase()
    return jobs.filter((j) => {
      if (jobStatus === 'open' && j.end_date) return false
      if (jobStatus === 'done' && !j.end_date) return false
      if (!q) return true
      return j.name.toLowerCase().includes(q) || j.note?.toLowerCase().includes(q)
    })
  }, [jobs, jobSearch, jobStatus])

  const jobProfits = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const t of transactions) {
      if (!t.job_id) continue
      const entry = map.get(t.job_id) ?? { income: 0, expense: 0 }
      if (t.kind === 'einnahme') entry.income += t.amount
      else entry.expense += t.amount
      map.set(t.job_id, entry)
    }
    return map
  }, [transactions])

  const hasAnything = jobs.length > 0 || standaloneTx.length > 0

  return (
    <div className="space-y-5">
      {/* Kennzahlen – auf dem Handy führt der Saldo, darunter die Details.
          Drei gleich große Karten untereinander kosteten dort eine halbe
          Bildschirmhöhe, bevor überhaupt Inhalt kam. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card col-span-2 min-w-0 p-4 sm:col-span-1">
          <p className="stat-label">Saldo</p>
          <p
            className={`mt-1 truncate text-3xl font-semibold tracking-tight tabular-nums sm:text-2xl ${
              balance >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatEURSigned(balance)}
          </p>
        </div>
        <div className="card min-w-0 p-4">
          <p className="stat-label">Einnahmen</p>
          <p className="mt-1 truncate text-xl font-semibold tracking-tight tabular-nums text-emerald-600 sm:text-2xl">
            {formatEUR(income)}
          </p>
        </div>
        <div className="card min-w-0 p-4">
          <p className="stat-label">Ausgaben</p>
          <p className="mt-1 truncate text-xl font-semibold tracking-tight tabular-nums text-rose-600 sm:text-2xl">
            {formatEUR(expense)}
          </p>
        </div>
      </div>

      {!hasAnything ? (
        <EmptyState />
      ) : (
        <div className="space-y-5">
          {/* Aufträge */}
          {jobs.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="stat-label">Aufträge</p>
                <p className="text-xs text-slate-400">
                  {filteredJobs.length} von {jobs.length}
                </p>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="search" size={16} />
                  </span>
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Auftrag suchen …"
                    className="field border-slate-200 pl-9 pr-3"
                  />
                </div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setStatusMenuOpen((o) => !o)}
                    aria-label="Aufträge filtern"
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border transition ${
                      jobStatus !== 'all'
                        ? 'border-slate-900 bg-slate-900 text-white active:bg-slate-800'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    <Icon name="filter" size={16} />
                  </button>
                  {statusMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-slate-900/20 sm:bg-transparent"
                        onClick={() => setStatusMenuOpen(false)}
                      />
                      {/* Handy: Bottom-Sheet. Ab sm: Dropdown wie bisher. */}
                      <div
                        className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white pt-2 shadow-sheet sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-11 sm:w-40 sm:rounded-xl sm:border sm:pt-1 sm:shadow-lg"
                        style={{
                          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
                        }}
                      >
                        <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-slate-200 sm:hidden" />
                        <StatusMenuItem
                          label="Alle"
                          active={jobStatus === 'all'}
                          onClick={() => {
                            setJobStatus('all')
                            setStatusMenuOpen(false)
                          }}
                        />
                        <StatusMenuItem
                          label="Offen"
                          active={jobStatus === 'open'}
                          onClick={() => {
                            setJobStatus('open')
                            setStatusMenuOpen(false)
                          }}
                        />
                        <StatusMenuItem
                          label="Abgeschlossen"
                          active={jobStatus === 'done'}
                          onClick={() => {
                            setJobStatus('done')
                            setStatusMenuOpen(false)
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              {filteredJobs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white py-6 text-center text-sm text-slate-400">
                  Kein Auftrag gefunden.
                </p>
              ) : (
                <div className="card divide-y divide-slate-100 overflow-hidden">
                  {filteredJobs.map((job) => {
                    const p = jobProfits.get(job.id) ?? { income: 0, expense: 0 }
                    const profit = p.income - p.expense
                    return (
                      <button
                        key={job.id}
                        onClick={() => onOpenJob(job)}
                        className="row-tap flex min-h-touch w-full items-center gap-3 px-4 py-3.5 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Icon name="folder" size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {job.name}
                          </span>
                          {job.note && (
                            <span className="block truncate text-xs text-slate-400">
                              {job.note}
                            </span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 text-sm font-semibold tabular-nums ${
                            profit >= 0 ? 'text-slate-900' : 'text-rose-600'
                          }`}
                        >
                          {p.income === 0 && p.expense === 0
                            ? '—'
                            : formatEURSigned(profit)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Eigenständige Buchungen */}
          {groups.map(([date, items]) => (
            <div key={date}>
              <p className="stat-label mb-2">{formatDate(date)}</p>
              <div className="card divide-y divide-slate-100 overflow-hidden">
                {items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onEdit(t)}
                    className="row-tap flex min-h-touch w-full items-center gap-3 px-4 py-3.5 text-left"
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

function StatusMenuItem({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-touch w-full items-center justify-between px-4 py-3 text-left text-base transition hover:bg-slate-50 active:bg-slate-100 sm:py-2 sm:text-sm ${
        active ? 'font-medium text-slate-900' : 'text-slate-600'
      }`}
    >
      {label}
      {active && <Icon name="check" size={16} />}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name="folder" size={22} />
      </span>
      <p className="text-sm font-medium text-slate-600">
        Noch keine Aufträge oder Buchungen in diesem Monat
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Lege mit „＋" einen neuen Auftrag an.
      </p>
    </div>
  )
}
