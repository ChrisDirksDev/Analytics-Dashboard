import React from 'react'
import { MLInsight } from '../types'
import { Card } from './Card'
import clsx from 'clsx'

interface MLInsightCardProps {
  insight: MLInsight
  className?: string
}

export const MLInsightCard: React.FC<MLInsightCardProps> = ({ insight, className }) => {
  const typeColors = {
    prediction: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    anomaly: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    trend: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  }

  const typeIcons = {
    prediction: '🔮',
    anomaly: '⚠️',
    trend: '📈',
  }

  return (
    <Card className={className}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{typeIcons[insight.type]}</span>
            <span
              className={clsx(
                'px-2 py-1 rounded-md text-xs font-medium',
                typeColors[insight.type]
              )}
            >
              {insight.type.toUpperCase()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(insight.confidence * 100)}% confidence
            </span>
          </div>
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {insight.title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {insight.description}
        </p>
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(insight.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  )
}

