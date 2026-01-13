import React from 'react'
import { Metric } from '../types'
import { Card } from './Card'
import clsx from 'clsx'

interface MetricCardProps {
  metric: Metric
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, className }) => {
  const trendIcon = {
    up: '↑',
    down: '↓',
    stable: '→',
  }

  const trendColor = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-600 dark:text-gray-400',
  }

  return (
    <Card className={className}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {metric.name}
          </h4>
          <span className={clsx('text-sm font-semibold', trendColor[metric.trend])}>
            {trendIcon[metric.trend]} {Math.abs(metric.change).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {metric.value.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {metric.unit}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Updated {new Date(metric.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </Card>
  )
}

