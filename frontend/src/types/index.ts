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

export interface ScatterDataPoint {
  x: number
  y: number
}

export interface ScatterData {
  datasets: {
    label: string
    data: ScatterDataPoint[]
    backgroundColor?: string
  }[]
}

export interface HeatmapData {
  labels: string[]
  datasets: {
    label: string
    data: number[][]
  }[]
}

export interface MLInsight {
  id: string
  type: 'prediction' | 'anomaly' | 'trend'
  title: string
  description: string
  confidence: number
  timestamp: string
  data?: unknown
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

export type ChartConfigData = ChartData | ScatterData | HeatmapData

export type WidgetConfig =
  | { metricId: string } // for 'metric' type
  | { type: ChartType; data: ChartConfigData } // for 'chart' type
  | { insightId: string } // for 'ml-insight' type

export interface Widget {
  id: string
  type: 'metric' | 'chart' | 'ml-insight'
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  config: WidgetConfig
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

