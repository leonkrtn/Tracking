import { useEffect, useMemo, useState } from 'react'
import type { Category, Kind, Transaction, TransactionInput } from '../lib/types'
import { DEFAULT_CATEGORIES, iconFor } from '../lib/categories'
import { todayISO } from '../lib/format'

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

  // verfügbare Kategorien = Standard + eigene, für den gewählten Typ
  const catList = useMemo(() => {
    const own = categories.filter((c) => c.kind === kind).map((c) => c.name)
    const merged = [...DEFAULT_CATEGORIES[kind], ...own]
    return Array.from(new Set(merged))
  }, [categories, kind])

  // Bei Typwechsel Kategorie zurücksetzen, falls sie nicht mehr passt
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-5 pb-8 pt-3 shadow-2xl dark:bg-slate-900"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
        <h2 className="mb-4 text-center text-lg font-bold text-slate-900 dark:text-white">
          {existing ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
        </h2>

        {/* Typ-Umschalter */}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setKind('ausgabe')}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${
              kind === 'ausgabe'
                ? 'bg-red-500 text-white shadow'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            − Ausgabe
          </button>
          <button
            onClick={() => setKind('einnahme')}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${
              kind === 'einnahme'
                ? 'bg-emerald-500 text-white shadow'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            + Einnahme
          </button>
        </div>

        {/* Betrag */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
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
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-10 text-2xl font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">
              €
            </span>
          </div>
        </div>

        {/* Kategorie */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
            Kategorie
          </label>
          <div className="flex flex-wrap gap-2">
            {catList.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  category === c
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {iconFor(c)} {c}
              </button>
            ))}
            <button
              onClick={() => setShowNewCat((s) => !s)}
              className="rounded-full border border-dashed border-slate-400 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400"
            >
              ＋ Neu
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
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={handleAddCategory}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                OK
              </button>
            </div>
          )}
        </div>

        {/* Datum */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Notiz */}
        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
            Notiz <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="z. B. Wocheneinkauf"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {err && <p className="mb-3 text-center text-sm text-red-500">{err}</p>}

        <div className="flex gap-3">
          {existing && onDelete && (
            <button
              onClick={handleDelete}
              disabled={busy}
              className="rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-50 dark:border-red-500/40"
            >
              Löschen
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 rounded-xl bg-emerald-500 py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? 'Speichere…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
