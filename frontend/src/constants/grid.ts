/**
 * Grid configuration constants for the dashboard layout
 */

export const GRID_COLUMNS = 8;
export const GRID_GAP = 16; // pixels

export interface GridConfig {
  columns: number;
  gap: number;
}

export const GRID_CONFIG: GridConfig = {
  columns: GRID_COLUMNS,
  gap: GRID_GAP,
};
