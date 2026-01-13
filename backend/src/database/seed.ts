import { query } from './connection'
import { v4 as uuidv4 } from 'uuid'

async function seed() {
  try {
    console.log('🌱 Seeding database...')

    // Clear existing data
    await query('TRUNCATE TABLE metrics, ml_insights, anomalies, predictions RESTART IDENTITY CASCADE')

    // Seed metrics
    const metrics = [
      { name: 'Total Revenue', value: 125000, unit: 'USD', change: 12.5, trend: 'up' },
      { name: 'Active Users', value: 15420, unit: 'users', change: 8.3, trend: 'up' },
      { name: 'Conversion Rate', value: 3.45, unit: '%', change: -2.1, trend: 'down' },
      { name: 'Average Order Value', value: 89.50, unit: 'USD', change: 5.7, trend: 'up' },
      { name: 'Page Views', value: 245000, unit: 'views', change: 15.2, trend: 'up' },
      { name: 'Bounce Rate', value: 32.1, unit: '%', change: -4.3, trend: 'down' },
    ]

    for (const metric of metrics) {
      const id = uuidv4()
      await query(
        `INSERT INTO metrics (id, name, value, unit, change, trend, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [id, metric.name, metric.value, metric.unit, metric.change, metric.trend]
      )
    }

    // Seed ML insights
    const insights = [
      {
        type: 'prediction',
        title: 'Revenue Growth Forecast',
        description: 'Based on current trends, revenue is expected to increase by 15% over the next quarter.',
        confidence: 0.87,
      },
      {
        type: 'anomaly',
        title: 'Unusual Traffic Spike Detected',
        description: 'Detected an unexpected 45% increase in page views during off-peak hours.',
        confidence: 0.92,
      },
      {
        type: 'trend',
        title: 'User Engagement Rising',
        description: 'User engagement metrics show a consistent upward trend over the past 30 days.',
        confidence: 0.78,
      },
    ]

    for (const insight of insights) {
      const id = uuidv4()
      await query(
        `INSERT INTO ml_insights (id, type, title, description, confidence, timestamp)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [id, insight.type, insight.title, insight.description, insight.confidence]
      )
    }

    console.log('✅ Database seeded successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()

