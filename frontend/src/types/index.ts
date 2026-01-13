// Core data types
export interface Metric {
  id: string
  name: string
  value: number
  unit: string
  change: number // percentage change
  trend: 'up' | 'down' | 'stable'
  timestamp: string
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
  }[]
}

export interface MLInsight {
  id: string
  type: 'prediction' | 'anomaly' | 'trend'
  title: string
  description: string
  confidence: number
  timestamp: string
  data?: any
}

export interface Anomaly {
  id: string
  metricId: string
  value: number
  expectedValue: number
  severity: 'low' | 'medium' | 'high'
  timestamp: string
}

export interface Prediction {
  metricId: string
  currentValue: number
  predictedValue: number
  confidence: number
  timeframe: string
}

export interface Widget {
  id: string
  type: 'metric' | 'chart' | 'ml-insight'
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  config: any
}

export interface DashboardLayout {
  widgets: Widget[]
}

export type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap'

export interface Theme {
  mode: 'light' | 'dark'
  primaryColor: string
  backgroundColor: string
  textColor: string
}

