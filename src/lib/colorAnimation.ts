import type { AnsiColor, ColorAnimation, AnimationDirection } from '@/types/component';

const DEFAULT_SOLID_COLOR: AnsiColor = 'brightCyan';
const DEFAULT_GRADIENT_TRAIL: AnsiColor[] = ['brightCyan', 'cyan', 'brightBlue', 'blue', 'brightBlack'];
const RAINBOW: AnsiColor[] = [
  'brightRed', 'brightYellow', 'brightGreen', 'brightCyan', 'brightBlue', 'brightMagenta',
];

function computeSolid(width: number, tick: number, direction: AnimationDirection, colors?: AnsiColor[]): AnsiColor[] {
  const solidColor = colors?.[0] ?? DEFAULT_SOLID_COLOR;
  const result: AnsiColor[] = new Array(width).fill('default') as AnsiColor[];

  if (direction === 'ltr') {
    result[Math.min(Math.floor(tick * width), width - 1)] = solidColor;
  } else if (direction === 'rtl') {
    result[Math.max(width - 1 - Math.floor(tick * width), 0)] = solidColor;
  } else if (direction === 'center-out') {
    const center = Math.floor(width / 2);
    const leftPos = Math.max(0, center - Math.round(tick * center));
    const rightPos = Math.min(width - 1, center + Math.round(tick * (width - 1 - center)));
    result[leftPos] = solidColor;
    result[rightPos] = solidColor;
  } else {
    // sides-in
    const center = Math.floor(width / 2);
    const leftPos = Math.min(center, Math.round(tick * center));
    const rightPos = Math.max(center, width - 1 - Math.round(tick * (width - 1 - center)));
    result[leftPos] = solidColor;
    result[rightPos] = solidColor;
  }

  return result;
}

function computeGradient(width: number, tick: number, direction: AnimationDirection, colors?: AnsiColor[]): AnsiColor[] {
  const trail = (colors && colors.length >= 2) ? colors : DEFAULT_GRADIENT_TRAIL;
  const result: AnsiColor[] = new Array(width).fill('default') as AnsiColor[];
  const n = trail.length;

  const paint = (head: number, trailDir: 1 | -1) => {
    for (let i = 0; i < n; i++) {
      const pos = head - i * trailDir;
      if (pos >= 0 && pos < width) result[pos] = trail[i]!;
    }
  };

  if (direction === 'ltr') {
    paint(Math.floor(tick * width), 1);
  } else if (direction === 'rtl') {
    paint(width - 1 - Math.floor(tick * width), -1);
  } else if (direction === 'center-out') {
    const center = Math.floor(width / 2);
    const offset = Math.floor(tick * (Math.floor(width / 2) + 1));
    paint(center - offset, -1);
    paint(center + offset, 1);
  } else {
    // sides-in
    const offset = Math.floor(tick * (Math.floor(width / 2) + 1));
    paint(offset, 1);
    paint(width - 1 - offset, -1);
  }

  return result;
}

function computeRainbow(width: number, tick: number, direction: AnimationDirection): AnsiColor[] {
  const n = RAINBOW.length;
  // Map each column to a fraction in [0,1) across the full width so exactly
  // one rainbow cycle spans the text. tick shifts the entire rainbow over time.
  return Array.from({ length: width }, (_, c) => {
    let pos: number;
    if (direction === 'ltr') {
      pos = c / Math.max(width, 1) + tick;
    } else if (direction === 'rtl') {
      pos = (width - 1 - c) / Math.max(width, 1) + tick;
    } else if (direction === 'center-out') {
      const half = Math.max(width / 2, 1);
      const center = Math.floor(width / 2);
      pos = Math.abs(c - center) / half + tick;
    } else {
      // sides-in: rainbow peaks at edges, converges to center
      const half = Math.max(width / 2, 1);
      const center = Math.floor(width / 2);
      pos = 1 - Math.abs(c - center) / half + tick;
    }
    const idx = Math.floor(((pos % 1) + 1) % 1 * n);
    return RAINBOW[idx] ?? RAINBOW[0]!;
  });
}

export function getAnimatedColors(
  animation: ColorAnimation,
  width: number,
  tick: number,
): AnsiColor[] {
  if (width <= 0) return [];

  const clamped = Math.max(0, Math.min(0.9999, tick));

  if (animation.type === 'solid') return computeSolid(width, clamped, animation.direction, animation.colors);
  if (animation.type === 'gradient') return computeGradient(width, clamped, animation.direction, animation.colors);
  return computeRainbow(width, clamped, animation.direction);
}
