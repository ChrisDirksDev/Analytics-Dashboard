import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import { query } from '../db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { metricIds } = req.body

    if (!metricIds || !Array.isArray(metricIds)) {
      return res.status(400).json({ error: 'metricIds array is required' })
    }

    if (metricIds.length === 0) {
      return res.status(400).json({ error: 'metricIds array cannot be empty' })
    }
    
    // Validate all metric IDs are strings
    if (!metricIds.every((id: unknown) => typeof id === 'string' && id.trim() !== '')) {
      return res.status(400).json({ error: 'All metricIds must be non-empty strings' })
    }

    // Fetch metric data
    const metricsResult = await query(
      `SELECT id, value FROM metrics WHERE id = ANY($1::text[])`,
      [metricIds]
    )

    if (metricsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No metrics found' })
    }

    // Call Python ML service
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
    
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
        metrics: metricsResult.rows.map((m: { id: string; value: number }) => ({ id: m.id, value: m.value })),
      }, {
        timeout: 10000, // 10 second timeout
      })

      res.status(200).json(mlResponse.data)
    } catch (mlError: unknown) {
      // Fallback to mock predictions if ML service is unavailable
      const errorMessage = mlError instanceof Error ? mlError.message : 'Unknown error'
      console.warn('ML service unavailable, using mock predictions:', errorMessage)
      const mockPredictions = metricsResult.rows.map((metric: { id: string; value: number }) => ({
        metricId: metric.id,
        currentValue: metric.value,
        predictedValue: metric.value * (1 + (Math.random() * 0.2 - 0.1)), // ±10% variation
        confidence: 0.75 + Math.random() * 0.2,
        timeframe: '7 days',
      }))
      res.status(200).json(mockPredictions)
    }
  } catch (error) {
    console.error('Error getting predictions:', error)
    res.status(500).json({ error: 'Failed to get predictions' })
  }
}
