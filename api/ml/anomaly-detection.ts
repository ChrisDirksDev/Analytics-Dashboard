import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

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
    const { data } = req.body

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'data array is required' })
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'data array cannot be empty' })
    }

    // Call Python ML service
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
    
    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/detect-anomalies`, {
        data,
      }, {
        timeout: 10000, // 10 second timeout
      })

      res.status(200).json(mlResponse.data)
    } catch (mlError: unknown) {
      // Fallback to mock anomaly detection
      const errorMessage = mlError instanceof Error ? mlError.message : 'Unknown error'
      console.warn('ML service unavailable, using mock anomaly detection:', errorMessage)
      
      const mean = data.reduce((a: number, b: number) => a + b, 0) / data.length
      const variance = data.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / data.length
      const std = Math.sqrt(variance)
      
      // Handle edge case where all values are identical (std === 0)
      if (std === 0) {
        // If all values are the same, there are no anomalies
        return res.status(200).json([])
      }
      
      const anomalies = data
        .map((value: number, index: number) => {
          const zScore = Math.abs((value - mean) / std)
          if (zScore > 2) {
            return {
              id: `anomaly-${index}`,
              metricId: `metric-${index}`, // Match Anomaly type interface
              value,
              expectedValue: mean,
              severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low',
              timestamp: new Date().toISOString(), // Match Anomaly type interface
            }
          }
          return null
        })
        .filter((a): a is NonNullable<typeof a> => a !== null)

      res.status(200).json(anomalies)
    }
  } catch (error) {
    console.error('Error detecting anomalies:', error)
    res.status(500).json({ error: 'Failed to detect anomalies' })
  }
}
