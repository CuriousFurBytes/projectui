import type { Direction } from '@/types/component';

/** Minimum character width per column before we prefer stacking over side-by-side. */
export const MIN_COLUMN_WIDTH = 10;

/**
 * Decides whether grouped items should sit side-by-side (row = columns) or
 * stacked (column = rows) based on available parent width.
 * Returns 'row' when each child would be at least MIN_COLUMN_WIDTH chars wide.
 */
export function preferredGroupDirection(
  parentWidth: number,
  childCount: number,
): Direction {
  if (childCount <= 0) return 'column';
  return Math.floor(parentWidth / childCount) >= MIN_COLUMN_WIDTH ? 'row' : 'column';
}
