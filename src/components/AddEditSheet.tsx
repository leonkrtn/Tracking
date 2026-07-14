import { useEffect, useMemo, useState } from 'react'
import type { Category, Kind, Transaction, TransactionInput } from '../lib/types'
import { DEFAULT_CATEGORIES, iconFor } from '../lib/categories'
import { todayISO } from '../lib/format'
import Icon from './Icon'

interface Props {
  existing: Transaction | null
  categories: Category[]
  onClose: () => void
  onSave: (input: TransactionInput) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onAddCategory: (name: string, kind: Kind) => Promise<void>
}

export default function AddEditSheet({
  existing,
  categories,
  onClose,
  onSave,
  onDelete,
  onAddCategory,
}: Props) {
  const [kind, setKind] = useState<Kind>(existing?.kind ?? 'ausgabe')
  const [amount, setAmount] = useState(
    existing ? String(existing.amount).replace('.', ',') : '',
  )
  const [category, setCategory] = useState(existing?.category ?? '')
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [note, setNote] = useState(existing?.note ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [newCat, setNewCat] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)

  const catList = useMemo(() => {
    const own = categories.filter((c) => c.kind === kind).map((c) => c.name)
    return Array.from(new Set([...DEFAULT_CATEGORIES[kind], ...own]))
  }, [categories, kind])

  useEffect(() => {
    if (category && !catList.includes(category)) setCategory('')
  }, [catList, category])

  function parseAmount(v: string): number {
    return Number(v.replace(/\./g, '').replace(',', '.'))
  }

  async function handleSave() {
    setErr(null)
    const value = parseAmount(amount)
    if (!value || value <= 0) return setErr('Bitte einen gültigen Betrag eingeben.')
    if (!category) return setErr('Bitte eine Kategorie wählen.')
    setBusy(true)
    try {
      await onSave({ kind, amount: value, category, date, note: note.trim() || null })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!existing || !onDelete) return
    if (!confirm('Diesen Eintrag wirklich löschen?')) return
    setBusy(true)
    try {
      await onDelete(existing.id)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.')
      setBusy(false)
    }
  }

  async function handleAddCategory() {
    const name = newCat.trim()
    if (!name) return
    await onAddCategory(name, kind)
    setCategory(name)
    setNewCat('')
    setShowNewCat(false)
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
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {existing ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
            aria-label="Schließen"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Typ */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setKind('ausgabe')}
            className={`rounded-md py-2 text-sm font-medium transition ${
              kind === 'ausgabe'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Ausgabe
          </button>
          <button
            onClick={() => setKind('einnahme')}
            className={`rounded-md py-2 text-sm font-medium transition ${
              kind === 'einnahme'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Einnahme
          </button>
        </div>

        {/* Betrag */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            Betrag
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              autoFocus={!existing}
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9,.]/g, ''))}
              placeholder="0,00"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-3.5 pr-9 text-2xl font-semibold tabular-nums text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              €
            </span>
          </div>
        </div>

        {/* Kategorie */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            Kategorie
          </label>
          <div className="flex flex-wrap gap-2">
            {catList.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                  category === c
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon name={iconFor(c)} size={15} />
                {c}
              </button>
            ))}
            <button
              onClick={() => setShowNewCat((s) => !s)}
              className="flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50"
            >
              <Icon name="plus" size={15} /> Neu
            </button>
          </div>
          {showNewCat && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newCat}
                autoFocus
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Neue Kategorie"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
              <button
                onClick={handleAddCategory}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                OK
              </button>
            </div>
          )}
        </div>

        {/* Datum */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Notiz */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            Notiz <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="z. B. Wocheneinkauf"
            className={inputCls}
          />
        </div>

        {err && (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-600">
            {err}
          </p>
        )}

        <div className="flex gap-3">
          {existing && onDelete && (
            <button
              onClick={handleDelete}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              <Icon name="trash" size={16} /> Löschen
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 rounded-lg bg-slate-900 py-2.5 text-base font-medium text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? 'Speichere…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
