import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Category, Transaction, TransactionInput } from './types'

export interface Store {
  loading: boolean
  error: string | null
  transactions: Transaction[]
  categories: Category[]
  reload: () => Promise<void>
  addTransaction: (input: TransactionInput) => Promise<void>
  updateTransaction: (id: string, input: TransactionInput) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addCategory: (name: string, kind: Category['kind']) => Promise<void>
  importJSON: (rows: TransactionInput[]) => Promise<number>
}

export function useStore(userId: string | null): Store {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const [tx, cat] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name, kind'),
    ])
    if (tx.error) setError(tx.error.message)
    else setTransactions(tx.data as Transaction[])
    if (!cat.error && cat.data) setCategories(cat.data as Category[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (userId) reload()
    else {
      setTransactions([])
      setCategories([])
      setLoading(false)
    }
  }, [userId, reload])

  const addTransaction = useCallback(async (input: TransactionInput) => {
    const { error } = await supabase.from('transactions').insert(input)
    if (error) throw new Error(error.message)
    await reload()
  }, [reload])

  const updateTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      const { error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
      if (error) throw new Error(error.message)
      await reload()
    },
    [reload],
  )

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw new Error(error.message)
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
      if (error && error.code !== '23505') throw new Error(error.message)
      await reload()
    },
    [reload],
  )

  const importJSON = useCallback(
    async (rows: TransactionInput[]) => {
      if (rows.length === 0) return 0
      const { error } = await supabase.from('transactions').insert(rows)
      if (error) throw new Error(error.message)
      await reload()
      return rows.length
    },
    [reload],
  )

  return {
    loading,
    error,
    transactions,
    categories,
    reload,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    importJSON,
  }
}
