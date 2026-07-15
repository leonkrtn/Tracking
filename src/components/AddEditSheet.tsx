import { useEffect, useMemo, useState } from 'react'
import type {
  Category,
  JobInput,
  Kind,
  Transaction,
  TransactionInput,
} from '../lib/types'
import { DEFAULT_CATEGORIES, VAT_RATES, iconFor } from '../lib/categories'
import { formatEUR, todayISO } from '../lib/format'
import { bruttoFromNetto, nettoFromBrutto } from '../lib/vat'
import Icon from './Icon'

interface Props {
  existing: Transaction | null
  /**
   * - undefined: frisch aus dem „+"-Button geöffnet → Auftrag/Einzelbuchung
   *   togglebar, Standard ist Auftrag.
   * - string: Buchung wird gezielt einem Auftrag zugeordnet (z. B. „Kosten
   *   ergänzen" innerhalb eines Auftrags) → kein Toggle, Kategorie startet
   *   bei „Sonstiges".
   * - null: erzwungen eigenständige Buchung (z. B. beim Bearbeiten einer
   *   bereits eigenständigen Buchung) → kein Toggle.
   */
  jobId?: string | null
  categories: Category[]
  onClose: () => void
  onSaveTransaction: (input: TransactionInput) => Promise<void>
  onSaveJob?: (input: JobInput) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onAddCategory: (name: string, kind: Kind) => Promise<void>
}

function parseAmount(v: string): number {
  return Number(v.replace(/\./g, '').replace(',', '.'))
}

export default function AddEditSheet({
  existing,
  jobId,
  categories,
  onClose,
  onSaveTransaction,
  onSaveJob,
  onDelete,
  onAddCategory,
}: Props) {
  const showToggle = existing === null && jobId === undefined
  const effectiveJobId = jobId === undefined ? null : jobId
  const isNewCostInJob = existing === null && typeof effectiveJobId === 'string'

  const [entryMode, setEntryMode] = useState<'auftrag' | 'buchung'>('auftrag')
  const [jobName, setJobName] = useState('')
  const [jobNote, setJobNote] = useState('')

  const [kind, setKind] = useState<Kind>(existing?.kind ?? 'einnahme')
  const [category, setCategory] = useState(
    existing?.category ?? (isNewCostInJob ? 'Sonstiges' : ''),
  )
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [note, setNote] = useState(existing?.note ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [newCat, setNewCat] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)

  // MwSt ist immer aktiv, Standard-Satz 0 %.
  const [vatRate, setVatRate] = useState<number>(existing?.vat_rate ?? 0)
  const [netto, setNetto] = useState(
    existing
      ? String(nettoFromBrutto(existing.amount, existing.vat_rate ?? 0)).replace('.', ',')
      : '',
  )

  const catList = useMemo(() => {
    const own = categories.filter((c) => c.kind === kind).map((c) => c.name)
    return Array.from(new Set([...DEFAULT_CATEGORIES[kind], ...own]))
  }, [categories, kind])

  useEffect(() => {
    if (category && !catList.includes(category)) setCategory('')
  }, [catList, category])

  const bruttoPreview = bruttoFromNetto(parseAmount(netto) || 0, vatRate)

  const showJobForm = showToggle && entryMode === 'auftrag'

  async function handleSave() {
    setErr(null)

    if (showJobForm) {
      const name = jobName.trim()
      if (!name) return setErr('Bitte einen Namen für den Auftrag eingeben.')
      if (!onSaveJob) return
      setBusy(true)
      try {
        await onSaveJob({ name, note: jobNote.trim() || null })
        onClose()
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
        setBusy(false)
      }
      return
    }

    const value = bruttoPreview
    if (!value || value <= 0) return setErr('Bitte einen gültigen Betrag eingeben.')
    if (!category) return setErr('Bitte eine Kategorie wählen.')
    setBusy(true)
    try {
      await onSaveTransaction({
        kind,
        amount: value,
        category,
        date,
        note: note.trim() || null,
        vat_rate: vatRate,
        job_id: effectiveJobId,
      })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!existing || !onDelete) return
    if (!confirm('Diese Buchung wirklich löschen?')) return
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

  const title = showJobForm
    ? 'Neuer Auftrag'
    : existing
      ? 'Buchung bearbeiten'
      : isNewCostInJob
        ? 'Kosten / Einnahme ergänzen'
        : 'Neue Buchung'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden bg-slate-900/30 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-x-hidden overflow-y-auto rounded-t-2xl border border-slate-200 bg-white px-5 pt-3 shadow-2xl sm:rounded-2xl sm:pt-5"
        style={{
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          touchAction: 'pan-y',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-slate-200 sm:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
            aria-label="Schließen"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {showToggle && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setEntryMode('auftrag')}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${
                entryMode === 'auftrag'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Icon name="folder" size={15} /> Auftrag
            </button>
            <button
              onClick={() => setEntryMode('buchung')}
              className={`rounded-md py-2 text-sm font-medium transition ${
                entryMode === 'buchung'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Einzelbuchung
            </button>
          </div>
        )}

        {showJobForm ? (
          <>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Name des Auftrags
              </label>
              <input
                type="text"
                autoFocus
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="z. B. VW Golf – Kupplung"
                className={inputCls}
              />
            </div>
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Notiz <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={jobNote}
                onChange={(e) => setJobNote(e.target.value)}
                placeholder="z. B. Kunde, Kennzeichen …"
                className={inputCls}
              />
            </div>
          </>
        ) : (
          <>
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

            {/* Betrag (netto) + MwSt-Satz */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Netto-Betrag
              </label>

              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus={!existing}
                    value={netto}
                    onChange={(e) => setNetto(e.target.value.replace(/[^0-9,.]/g, ''))}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-3.5 pr-9 text-2xl font-semibold tabular-nums text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                    €
                  </span>
                </div>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-24 shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-base font-medium text-slate-900 outline-none focus:border-slate-900"
                >
                  {VAT_RATES.map((r) => (
                    <option key={r} value={r}>
                      {r} %
                    </option>
                  ))}
                </select>
              </div>

              <p className="mt-1.5 text-sm text-slate-500">
                Brutto:{' '}
                <span className="font-medium text-slate-700">
                  {formatEUR(bruttoPreview)}
                </span>
              </p>
            </div>

            {/* Kategorie */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Kategorie
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name={category ? iconFor(category) : 'package'} size={17} />
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-base text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="" disabled>
                    Kategorie wählen
                  </option>
                  {catList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="chevron-right" className="rotate-90" size={16} />
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCat((s) => !s)}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                <Icon name="plus" size={14} /> Neue Kategorie
              </button>
              {showNewCat && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCat}
                    autoFocus
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="Neue Kategorie"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
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
                placeholder="z. B. Rechnungsnummer, Kunde …"
                className={inputCls}
              />
            </div>
          </>
        )}

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
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              <Icon name="trash" size={16} /> Löschen
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={busy}
            className="min-w-0 flex-1 rounded-lg bg-slate-900 py-2.5 text-base font-medium text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? 'Speichere…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
