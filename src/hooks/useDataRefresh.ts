'use client'

import { useCallback, useRef } from 'react'

// Type pour les fonctions de refresh
type RefreshFunction = () => Promise<void> | void

interface UseDataRefreshOptions {
  onRefresh: RefreshFunction
  debounceMs?: number
}

export function useDataRefresh({ onRefresh, debounceMs = 500 }: UseDataRefreshOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  const debouncedRefresh = useCallback(async () => {
    // Annuler le timeout précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Éviter les refreshs multiples simultanés
    if (isRefreshingRef.current) {
      return
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        isRefreshingRef.current = true
        await onRefresh()
      } catch (error) {
        console.error('Erreur lors de l\'actualisation:', error)
      } finally {
        isRefreshingRef.current = false
      }
    }, debounceMs)
  }, [onRefresh, debounceMs])

  const forceRefresh = useCallback(async () => {
    // Annuler tout timeout en attente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      isRefreshingRef.current = true
      await onRefresh()
    } catch (error) {
      console.error('Erreur lors de l\'actualisation forcée:', error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [onRefresh])

  return {
    debouncedRefresh,
    forceRefresh,
    isRefreshing: isRefreshingRef.current
  }
}
