import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { friendlyError } from './errors'
import { todayISO } from './format'
import type { Category, Job, JobInput, Transaction, TransactionInput } from './types'

// Sicherheitsnetz, falls Realtime für die Tabellen nicht aktiv ist: solange
// die App im Vordergrund ist, wird in diesem Takt still nachgeladen.
const POLL_MS = 25_000

export interface Store {
  loading: boolean
  error: string | null
  transactions: Transaction[]
  categories: Category[]
  jobs: Job[]
  reload: () => Promise<void>
  addTransaction: (input: TransactionInput) => Promise<void>
  updateTransaction: (id: string, input: TransactionInput) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  togglePaid: (id: string, paid: boolean) => Promise<void>
  addCategory: (name: string, kind: Category['kind']) => Promise<void>
  addJob: (input: JobInput) => Promise<void>
  updateJob: (id: string, input: JobInput) => Promise<void>
  finishJob: (id: string) => Promise<void>
  reopenJob: (id: string) => Promise<void>
  deleteJob: (id: string) => Promise<void>
}

export function useStore(userId: string | null): Store {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [jobs, setJobs] = useState<Job[]>([])

  // Verhindert, dass sich mehrere Nachladevorgänge überholen
  const runningRef = useRef(false)

  /**
   * `silent` lädt im Hintergrund nach, ohne die Ansicht auf den
   * Ladeplatzhalter zurückzusetzen – sonst würde die Liste bei jedem
   * Speichern und bei jedem Live-Update kurz wegblitzen.
   */
  const load = useCallback(
    async (silent = false) => {
      if (!userId) return
      if (silent && runningRef.current) return
      runningRef.current = true
      if (!silent) setLoading(true)

      const [tx, cat, jb] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name, kind'),
        supabase.from('jobs').select('*').order('created_at', { ascending: false }),
      ])

      if (tx.error) {
        // Im Hintergrund (z. B. kurz offline) nicht die ganze Ansicht mit
        // einer Fehlermeldung überschreiben – der nächste Versuch kommt.
        if (!silent) setError(friendlyError(tx.error.message))
      } else {
        setError(null)
        setTransactions(tx.data as Transaction[])
      }
      if (!cat.error && cat.data) setCategories(cat.data as Category[])
      if (!jb.error && jb.data) setJobs(jb.data as Job[])

      if (!silent) setLoading(false)
      runningRef.current = false
    },
    [userId],
  )

  const reload = useCallback(() => load(false), [load])
  const refresh = useCallback(() => load(true), [load])

  useEffect(() => {
    if (userId) load(false)
    else {
      setTransactions([])
      setCategories([])
      setJobs([])
      setLoading(false)
    }
  }, [userId, load])

  // Live-Updates: Änderungen aus anderen Geräten/Tabs landen sofort hier.
  useEffect(() => {
    if (!userId) return

    let timer: ReturnType<typeof setTimeout> | null = null
    // Eine Änderung löst oft mehrere Ereignisse aus – kurz sammeln.
    const nachladen = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(refresh, 250)
    }

    const channel = supabase.channel('meister-kasse')
    for (const table of ['transactions', 'jobs', 'categories']) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        nachladen,
      )
    }
    channel.subscribe()

    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [userId, refresh])

  // Zusätzlich nachladen, sobald die App wieder in den Vordergrund kommt,
  // und in ruhigem Takt, solange sie sichtbar ist. Das greift auch dann,
  // wenn Realtime für die Tabellen nicht eingeschaltet ist.
  useEffect(() => {
    if (!userId) return

    const wennSichtbar = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', wennSichtbar)
    window.addEventListener('focus', wennSichtbar)
    window.addEventListener('online', refresh)
    const takt = setInterval(wennSichtbar, POLL_MS)

    return () => {
      document.removeEventListener('visibilitychange', wennSichtbar)
      window.removeEventListener('focus', wennSichtbar)
      window.removeEventListener('online', refresh)
      clearInterval(takt)
    }
  }, [userId, refresh])

  const addTransaction = useCallback(async (input: TransactionInput) => {
    const { error } = await supabase.from('transactions').insert(input)
    if (error) throw new Error(friendlyError(error.message))
    await refresh()
  }, [refresh])

  const updateTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      const { error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
      if (error) throw new Error(friendlyError(error.message))
      await refresh()
    },
    [refresh],
  )

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw new Error(friendlyError(error.message))
    await refresh()
  }, [refresh])

  const togglePaid = useCallback(async (id: string, paid: boolean) => {
    // Sofort umschalten, damit der Knopf ohne Verzögerung reagiert; die
    // Antwort vom Server korrigiert notfalls.
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, paid } : t)),
    )
    const { error } = await supabase.from('transactions').update({ paid }).eq('id', id)
    if (error) {
      await refresh()
      throw new Error(friendlyError(error.message))
    }
    await refresh()
  }, [refresh])

  const addCategory = useCallback(
    async (name: string, kind: Category['kind']) => {
      const clean = name.trim()
      if (!clean) return
      const { error } = await supabase
        .from('categories')
        .insert({ name: clean, kind })
      // 23505 = unique violation → Kategorie existiert schon, ignorieren
      if (error && error.code !== '23505') throw new Error(friendlyError(error.message))
      await refresh()
    },
    [refresh],
  )

  const addJob = useCallback(async (input: JobInput) => {
    const { error } = await supabase
      .from('jobs')
      .insert({ ...input, start_date: todayISO() })
    if (error) throw new Error(friendlyError(error.message))
    await refresh()
  }, [refresh])

  const updateJob = useCallback(
    async (id: string, input: JobInput) => {
      const { error } = await supabase.from('jobs').update(input).eq('id', id)
      if (error) throw new Error(friendlyError(error.message))
      await refresh()
    },
    [refresh],
  )

  const finishJob = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('jobs')
      .update({ end_date: todayISO() })
      .eq('id', id)
    if (error) throw new Error(friendlyError(error.message))
    await refresh()
  }, [refresh])

  const reopenJob = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('jobs')
      .update({ end_date: null })
      .eq('id', id)
    if (error) throw new Error(friendlyError(error.message))
    await refresh()
  }, [refresh])

  const deleteJob = useCallback(async (id: string) => {
    // Zugehörige Buchungen werden per DB-Cascade mitgelöscht.
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) throw new Error(friendlyError(error.message))
    await refresh()
  }, [refresh])

  return {
    loading,
    error,
    transactions,
    categories,
    jobs,
    reload,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    togglePaid,
    addCategory,
    addJob,
    updateJob,
    finishJob,
    reopenJob,
    deleteJob,
  }
}
