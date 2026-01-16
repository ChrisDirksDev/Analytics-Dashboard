import { useState, useEffect, useRef } from 'react'
import { Metric } from '../types'
import { metricsApi } from '../services/api'

export const useRealtimeMetrics = () => {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    // Initial fetch
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const data = await metricsApi.getAll()
        setMetrics(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch metrics'))
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()

    // Poll for updates every 5 seconds (replacing WebSocket)
    intervalRef.current = window.setInterval(() => {
      metricsApi.getAll()
        .then((data) => {
          setMetrics(data)
          setError(null)
        })
        .catch((err) => {
          // Silently log polling errors to avoid error state churn
          console.warn('Failed to fetch metrics update:', err)
        })
    }, 5000)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, []) // Run only once on mount

  return { metrics, loading, error }
}

