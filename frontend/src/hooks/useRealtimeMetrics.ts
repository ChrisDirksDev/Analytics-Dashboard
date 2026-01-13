import { useState, useEffect } from 'react'
import { Metric } from '../types'
import { metricsApi } from '../services/api'
import { wsService } from '../services/websocket'

export const useRealtimeMetrics = () => {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

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

    // Set up WebSocket connection
    wsService.connect()

    // Subscribe to real-time updates
    const unsubscribe = wsService.on('metric-update', (updatedMetric: Metric) => {
      setMetrics(prev => {
        const index = prev.findIndex(m => m.id === updatedMetric.id)
        if (index >= 0) {
          // Update existing metric
          const newMetrics = [...prev]
          newMetrics[index] = updatedMetric
          return newMetrics
        } else {
          // Add new metric
          return [...prev, updatedMetric]
        }
      })
    })

    // Cleanup
    return () => {
      unsubscribe()
      wsService.disconnect()
    }
  }, [])

  return { metrics, loading, error }
}

