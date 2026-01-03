'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseDataRefreshOptions {
  interval?: number // Auto-refresh interval in ms
  onError?: (error: Error) => void
}

export function useDataRefresh<T>(
  fetchFn: () => Promise<T>,
  options: UseDataRefreshOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      
      if (mountedRef.current) {
        setData(result)
        setLastUpdated(new Date())
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options.onError?.(error)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [fetchFn, options])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  // Auto-refresh setup
  useEffect(() => {
    if (options.interval && options.interval > 0) {
      intervalRef.current = setInterval(refresh, options.interval)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [refresh, options.interval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    isStale: lastUpdated ? Date.now() - lastUpdated.getTime() > (options.interval || 300000) : false
  }
}

export function useOptimisticUpdate<T>(
  data: T | null,
  updateFn: (newData: T) => Promise<T>
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(data)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setOptimisticData(data)
  }, [data])

  const update = useCallback(async (newData: T) => {
    setIsUpdating(true)
    setOptimisticData(newData) // Optimistic update

    try {
      const result = await updateFn(newData)
      setOptimisticData(result) // Update with server response
      return result
    } catch (error) {
      setOptimisticData(data) // Revert on error
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [data, updateFn])

  return {
    data: optimisticData,
    isUpdating,
    update
  }
}