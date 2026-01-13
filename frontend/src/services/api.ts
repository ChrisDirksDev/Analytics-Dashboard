import axios from 'axios'
import { Metric, MLInsight, Prediction, Anomaly } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Metrics API
export const metricsApi = {
  getAll: async (): Promise<Metric[]> => {
    const response = await api.get('/metrics')
    return response.data
  },

  getById: async (id: string): Promise<Metric> => {
    const response = await api.get(`/metrics/${id}`)
    return response.data
  },
}

// ML Insights API
export const mlApi = {
  getInsights: async (): Promise<MLInsight[]> => {
    const response = await api.get('/ml/insights')
    return response.data
  },

  getPredictions: async (metricIds: string[]): Promise<Prediction[]> => {
    const response = await api.post('/ml/predict', { metricIds })
    return response.data
  },

  detectAnomalies: async (data: number[]): Promise<Anomaly[]> => {
    const response = await api.post('/ml/anomaly-detection', { data })
    return response.data
  },
}

export default api

