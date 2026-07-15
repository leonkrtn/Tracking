import { useMemo, useState } from 'react'
import type { Job, JobInput, Transaction } from '../lib/types'
import { formatDate, formatEUR, formatEURSigned } from '../lib/format'
import { iconFor } from '../lib/categories'
import Icon from './Icon'

interface Props {
  job: Job
  transactions: Transaction[] // bereits auf diesen Auftrag gefiltert
  onClose: () => void
  onAddEntry: () => void
  onEditEntry: (t: Transaction) => void
  onRename: (id: string, input: JobInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function JobSheet({
  job,
  transactions,
  onClose,
  onAddEntry,
  onEditEntry,
  onRename,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(job.name)
  const [note, setNote] = useState(job.note ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const { income, expense } = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (t.kind === 'einnahme') income += t.amount
      else expense += t.amount
    }
    return { income, expense }
  }, [transactions])
  const profit = income - expense

  async function handleRename() {
    setErr(null)
    const clean = name.trim()
    if (!clean) return setErr('Bitte einen Namen eingeben.')
    setBusy(true)
    try {
      await onRename(job.id, { name: clean, note: note.trim() || null })
      setEditing(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Auftrag „${job.name}" wirklich löschen? Alle zugehörigen Buchungen werden mitgelöscht.`))
      return
    setBusy(true)
    try {
      await onDelete(job.id)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.')
      setBusy(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white px-5 pt-3 shadow-2xl sm:rounded-2xl sm:pt-5"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-slate-200 sm:hidden" />

        {editing ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Auftrag bearbeiten</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                aria-label="Schließen"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Name</label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Notiz <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputCls}
              />
            </div>
            {err && (
              <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-600">
                {err}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
              >
                <Icon name="trash" size={16} /> Löschen
              </button>
              <button
                onClick={handleRename}
                disabled={busy}
                className="min-w-0 flex-1 rounded-lg bg-slate-900 py-2.5 text-base font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {busy ? 'Speichere…' : 'Speichern'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon name="folder" size={16} />
                  </span>
                  <h2 className="truncate text-base font-semibold text-slate-900">
                    {job.name}
                  </h2>
                </div>
                {job.note && (
                  <p className="mt-1 truncate text-sm text-slate-500">{job.note}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setEditing(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                  aria-label="Bearbeiten"
                >
                  <Icon name="settings" size={17} />
                </button>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                  aria-label="Schließen"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
            </div>

            {/* Stat-Kacheln */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Einnahmen
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-600">
                  {formatEUR(income)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ausgaben
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-rose-600">
                  {formatEUR(expense)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Gewinn
                </p>
                <p
                  className={`mt-1 text-lg font-semibold tabular-nums ${
                    profit >= 0 ? 'text-slate-900' : 'text-rose-600'
                  }`}
                >
                  {formatEURSigned(profit)}
                </p>
              </div>
            </div>

            <button
              onClick={onAddEntry}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Icon name="plus" size={16} /> Kosten / Einnahme hinzufügen
            </button>

            {transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Noch keine Buchungen in diesem Auftrag.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {transactions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onEditEntry(t)}
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
                      <span className="block truncate text-xs text-slate-400">
                        {formatDate(t.date)}
                        {t.note ? ` · ${t.note}` : ''}
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
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
