import { Suspense, lazy, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { useStore } from './lib/useStore'
import { currentMonthKey } from './lib/format'
import type { Job, JobInput, Transaction, TransactionInput } from './lib/types'
import { exportCSV, exportExcel } from './lib/exportData'
import Auth from './components/Auth'
import EntriesView from './components/EntriesView'
// Die Diagramm-Bibliothek wird erst geladen, wenn die Auswertung geöffnet
// wird – sie ist der größte Brocken im Bundle und beim Start nicht nötig.
const ReportsView = lazy(() => import('./components/ReportsView'))
import TaxView from './components/TaxView'
import AddEditSheet from './components/AddEditSheet'
import JobSheet from './components/JobSheet'
import MonthNav from './components/MonthNav'
import Icon, { type IconName } from './components/Icon'

type Tab = 'entries' | 'reports' | 'tax'

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
  // undefined = frisch, Auftrag/Einzelbuchung togglebar; string/null = fester Kontext
  const [sheetJobId, setSheetJobId] = useState<string | null | undefined>(undefined)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [activeJob, setActiveJob] = useState<Job | null>(null)

  function openNew() {
    setEditing(null)
    setSheetJobId(undefined)
    setSheetOpen(true)
  }
  function openEdit(t: Transaction) {
    setEditing(t)
    setSheetJobId(t.job_id)
    setSheetOpen(true)
  }
  function openAddEntryToJob(jobId: string) {
    setEditing(null)
    setSheetJobId(jobId)
    setSheetOpen(true)
  }

  async function handleSaveTransaction(input: TransactionInput) {
    if (editing) await store.updateTransaction(editing.id, input)
    else await store.addTransaction(input)
  }
  async function handleSaveJob(input: JobInput) {
    await store.addJob(input)
  }

  // aktiven Auftrag nach Reload aktualisieren, damit Betrag/Liste live bleiben
  const liveActiveJob = activeJob
    ? store.jobs.find((j) => j.id === activeJob.id) ?? null
    : null

  const title =
    tab === 'entries' ? 'Buchungen' : tab === 'reports' ? 'Auswertung' : 'Steuer'

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
          <NavItem
            icon="percent"
            label="Steuer"
            active={tab === 'tax'}
            onClick={() => setTab('tax')}
          />
        </nav>
        <div className="mt-auto p-3">
          <button
            onClick={openNew}
            className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
          >
            <Icon name="plus" size={17} /> Neu
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
          {/* Eine Zeile – auf dem Handy sparte die zweite Zeile nur Platz weg */}
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:h-16 md:px-6">
            <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              {title}
            </h1>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
              <MonthNav month={month} onChange={setMonth} />
              <MoreMenu store={store} />
            </div>
          </div>
        </header>

        {/* Inhalt */}
        <main className="flex-1 pb-content-b md:pb-8">
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
              <LoadingSkeleton />
            ) : tab === 'entries' ? (
              <EntriesView
                transactions={store.transactions}
                jobs={store.jobs}
                month={month}
                onEdit={openEdit}
                onOpenJob={setActiveJob}
              />
            ) : tab === 'reports' ? (
              <Suspense fallback={<LoadingSkeleton />}>
                <ReportsView
                  transactions={store.transactions}
                  jobs={store.jobs}
                  month={month}
                />
              </Suspense>
            ) : (
              <TaxView transactions={store.transactions} month={month} />
            )}
          </div>
        </main>
      </div>

      {/* Floating + (nur Handy) – sitzt über der Tab-Leiste inkl. Safe-Area */}
      <button
        onClick={openNew}
        className="fixed bottom-fab right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition active:scale-95 md:hidden"
        aria-label="Neu"
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
        <TabButton
          active={tab === 'tax'}
          onClick={() => setTab('tax')}
          icon="percent"
          label="Steuer"
        />
      </nav>

      {liveActiveJob && (
        <JobSheet
          job={liveActiveJob}
          transactions={store.transactions.filter((t) => t.job_id === liveActiveJob.id)}
          onClose={() => setActiveJob(null)}
          onAddEntry={() => openAddEntryToJob(liveActiveJob.id)}
          onEditEntry={openEdit}
          onRename={store.updateJob}
          onFinish={store.finishJob}
          onReopen={store.reopenJob}
          onTogglePaid={store.togglePaid}
          onDelete={async (id) => {
            await store.deleteJob(id)
            setActiveJob(null)
          }}
        />
      )}

      {sheetOpen && (
        <AddEditSheet
          existing={editing}
          jobId={sheetJobId}
          categories={store.categories}
          onClose={() => setSheetOpen(false)}
          onSaveTransaction={handleSaveTransaction}
          onSaveJob={handleSaveJob}
          onDelete={store.deleteTransaction}
          onAddCategory={store.addCategory}
        />
      )}
    </div>
  )
}

/** Platzhalter in der Form des späteren Inhalts – wirkt schneller als Text. */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Lädt" role="status">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 h-[92px] rounded-xl bg-slate-200/70 sm:col-span-1" />
        <div className="h-[92px] rounded-xl bg-slate-200/70" />
        <div className="h-[92px] rounded-xl bg-slate-200/70" />
      </div>
      <div className="h-11 rounded-lg bg-slate-200/70" />
      <div className="space-y-2">
        <div className="h-16 rounded-xl bg-slate-200/70" />
        <div className="h-16 rounded-xl bg-slate-200/60" />
        <div className="h-16 rounded-xl bg-slate-200/50" />
      </div>
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
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100'
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
      aria-current={active ? 'page' : undefined}
      className={`relative flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition active:bg-slate-50 ${
        active ? 'text-slate-900' : 'text-slate-400'
      }`}
    >
      {/* Aktiver Tab war bisher nur an der Textfarbe erkennbar */}
      <span
        className={`absolute inset-x-0 top-0 mx-auto h-0.5 w-9 rounded-full transition ${
          active ? 'bg-slate-900' : 'bg-transparent'
        }`}
      />
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
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:bg-slate-100 sm:h-9 sm:w-9"
        aria-label="Menü"
      >
        <Icon name="more" size={18} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 sm:bg-transparent"
            onClick={() => setOpen(false)}
          />
          {/* Handy: Bottom-Sheet mit großen Zielen. Ab sm: Dropdown wie bisher. */}
          <div
            className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white pt-2 shadow-sheet sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-11 sm:w-60 sm:rounded-xl sm:border sm:pt-1 sm:shadow-lg"
            style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-slate-200 sm:hidden" />
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
              label="Als CSV exportieren"
              onClick={() => {
                exportCSV(store.transactions)
                setOpen(false)
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
      className={`flex min-h-touch w-full items-center gap-3 px-4 py-3 text-left text-base transition hover:bg-slate-50 active:bg-slate-100 sm:py-2.5 sm:text-sm ${
        danger ? 'text-rose-600' : 'text-slate-700'
      }`}
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  )
}
