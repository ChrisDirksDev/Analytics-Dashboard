import React, { ReactNode } from 'react'
import { useDrop } from 'react-dnd'
import { Widget } from '../types'
import { GRID_COLUMNS, GRID_GAP } from '../constants/grid'
import { clampPosition } from '../utils/gridUtils'

interface DroppableAreaProps {
  children: ReactNode
  onDrop: (widget: Widget, position: { x: number; y: number }) => void
}

interface GridMeasurements {
  gridRect: DOMRect
  columnWidth: number
  rowHeight: number
  gap: number
  gridCols: number
}

// Helper function to get actual grid measurements with error handling
const getGridMeasurements = (): GridMeasurements | null => {
  try {
    const dashboardContent = document.getElementById('dashboard-content')
    if (!dashboardContent) {
      console.warn('Dashboard content element not found')
      return null
    }

    const gridContainer = dashboardContent.querySelector('.grid') as HTMLElement
    if (!gridContainer) {
      console.warn('Grid container element not found')
      return null
    }

    const gridRect = gridContainer.getBoundingClientRect()
    if (gridRect.width === 0 || gridRect.height === 0) {
      console.warn('Grid container has zero dimensions')
      return null
    }

    const computedStyle = window.getComputedStyle(gridContainer)
    const gap = parseFloat(computedStyle.gap) || GRID_GAP
    const gridCols = GRID_COLUMNS
    
    // Calculate column width from grid container
    const containerWidth = gridRect.width
    const totalGapWidth = gap * (gridCols - 1)
    let columnWidth = (containerWidth - totalGapWidth) / gridCols
    
    // Default row height (based on typical widget height)
    let rowHeight = 150
    
    // Try to measure actual dimensions from existing widget if available
    try {
      const existingWidget = gridContainer.querySelector('[style*="grid-row-start"]') as HTMLElement
      if (existingWidget) {
        const widgetRect = existingWidget.getBoundingClientRect()
        const widgetStyle = window.getComputedStyle(existingWidget)
        
        const gridRowStart = parseInt(widgetStyle.gridRowStart, 10) - 1
        const gridRowEnd = parseInt(widgetStyle.gridRowEnd, 10) - 1
        const gridColStart = parseInt(widgetStyle.gridColumnStart, 10) - 1
        const gridColEnd = parseInt(widgetStyle.gridColumnEnd, 10) - 1
        
        const widgetRowSpan = gridRowEnd - gridRowStart
        const widgetColSpan = gridColEnd - gridColStart
        
        if (widgetRowSpan > 0 && widgetRect.height > 0) {
          rowHeight = (widgetRect.height + gap * (widgetRowSpan - 1)) / widgetRowSpan
        }
        
        if (widgetColSpan > 0 && widgetRect.width > 0) {
          columnWidth = (widgetRect.width + gap * (widgetColSpan - 1)) / widgetColSpan
        }
      }
    } catch (measurementError) {
      // Fall back to calculated values if measurement fails
      console.warn('Failed to measure existing widget, using defaults', measurementError)
    }
    
    // Ensure minimum valid dimensions
    if (columnWidth <= 0) columnWidth = containerWidth / gridCols
    if (rowHeight <= 0) rowHeight = 150
    
    return { gridRect, columnWidth, rowHeight, gap, gridCols }
  } catch (error) {
    console.error('Error getting grid measurements:', error)
    return null
  }
}

// Helper function to calculate grid position from client offset
const calculateGridPosition = (
  clientOffset: { x: number; y: number },
  item: Widget
): { x: number; y: number } | null => {
  const measurements = getGridMeasurements()
  if (!measurements) {
    return null
  }

  const { gridRect, columnWidth, rowHeight, gap, gridCols } = measurements
  
  // Calculate position relative to the grid container
  const relativeX = clientOffset.x - gridRect.left
  const relativeY = clientOffset.y - gridRect.top
  
  // Ensure we're within the grid bounds
  if (relativeX < 0 || relativeY < 0) {
    return null
  }
  
  // Calculate which grid cell the drop point falls into
  const calculatedX = Math.floor((relativeX + gap / 2) / (columnWidth + gap))
  const calculatedY = Math.floor((relativeY + gap / 2) / (rowHeight + gap))
  
  const position = { x: calculatedX, y: calculatedY }
  
  // Clamp position to valid boundaries
  const clampedPosition = clampPosition(position, item.size, gridCols)
  
  return clampedPosition
}

export const DroppableArea: React.FC<DroppableAreaProps> = ({ children, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'widget',
    drop: (item: Widget, monitor) => {
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) {
        console.warn('No client offset available for drop')
        return
      }

      const position = calculateGridPosition(clientOffset, item)
      if (position) {
        onDrop(item, position)
      } else {
        console.warn('Failed to calculate valid grid position for drop')
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  return (
    <div
      ref={drop}
      className={`min-h-screen p-6 ${
        isOver && canDrop
          ? 'bg-primary-50 dark:bg-primary-900/10'
          : ''
      } transition-colors`}
    >
      {children}
    </div>
  )
}

