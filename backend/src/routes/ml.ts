import { Router, Request, Response } from 'express'
import axios from 'axios'
import { query } from '../database/connection'

export const mlRouter = Router()

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

// Get ML insights
mlRouter.get('/insights', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM ml_insights ORDER BY timestamp DESC LIMIT 20'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching ML insights:', error)
    res.status(500).json({ error: 'Failed to fetch ML insights' })
  }
})

// Get predictions
mlRouter.post('/predict', async (req: Request, res: Response) => {
  try {
    const { metricIds } = req.body

    if (!metricIds || !Array.isArray(metricIds)) {
      return res.status(400).json({ error: 'metricIds array is required' })
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
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, {
        metrics: metricsResult.rows.map((m: any) => ({ id: m.id, value: m.value })),
      })

      res.json(mlResponse.data)
    } catch (mlError: any) {
      // Fallback to mock predictions if ML service is unavailable
      console.warn('ML service unavailable, using mock predictions:', mlError.message)
      const mockPredictions = metricsResult.rows.map((metric: any) => ({
        metricId: metric.id,
        currentValue: metric.value,
        predictedValue: metric.value * (1 + (Math.random() * 0.2 - 0.1)), // ±10% variation
        confidence: 0.75 + Math.random() * 0.2,
        timeframe: '7 days',
      }))
      res.json(mockPredictions)
    }
  } catch (error) {
    console.error('Error getting predictions:', error)
    res.status(500).json({ error: 'Failed to get predictions' })
  }
})

// Anomaly detection
mlRouter.post('/anomaly-detection', async (req: Request, res: Response) => {
  try {
    const { data } = req.body

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'data array is required' })
    }

    // Call Python ML service
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/detect-anomalies`, {
        data,
      })

      res.json(mlResponse.data)
    } catch (mlError: any) {
      // Fallback to mock anomaly detection
      console.warn('ML service unavailable, using mock anomaly detection:', mlError.message)
      const mean = data.reduce((a: number, b: number) => a + b, 0) / data.length
      const std = Math.sqrt(
        data.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / data.length
      )
      
      const anomalies = data
        .map((value: number, index: number) => {
          const zScore = Math.abs((value - mean) / std)
          if (zScore > 2) {
            return {
              id: `anomaly-${index}`,
              index,
              value,
              expectedValue: mean,
              severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low',
            }
          }
          return null
        })
        .filter((a: any) => a !== null)

      res.json(anomalies)
    }
  } catch (error) {
    console.error('Error detecting anomalies:', error)
    res.status(500).json({ error: 'Failed to detect anomalies' })
  }
})

