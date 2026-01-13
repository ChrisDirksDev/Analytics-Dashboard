import React, { ReactNode, useMemo } from 'react'
import { useDrag } from 'react-dnd'
import { Widget } from '../types'
import { GRID_COLUMNS } from '../constants/grid'
import { isValidPosition, clampPosition } from '../utils/gridUtils'

interface DraggableWidgetProps {
  widget: Widget
  children: ReactNode
  onRemove?: (id: string) => void
}

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  widget,
  children,
  onRemove,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: widget,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  // Validate and clamp position to ensure it's within grid bounds
  const validPosition = useMemo(() => {
    if (!isValidPosition(widget.position, widget.size, GRID_COLUMNS)) {
      console.warn(
        `Widget ${widget.id} has invalid position:`,
        widget.position,
        'Size:',
        widget.size
      )
      // Clamp to valid position as fallback
      return clampPosition(widget.position, widget.size, GRID_COLUMNS)
    }
    return widget.position
  }, [widget.id, widget.position, widget.size])

  // Calculate grid styles with validated position
  const gridStyles = useMemo(() => {
    const gridColumnStart = validPosition.x + 1
    const gridColumnEnd = validPosition.x + widget.size.width + 1
    const gridRowStart = validPosition.y + 1

    // Ensure grid column end doesn't exceed grid columns
    const clampedColumnEnd = Math.min(gridColumnEnd, GRID_COLUMNS + 1)

    return {
      gridColumn: `${gridColumnStart} / ${clampedColumnEnd}`,
      gridRow: `${gridRowStart} / span ${widget.size.height}`,
    }
  }, [validPosition, widget.size])

  return (
    <div
      ref={drag}
      className={`relative group ${isDragging ? 'opacity-50' : 'opacity-100'} transition-opacity cursor-move h-full`}
      style={gridStyles}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(widget.id)
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-red-500 text-white text-xs z-10"
          aria-label="Remove widget"
        >
          ×
        </button>
      )}
    </div>
  )
}

