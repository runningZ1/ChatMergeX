import { useEffect, useState } from 'react'
import { useDatabaseStore } from '@/store/database-store'
import { database } from '@/lib/database'

export interface DatabaseInitResult {
  isInitialized: boolean
  isInitializing: boolean
  error?: string
  retry: () => void
}

export function useDatabaseInit(): DatabaseInitResult {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const { loadConversations, loadFolders, loadDatabaseStats, clearError } = useDatabaseStore()

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setError(undefined)
    clearError()

    try {
      // 测试数据库连接
      const db = database.getDB()
      await db.open()

      // 加载初始数据
      await Promise.all([
        loadConversations(),
        loadFolders(),
        loadDatabaseStats()
      ])

      setIsInitialized(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize database'
      setError(errorMessage)
      console.error('Database initialization failed:', err)
    } finally {
      setIsInitializing(false)
    }
  }

  const retry = () => {
    initializeDatabase()
  }

  useEffect(() => {
    initializeDatabase()
  }, [])

  return {
    isInitialized,
    isInitializing,
    error,
    retry
  }
}