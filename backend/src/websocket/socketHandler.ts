import { Server } from 'socket.io'
import { query } from '../database/connection'
import cron from 'node-cron'

// Store connected clients
const connectedClients = new Set<string>()

export function setupWebSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)
    connectedClients.add(socket.id)

    // Send initial metrics
    sendMetricsUpdate(io)

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
      connectedClients.delete(socket.id)
    })

    // Handle client requests
    socket.on('request-metrics', () => {
      sendMetricsUpdate(io)
    })
  })

  // Schedule periodic metric updates (every 5 seconds)
  cron.schedule('*/5 * * * * *', () => {
    if (connectedClients.size > 0) {
      updateMetricsAndBroadcast(io)
    }
  })
}

async function sendMetricsUpdate(io: Server) {
  try {
    const result = await query(
      'SELECT * FROM metrics ORDER BY timestamp DESC'
    )
    io.emit('metrics-update', result.rows)
  } catch (error) {
    console.error('Error sending metrics update:', error)
  }
}

async function updateMetricsAndBroadcast(io: Server) {
  try {
    // Get all metrics
    const result = await query('SELECT * FROM metrics')
    const metrics = result.rows

    // Simulate real-time updates with small random variations
    for (const metric of metrics) {
      const variation = (Math.random() - 0.5) * 0.02 // ±1% variation
      const newValue = metric.value * (1 + variation)
      const change = (newValue - metric.value) / metric.value * 100
      const trend = change > 1 ? 'up' : change < -1 ? 'down' : 'stable'

      // Update in database
      await query(
        `UPDATE metrics 
         SET value = $1, change = $2, trend = $3, updated_at = NOW(), timestamp = NOW()
         WHERE id = $4`,
        [newValue, change, trend, metric.id]
      )

      // Broadcast individual metric update
      io.emit('metric-update', {
        ...metric,
        value: newValue,
        change,
        trend,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Error updating metrics:', error)
  }
}

