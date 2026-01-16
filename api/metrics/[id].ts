import type { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ error: 'Invalid metric ID' })
  }

  if (req.method === 'GET') {
    try {
      const result = await query('SELECT * FROM metrics WHERE id = $1', [id])
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Metric not found' })
      }
      
      res.status(200).json(result.rows[0])
    } catch (error) {
      console.error('Error fetching metric:', error)
      res.status(500).json({ error: 'Failed to fetch metric' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { value, change, trend } = req.body
      
      // Validate input types
      if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
        return res.status(400).json({ error: 'value must be a valid number' })
      }
      
      if (change !== undefined && (typeof change !== 'number' || isNaN(change))) {
        return res.status(400).json({ error: 'change must be a valid number' })
      }
      
      if (trend !== undefined && !['up', 'down', 'stable'].includes(trend)) {
        return res.status(400).json({ error: 'trend must be one of: up, down, stable' })
      }
      
      // Ensure at least one field is provided
      if (value === undefined && change === undefined && trend === undefined) {
        return res.status(400).json({ error: 'At least one field (value, change, trend) must be provided' })
      }
      
      await query(
        `UPDATE metrics 
         SET value = $1, change = $2, trend = $3, updated_at = NOW(), timestamp = NOW()
         WHERE id = $4`,
        [value, change, trend, id]
      )
      
      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error updating metric:', error)
      res.status(500).json({ error: 'Failed to update metric' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
