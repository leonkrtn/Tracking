import { useEffect, useMemo, useState } from 'react'
import type {
  Category,
  JobInput,
  Kind,
  Transaction,
  TransactionInput,
} from '../lib/types'
import { DEFAULT_CATEGORIES, VAT_RATES, iconFor } from '../lib/categories'
import { formatEUR, todayISO, yesterdayISO } from '../lib/format'
import { useSheet } from '../lib/useSheet'
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

function DateChip({
  label,
  value,
  current,
  onPick,
}: {
  label: string
  value: string
  current: string
  onPick: (v: string) => void
}) {
  const on = current === value
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      aria-pressed={on}
      className={`min-h-touch rounded-lg border px-3 text-sm font-medium transition ${
        on
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )
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
  useSheet(onClose)

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
  const [paid, setPaid] = useState(existing?.paid ?? false)

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
        paid,
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

  const title = showJobForm
    ? 'Neuer Auftrag'
    : existing
      ? 'Buchung bearbeiten'
      : isNewCostInJob
        ? 'Kosten / Einnahme ergänzen'
        : 'Neue Buchung'

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet-panel"
        style={{ touchAction: 'pan-y' }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 pt-3 sm:pt-5">
          <div className="sheet-handle" />
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-base font-semibold text-slate-900">
              {title}
            </h2>
            <button onClick={onClose} className="icon-btn shrink-0" aria-label="Schließen">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        <div className="sheet-body pb-4">
        {showToggle && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setEntryMode('auftrag')}
              className={`flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${
                entryMode === 'auftrag'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 active:bg-white/60'
              }`}
            >
              <Icon name="folder" size={15} /> Auftrag
            </button>
            <button
              onClick={() => setEntryMode('buchung')}
              className={`min-h-[2.75rem] rounded-md py-2 text-sm font-medium transition ${
                entryMode === 'buchung'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 active:bg-white/60'
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
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="z. B. VW Golf – Kupplung"
                className="field"
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
                className="field"
              />
            </div>
          </>
        ) : (
          <>
            {/* Typ */}
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setKind('einnahme')}
                className={`min-h-[2.75rem] rounded-md py-2 text-sm font-medium transition ${
                  kind === 'einnahme'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 active:bg-white/60'
                }`}
              >
                Einnahme
              </button>
              <button
                onClick={() => setKind('ausgabe')}
                className={`min-h-[2.75rem] rounded-md py-2 text-sm font-medium transition ${
                  kind === 'ausgabe'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-500 active:bg-white/60'
                }`}
              >
                Ausgabe
              </button>
            </div>

            {/* Betrag (netto) + MwSt-Satz */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Netto-Betrag
              </label>

              {/* Auf sehr schmalen Displays rutscht der MwSt-Schalter unter das
                  Betragsfeld, statt es zusammenzuquetschen. */}
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[9rem] flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={netto}
                    onChange={(e) => setNetto(e.target.value.replace(/[^0-9,.]/g, ''))}
                    placeholder="0,00"
                    className="field py-2 pl-3.5 pr-9 text-2xl font-semibold tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                    €
                  </span>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                  {VAT_RATES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setVatRate(r)}
                      className={`min-h-[2.75rem] rounded-md px-3.5 text-sm font-medium transition ${
                        vatRate === r
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 active:bg-white/60'
                      }`}
                    >
                      {r} %
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-1.5 text-sm text-slate-500">
                Brutto:{' '}
                <span className="font-medium text-slate-700">
                  {formatEUR(bruttoPreview)}
                </span>
              </p>
            </div>

            {/* Kategorie – als Chips statt Dropdown: ein Tipp statt
                aufklappen, scrollen, auswählen, schließen. */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Kategorie
              </label>
              <div className="flex flex-wrap gap-1.5">
                {catList.map((c) => {
                  const on = category === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      aria-pressed={on}
                      className={`flex min-h-[2.5rem] max-w-full items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition ${
                        on
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100'
                      }`}
                    >
                      <Icon name={iconFor(c)} size={15} className="shrink-0" />
                      <span className="truncate">{c}</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setShowNewCat((s) => !s)}
                  className="flex min-h-[2.5rem] items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 active:bg-slate-100"
                >
                  <Icon name="plus" size={14} /> Neu
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
                    className="field min-w-0 flex-1"
                  />
                  <button onClick={handleAddCategory} className="btn-primary shrink-0">
                    OK
                  </button>
                </div>
              )}
            </div>

            {/* Datum – „Heute" deckt den Normalfall mit einem Tipp ab */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Datum
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="field min-w-[9rem] flex-1"
                />
                <div className="flex shrink-0 gap-1.5">
                  <DateChip label="Heute" value={todayISO()} current={date} onPick={setDate} />
                  <DateChip label="Gestern" value={yesterdayISO()} current={date} onPick={setDate} />
                </div>
              </div>
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
                className="field"
              />
            </div>

            {/* Gezahlt */}
            <button
              type="button"
              onClick={() => setPaid((p) => !p)}
              className="mb-2 flex min-h-touch w-full items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 transition hover:bg-slate-50 active:bg-slate-100"
            >
              <span className="text-sm font-medium text-slate-600">Gezahlt</span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                  paid ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                    paid ? 'translate-x-[18px]' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </>
        )}

        </div>

        {/* Aktionsleiste bleibt stehen – bei offener Tastatur war „Speichern"
            bisher oft außerhalb des Sichtbereichs. */}
        <div
          className="shrink-0 border-t border-slate-100 bg-white px-5 pt-3"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
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
                className="btn-secondary flex shrink-0 items-center gap-1.5 text-rose-600 hover:bg-rose-50 active:bg-rose-100"
              >
                <Icon name="trash" size={16} /> Löschen
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={busy}
              className="btn-primary min-w-0 flex-1"
            >
              {busy ? 'Speichere…' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
