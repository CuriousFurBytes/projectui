import type { Size } from '@/types/component';

export function sizeToString(s: Size | undefined): string {
  if (s === undefined) return 'fill';
  if (typeof s === 'number') return String(s);
  return s; // 'fill', 'auto', or '50%'
}

export function stringToSize(s: string): Size {
  if (s === 'fill' || s === 'auto') return s;
  if (/^\d+(\.\d+)?%$/.test(s)) return s as `${number}%`;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 'auto';
}

/** Resolves a percentage Size to an absolute character count relative to parentSize.
 *  Returns null for non-percentage sizes (let the caller handle fill/number/auto). */
export function resolvePercentSize(size: Size, parentSize: number): number | null {
  if (typeof size === 'string' && size.endsWith('%')) {
    const pct = parseFloat(size) / 100;
    return Math.max(1, Math.round(pct * parentSize));
  }
  return null;
}
