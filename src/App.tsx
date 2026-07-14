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

type Tab = 'entries' | 'reports'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-400">Lädt…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950">
        <Auth />
      </div>
    )
  }

  return <Main userId={session.user.id} />
}

function Main({ userId }: { userId: string }) {
  const store = useStore(userId)
  const [tab, setTab] = useState<Tab>('entries')
  const [month, setMonth] = useState(currentMonthKey())
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-slate-50 dark:bg-slate-950">
      {/* Kopfzeile */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {tab === 'entries' ? 'Einträge' : 'Auswertung'}
        </h1>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 active:bg-slate-200 dark:text-slate-300 dark:active:bg-slate-800"
            aria-label="Menü"
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <MenuItem
                  label="Als Excel exportieren"
                  icon="📊"
                  onClick={() => {
                    exportExcel(store.transactions)
                    setMenuOpen(false)
                  }}
                />
                <MenuItem
                  label="Backup (JSON) sichern"
                  icon="💾"
                  onClick={() => {
                    exportJSON(store.transactions)
                    setMenuOpen(false)
                  }}
                />
                <ImportItem
                  onImported={async (rows) => {
                    const n = await store.importJSON(rows)
                    setMenuOpen(false)
                    alert(`${n} Einträge importiert.`)
                  }}
                />
                <div className="border-t border-slate-100 dark:border-slate-700" />
                <MenuItem
                  label="Abmelden"
                  icon="🚪"
                  danger
                  onClick={() => supabase.auth.signOut()}
                />
              </div>
            </>
          )}
        </div>
      </header>

      {/* Inhalt */}
      <main className="flex-1 px-4 py-4 pb-28">
        {store.error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">
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
            onMonthChange={setMonth}
            onEdit={openEdit}
          />
        ) : (
          <ReportsView
            transactions={store.transactions}
            month={month}
            onMonthChange={setMonth}
          />
        )}
      </main>

      {/* Floating + */}
      <button
        onClick={openNew}
        className="fixed bottom-24 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-xl shadow-emerald-500/30 transition active:scale-95"
        aria-label="Neuer Eintrag"
      >
        ＋
      </button>

      {/* Tab-Leiste */}
      <nav
        className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <TabButton
          active={tab === 'entries'}
          onClick={() => setTab('entries')}
          icon="🧾"
          label="Einträge"
        />
        <TabButton
          active={tab === 'reports'}
          onClick={() => setTab('reports')}
          icon="📊"
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

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
        active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
      }`}
    >
      <span className={`text-xl ${active ? '' : 'opacity-60 grayscale'}`}>
        {icon}
      </span>
      {label}
    </button>
  )
}

function MenuItem({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string
  icon: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm active:bg-slate-50 dark:active:bg-slate-700/50 ${
        danger ? 'text-red-600' : 'text-slate-700 dark:text-slate-200'
      }`}
    >
      <span>{icon}</span>
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
    <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 active:bg-slate-50 dark:text-slate-200 dark:active:bg-slate-700/50">
      <span>📥</span>
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
