import { Router, Request, Response } from 'express'
import { query } from '../database/connection'

export const metricsRouter = Router()

// Get all metrics
metricsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 100'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching metrics:', error)
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
})

// Get metric by ID
metricsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await query('SELECT * FROM metrics WHERE id = $1', [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Metric not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching metric:', error)
    res.status(500).json({ error: 'Failed to fetch metric' })
  }
})

// Update metric value (for real-time updates)
metricsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { value, change, trend } = req.body
    
    await query(
      `UPDATE metrics 
       SET value = $1, change = $2, trend = $3, updated_at = NOW(), timestamp = NOW()
       WHERE id = $4`,
      [value, change, trend, id]
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating metric:', error)
    res.status(500).json({ error: 'Failed to update metric' })
  }
})

