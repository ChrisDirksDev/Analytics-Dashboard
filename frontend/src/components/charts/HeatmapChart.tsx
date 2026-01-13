import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'

interface HeatmapChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[][]
    }[]
  }
  title?: string
  height?: number
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, title, height = 300 }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Simple heatmap implementation using CSS
  const maxValue = Math.max(...data.datasets[0].data.flat())
  const minValue = Math.min(...data.datasets[0].data.flat())
  const range = maxValue - minValue || 1

  const getColor = (value: number) => {
    const normalized = (value - minValue) / range
    if (isDark) {
      // Dark theme: blue to cyan gradient
      const r = Math.floor(96 + (159 - 96) * normalized)
      const g = Math.floor(165 + (200 - 165) * normalized)
      const b = Math.floor(250 + (255 - 250) * normalized)
      return `rgb(${r}, ${g}, ${b})`
    } else {
      // Light theme: light blue to dark blue
      const r = Math.floor(219 - (219 - 59) * normalized)
      const g = Math.floor(234 - (234 - 130) * normalized)
      const b = Math.floor(254 - (254 - 246) * normalized)
      return `rgb(${r}, ${g}, ${b})`
    }
  }

  return (
    <div className="space-y-4" style={{ height: `${height}px`, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
          {title}
        </h3>
      )}
      <div className="overflow-auto flex-1 min-h-0" style={{ width: '100%', maxWidth: '100%' }}>
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className="p-2 text-xs text-gray-600 dark:text-gray-400"></th>
              {data.labels.map((label, idx) => (
                <th
                  key={idx}
                  className="p-2 text-xs text-gray-600 dark:text-gray-400 font-medium"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.datasets[0].data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="p-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {data.datasets[0].label} {rowIdx + 1}
                </td>
                {row.map((value, colIdx) => (
                  <td
                    key={colIdx}
                    className="p-2 text-center text-xs font-medium text-gray-900 dark:text-gray-100"
                    style={{
                      backgroundColor: getColor(value),
                    }}
                    title={`Value: ${value.toFixed(2)}`}
                  >
                    {value.toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

