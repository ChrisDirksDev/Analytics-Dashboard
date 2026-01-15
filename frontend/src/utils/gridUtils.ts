import { Widget } from '../types';
import { GRID_COLUMNS } from '../constants/grid';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Validates if a position is within grid boundaries
 */
export const isValidPosition = (
  position: Position,
  size: Size,
  gridCols: number = GRID_COLUMNS
): boolean => {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + size.width <= gridCols &&
    size.width > 0 &&
    size.height > 0
  );
};

/**
 * Checks if a widget at a given position collides with other widgets
 */
export const hasCollision = (
  widget: Widget | { id: string; position: Position; size: Size },
  position: Position,
  allWidgets: Widget[],
  excludeId?: string
): boolean => {
  const widgetRight = position.x + widget.size.width;
  const widgetBottom = position.y + widget.size.height;

  return allWidgets.some((w) => {
    // Skip the widget being moved
    if (w.id === widget.id || w.id === excludeId) {
      return false;
    }

    const wRight = w.position.x + w.size.width;
    const wBottom = w.position.y + w.size.height;

    // Check for overlap
    return !(
      position.x >= wRight ||
      widgetRight <= w.position.x ||
      position.y >= wBottom ||
      widgetBottom <= w.position.y
    );
  });
};

/**
 * Clamps a position to valid grid boundaries
 */
export const clampPosition = (
  position: Position,
  size: Size,
  gridCols: number = GRID_COLUMNS
): Position => {
  const maxX = Math.max(0, gridCols - size.width);

  return {
    x: Math.max(0, Math.min(maxX, position.x)),
    y: Math.max(0, position.y),
  };
};

/**
 * Finds the next available position for a widget that doesn't collide with existing widgets
 */
export const findNextAvailablePosition = (
  widget: { size: Size },
  allWidgets: Widget[],
  gridCols: number = GRID_COLUMNS,
  startY: number = 0
): Position => {
  let y = startY;
  const maxIterations = 200; // Prevent infinite loops
  let iterations = 0;

  while (iterations < maxIterations) {
    for (let x = 0; x <= gridCols - widget.size.width; x++) {
      const position: Position = { x, y };
      
      if (!hasCollision(widget as Widget, position, allWidgets)) {
        return position;
      }
    }
    y++;
    iterations++;
  }

  // Fallback: return a position that won't cause crashes
  return { x: 0, y: allWidgets.length * 3 };
};

/**
 * Validates and adjusts a drop position to ensure it's valid and doesn't collide
 */
export const validateAndAdjustPosition = (
  widget: Widget,
  position: Position,
  allWidgets: Widget[]
): Position | null => {
  // First, clamp to valid boundaries
  const clampedPosition = clampPosition(position, widget.size);

  // Check if position is valid
  if (!isValidPosition(clampedPosition, widget.size)) {
    return null;
  }

  // Check for collisions
  if (hasCollision(widget, clampedPosition, allWidgets)) {
    // Try to find a nearby valid position
    const nearbyPositions = [
      { x: clampedPosition.x - 1, y: clampedPosition.y },
      { x: clampedPosition.x + 1, y: clampedPosition.y },
      { x: clampedPosition.x, y: clampedPosition.y - 1 },
      { x: clampedPosition.x, y: clampedPosition.y + 1 },
    ];

    for (const nearbyPos of nearbyPositions) {
      const clampedNearby = clampPosition(nearbyPos, widget.size);
      if (
        isValidPosition(clampedNearby, widget.size) &&
        !hasCollision(widget, clampedNearby, allWidgets)
      ) {
        return clampedNearby;
      }
    }

    // If no nearby position works, return null
    return null;
  }

  return clampedPosition;
};
