import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { friendlyError } from './errors'
import { todayISO } from './format'
import type { Category, Job, JobInput, Transaction, TransactionInput } from './types'

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
  addCategory: (name: string, kind: Category['kind']) => Promise<void>
  addJob: (input: JobInput) => Promise<void>
  updateJob: (id: string, input: JobInput) => Promise<void>
  finishJob: (id: string) => Promise<void>
  deleteJob: (id: string) => Promise<void>
}

export function useStore(userId: string | null): Store {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [jobs, setJobs] = useState<Job[]>([])

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const [tx, cat, jb] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name, kind'),
      supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    ])
    if (tx.error) setError(friendlyError(tx.error.message))
    else setTransactions(tx.data as Transaction[])
    if (!cat.error && cat.data) setCategories(cat.data as Category[])
    if (!jb.error && jb.data) setJobs(jb.data as Job[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (userId) reload()
    else {
      setTransactions([])
      setCategories([])
      setJobs([])
      setLoading(false)
    }
  }, [userId, reload])

  const addTransaction = useCallback(async (input: TransactionInput) => {
    const { error } = await supabase.from('transactions').insert(input)
    if (error) throw new Error(friendlyError(error.message))
    await reload()
  }, [reload])

  const updateTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      const { error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
      if (error) throw new Error(friendlyError(error.message))
      await reload()
    },
    [reload],
  )

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw new Error(friendlyError(error.message))
    await reload()
  }, [reload])

  const addCategory = useCallback(
    async (name: string, kind: Category['kind']) => {
      const clean = name.trim()
      if (!clean) return
      const { error } = await supabase
        .from('categories')
        .insert({ name: clean, kind })
      // 23505 = unique violation → Kategorie existiert schon, ignorieren
      if (error && error.code !== '23505') throw new Error(friendlyError(error.message))
      await reload()
    },
    [reload],
  )

  const addJob = useCallback(async (input: JobInput) => {
    const { error } = await supabase
      .from('jobs')
      .insert({ ...input, start_date: todayISO() })
    if (error) throw new Error(friendlyError(error.message))
    await reload()
  }, [reload])

  const updateJob = useCallback(
    async (id: string, input: JobInput) => {
      const { error } = await supabase.from('jobs').update(input).eq('id', id)
      if (error) throw new Error(friendlyError(error.message))
      await reload()
    },
    [reload],
  )

  const finishJob = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('jobs')
      .update({ end_date: todayISO() })
      .eq('id', id)
    if (error) throw new Error(friendlyError(error.message))
    await reload()
  }, [reload])

  const deleteJob = useCallback(async (id: string) => {
    // Zugehörige Buchungen werden per DB-Cascade mitgelöscht.
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) throw new Error(friendlyError(error.message))
    await reload()
  }, [reload])

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
    addCategory,
    addJob,
    updateJob,
    finishJob,
    deleteJob,
  }
}
