import { getAnimatedColors } from '@/lib/colorAnimation';
import type { Rect } from '@/renderer/render';
import type { AnsiColor, ComponentNode, ComponentType } from '@/types/component';

const TEXT_ANIMATED_TYPES = new Set<ComponentType>(['text', 'asciitext', 'progressbar']);

function hasUsableBorder(node: ComponentNode, rect: Rect): boolean {
  return !!node.props.border && node.props.border !== 'none' && rect.w >= 2 && rect.h >= 2;
}

function makePerimeterCells(rect: Rect): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  const left = rect.x;
  const right = rect.x + rect.w - 1;
  const top = rect.y;
  const bottom = rect.y + rect.h - 1;

  for (let col = left; col <= right; col++) cells.push({ row: top, col });
  for (let row = top + 1; row < bottom; row++) cells.push({ row, col: right });
  for (let col = right; col >= left; col--) cells.push({ row: bottom, col });
  for (let row = bottom - 1; row > top; row--) cells.push({ row, col: left });

  return cells;
}

function makeTitleCells(node: ComponentNode, rect: Rect): Array<{ row: number; col: number }> {
  if (!node.props.title) return [];
  const title = ` ${node.props.title.trim()} `.slice(0, rect.w - 2);
  const align = node.props.titleAlign ?? 'left';
  let startCol = rect.x + 1;
  if (align === 'center') startCol = rect.x + 1 + Math.floor((rect.w - 2 - title.length) / 2);
  else if (align === 'right') startCol = rect.x + rect.w - 1 - title.length;
  return Array.from({ length: title.length }, (_, i) => ({ row: rect.y, col: startCol + i }));
}

function applyAnimationToCells(
  overlay: Map<string, AnsiColor>,
  cells: Array<{ row: number; col: number }>,
  elapsedMs: number,
  animation: ComponentNode['props']['animation'],
) {
  if (!animation?.enabled || cells.length === 0) return;
  const durationMs = Math.max(100, animation.durationMs || 1500);
  const cycleCount = Math.floor(elapsedMs / durationMs);
  if (!animation.loop && animation.loopCount != null && cycleCount >= animation.loopCount) return;
  const tick = (elapsedMs % durationMs) / durationMs;
  const colors = getAnimatedColors(animation, cells.length, tick);
  cells.forEach((cell, i) => {
    const color = colors[i];
    if (!color || color === 'default') return;
    overlay.set(`${cell.row},${cell.col}`, color);
  });
}

export function hasNodeAnimationEnabled(node: ComponentNode): boolean {
  return !!(
    (node.props.animation?.enabled && TEXT_ANIMATED_TYPES.has(node.type)) ||
    node.props.borderAnimation?.enabled ||
    node.props.borderTitleAnimation?.enabled
  );
}

export function buildAnimationOverlay(
  components: Record<string, ComponentNode>,
  rects: Record<string, Rect>,
  elapsedMs: number,
): Map<string, AnsiColor> {
  const overlay = new Map<string, AnsiColor>();
  Object.values(components).forEach((node) => {
    const rect = rects[node.id];
    if (!rect) return;

    if (node.props.animation?.enabled && TEXT_ANIMATED_TYPES.has(node.type)) {
      const textCells: Array<{ row: number; col: number }> = [];
      for (let row = rect.y; row < rect.y + rect.h; row++) {
        for (let col = rect.x; col < rect.x + rect.w; col++) textCells.push({ row, col });
      }
      applyAnimationToCells(overlay, textCells, elapsedMs, node.props.animation);
    }

    if (hasUsableBorder(node, rect)) {
      applyAnimationToCells(overlay, makePerimeterCells(rect), elapsedMs, node.props.borderAnimation);
      applyAnimationToCells(overlay, makeTitleCells(node, rect), elapsedMs, node.props.borderTitleAnimation);
    }
  });
  return overlay;
}
