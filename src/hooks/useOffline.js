import { useState, useEffect } from 'react'
import { isOnline, getPendingCount, syncOfflineData } from '../services/offlineService'
import * as apis from '../services/api'

export const useOffline = () => {
  const [online, setOnline] = useState(isOnline())
  const [pendingCount, setPendingCount] = useState(getPendingCount())
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      // Tentar sincronizar automaticamente quando voltar online
      if (getPendingCount() > 0) {
        handleSync()
      }
    }

    const handleOffline = () => {
      setOnline(false)
    }

    // Atualizar contador periodicamente
    const interval = setInterval(() => {
      setPendingCount(getPendingCount())
    }, 2000)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const handleSync = async () => {
    if (!isOnline() || syncing) return

    setSyncing(true)
    try {
      const result = await syncOfflineData(apis)
      setPendingCount(getPendingCount())
      return result
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      return { success: false, message: error.message }
    } finally {
      setSyncing(false)
    }
  }

  return {
    online,
    pendingCount,
    syncing,
    sync: handleSync,
  }
}

