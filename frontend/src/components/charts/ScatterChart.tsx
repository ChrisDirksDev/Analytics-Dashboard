import React from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import { useTheme } from '../../contexts/ThemeContext'

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ScatterDataPoint {
  x: number
  y: number
}

interface ScatterChartProps {
  data: {
    datasets: {
      label: string
      data: ScatterDataPoint[]
      backgroundColor?: string
    }[]
  }
  title?: string
  height?: number
}

export const ScatterChart: React.FC<ScatterChartProps> = ({ data, title, height = 300 }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const textColor = isDark ? '#f3f4f6' : '#111827'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || (isDark 
        ? 'rgba(96, 165, 250, 0.6)' 
        : 'rgba(59, 130, 246, 0.6)'),
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
        color: textColor,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Scatter data={chartData} options={options} />
    </div>
  )
}

