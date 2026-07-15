import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { useStore } from './lib/useStore'
import { currentMonthKey } from './lib/format'
import type { Transaction, TransactionInput } from './lib/types'
import { exportExcel, exportJSON } from './lib/exportData'
import Auth from './components/Auth'
import EntriesView from './components/EntriesView'
import ReportsView from './components/ReportsView'
import AddEditSheet from './components/AddEditSheet'
import MonthNav from './components/MonthNav'
import Icon, { type IconName } from './components/Icon'

type Tab = 'entries' | 'reports'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <p className="text-slate-400">Lädt…</p>
      </div>
    )
  }

  if (!session) return <Auth />
  return <Main userId={session.user.id} />
}

function Main({ userId }: { userId: string }) {
  const store = useStore(userId)
  const [tab, setTab] = useState<Tab>('entries')
  const [month, setMonth] = useState(currentMonthKey())
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function openNew() {
    setEditing(null)
    setSheetOpen(true)
  }
  function openEdit(t: Transaction) {
    setEditing(t)
    setSheetOpen(true)
  }
  async function handleSave(input: TransactionInput) {
    if (editing) await store.updateTransaction(editing.id, input)
    else await store.addTransaction(input)
  }

  const title = tab === 'entries' ? 'Buchungen' : 'Auswertung'

  return (
    <div className="flex min-h-full bg-slate-50">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Icon name="wrench" size={17} />
          </span>
          <span className="font-semibold tracking-tight text-slate-900">
            Meister-Kasse
          </span>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          <NavItem
            icon="list"
            label="Buchungen"
            active={tab === 'entries'}
            onClick={() => setTab('entries')}
          />
          <NavItem
            icon="chart"
            label="Auswertung"
            active={tab === 'reports'}
            onClick={() => setTab('reports')}
          />
        </nav>
        <div className="mt-auto p-3">
          <button
            onClick={openNew}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Icon name="plus" size={17} /> Neue Buchung
          </button>
        </div>
      </aside>

      {/* Hauptbereich */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Kopfzeile */}
        <header
          className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex h-14 items-center justify-between gap-3 px-4 md:h-16 md:px-6">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden sm:block">
                <MonthNav month={month} onChange={setMonth} />
              </div>
              <MoreMenu store={store} />
            </div>
          </div>
          {/* MonthNav mobil (eigene Zeile) */}
          <div className="flex justify-center border-t border-slate-100 py-2 sm:hidden">
            <MonthNav month={month} onChange={setMonth} />
          </div>
        </header>

        {/* Inhalt */}
        <main className="flex-1 pb-28 md:pb-8">
          <div className="mx-auto w-full max-w-5xl px-4 py-5 md:px-6 md:py-6">
            {store.error && (
              <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {store.error}
                {store.error.includes('relation') && (
                  <p className="mt-1 text-xs">
                    Tipp: Bitte zuerst das SQL-Schema in Supabase ausführen (siehe
                    README).
                  </p>
                )}
              </div>
            )}
            {store.loading ? (
              <p className="py-16 text-center text-slate-400">Lädt Daten…</p>
            ) : tab === 'entries' ? (
              <EntriesView
                transactions={store.transactions}
                month={month}
                onEdit={openEdit}
              />
            ) : (
              <ReportsView transactions={store.transactions} month={month} />
            )}
          </div>
        </main>
      </div>

      {/* Floating + (nur Handy) */}
      <button
        onClick={openNew}
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition active:scale-95 md:hidden"
        aria-label="Neue Buchung"
      >
        <Icon name="plus" size={26} />
      </button>

      {/* Bottom-Tabs (nur Handy) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-slate-200 bg-white md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <TabButton
          active={tab === 'entries'}
          onClick={() => setTab('entries')}
          icon="list"
          label="Buchungen"
        />
        <TabButton
          active={tab === 'reports'}
          onClick={() => setTab('reports')}
          icon="chart"
          label="Auswertung"
        />
      </nav>

      {sheetOpen && (
        <AddEditSheet
          existing={editing}
          categories={store.categories}
          onClose={() => setSheetOpen(false)}
          onSave={handleSave}
          onDelete={store.deleteTransaction}
          onAddCategory={store.addCategory}
        />
      )}
    </div>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <Icon name={icon} size={18} />
      {label}
    </button>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: IconName
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
        active ? 'text-slate-900' : 'text-slate-400'
      }`}
    >
      <Icon name={icon} size={22} />
      {label}
    </button>
  )
}

function MoreMenu({ store }: { store: ReturnType<typeof useStore> }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        aria-label="Menü"
      >
        <Icon name="more" size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <MenuItem
              icon="download"
              label="Als Excel exportieren"
              onClick={() => {
                exportExcel(store.transactions)
                setOpen(false)
              }}
            />
            <MenuItem
              icon="download"
              label="Backup (JSON) sichern"
              onClick={() => {
                exportJSON(store.transactions)
                setOpen(false)
              }}
            />
            <ImportItem
              onImported={async (rows) => {
                const n = await store.importJSON(rows)
                setOpen(false)
                alert(`${n} Buchungen importiert.`)
              }}
            />
            <div className="my-1 border-t border-slate-100" />
            <MenuItem
              icon="logout"
              label="Abmelden"
              danger
              onClick={() => supabase.auth.signOut()}
            />
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: IconName
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
        danger ? 'text-rose-600' : 'text-slate-700'
      }`}
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  )
}

function ImportItem({
  onImported,
}: {
  onImported: (rows: TransactionInput[]) => void
}) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        const raw = Array.isArray(data) ? data : data.transactions
        if (!Array.isArray(raw)) throw new Error('Ungültiges Format')
        const rows: TransactionInput[] = raw.map((t: Record<string, unknown>) => ({
          kind: t.kind === 'einnahme' ? 'einnahme' : 'ausgabe',
          amount: Number(t.amount),
          category: String(t.category ?? 'Sonstiges'),
          date: String(t.date),
          note: t.note != null ? String(t.note) : null,
          vat_rate: t.vat_rate != null ? Number(t.vat_rate) : null,
        }))
        onImported(rows)
      } catch {
        alert('Datei konnte nicht gelesen werden (kein gültiges Backup).')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50">
      <Icon name="upload" size={17} />
      Backup wiederherstellen
      <input
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
    </label>
  )
}
