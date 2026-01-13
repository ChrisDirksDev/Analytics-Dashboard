import { useState, useEffect } from 'react'
import { MLInsight } from '../types'
import { mlApi } from '../services/api'

export const useMLInsights = () => {
  const [insights, setInsights] = useState<MLInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true)
        const data = await mlApi.getInsights()
        setInsights(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch ML insights'))
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()

    // Refresh insights every 30 seconds
    const interval = setInterval(fetchInsights, 30000)

    return () => clearInterval(interval)
  }, [])

  return { insights, loading, error, refetch: () => {
    setLoading(true)
    mlApi.getInsights()
      .then(data => {
        setInsights(data)
        setError(null)
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error('Failed to fetch ML insights'))
      })
      .finally(() => setLoading(false))
  } }
}

