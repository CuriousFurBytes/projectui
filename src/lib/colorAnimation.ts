import type { AnsiColor, ColorAnimation, AnimationDirection } from '@/types/component';

const SOLID_COLOR: AnsiColor = 'brightCyan';
const GRADIENT_TRAIL: AnsiColor[] = ['brightCyan', 'cyan', 'brightBlue', 'blue', 'brightBlack'];
const RAINBOW: AnsiColor[] = [
  'brightRed', 'brightYellow', 'brightGreen', 'brightCyan', 'brightBlue', 'brightMagenta',
];

function computeSolid(width: number, tick: number, direction: AnimationDirection): AnsiColor[] {
  const result: AnsiColor[] = new Array(width).fill('default') as AnsiColor[];

  if (direction === 'ltr') {
    result[Math.min(Math.floor(tick * width), width - 1)] = SOLID_COLOR;
  } else if (direction === 'rtl') {
    result[Math.max(width - 1 - Math.floor(tick * width), 0)] = SOLID_COLOR;
  } else if (direction === 'center-out') {
    const center = Math.floor(width / 2);
    const leftPos = Math.max(0, center - Math.round(tick * center));
    const rightPos = Math.min(width - 1, center + Math.round(tick * (width - 1 - center)));
    result[leftPos] = SOLID_COLOR;
    result[rightPos] = SOLID_COLOR;
  } else {
    // sides-in
    const center = Math.floor(width / 2);
    const leftPos = Math.min(center, Math.round(tick * center));
    const rightPos = Math.max(center, width - 1 - Math.round(tick * (width - 1 - center)));
    result[leftPos] = SOLID_COLOR;
    result[rightPos] = SOLID_COLOR;
  }

  return result;
}

function computeGradient(width: number, tick: number, direction: AnimationDirection): AnsiColor[] {
  const result: AnsiColor[] = new Array(width).fill('default') as AnsiColor[];
  const n = GRADIENT_TRAIL.length;

  const paint = (head: number, trailDir: 1 | -1) => {
    for (let i = 0; i < n; i++) {
      const pos = head - i * trailDir;
      if (pos >= 0 && pos < width) result[pos] = GRADIENT_TRAIL[i];
    }
  };

  if (direction === 'ltr') {
    paint(Math.floor(tick * width), 1);
  } else if (direction === 'rtl') {
    paint(width - 1 - Math.floor(tick * width), -1);
  } else if (direction === 'center-out') {
    const center = Math.floor(width / 2);
    const offset = Math.floor(tick * (Math.floor(width / 2) + 1));
    paint(center - offset, -1); // left head, trail goes right
    paint(center + offset, 1);  // right head, trail goes left
  } else {
    // sides-in
    const offset = Math.floor(tick * (Math.floor(width / 2) + 1));
    paint(offset, 1);                  // left head, trail goes left
    paint(width - 1 - offset, -1);    // right head, trail goes right
  }

  return result;
}

function computeRainbow(width: number, tick: number, direction: AnimationDirection): AnsiColor[] {
  const n = RAINBOW.length;
  const shift = Math.floor(tick * n);

  return Array.from({ length: width }, (_, c) => {
    let idx: number;
    if (direction === 'ltr') {
      idx = (c + shift) % n;
    } else if (direction === 'rtl') {
      idx = (width - 1 - c + shift) % n;
    } else if (direction === 'center-out') {
      const center = Math.floor(width / 2);
      idx = (Math.abs(c - center) + shift) % n;
    } else {
      // sides-in: invert the center-out distance
      const center = Math.floor(width / 2);
      const dist = Math.abs(c - center);
      idx = ((n - (dist % n)) + shift) % n;
    }
    return RAINBOW[idx];
  });
}

export function getAnimatedColors(
  animation: ColorAnimation,
  width: number,
  tick: number,
): AnsiColor[] {
  if (width <= 0) return [];

  const clamped = Math.max(0, Math.min(0.9999, tick));

  if (animation.type === 'solid') return computeSolid(width, clamped, animation.direction);
  if (animation.type === 'gradient') return computeGradient(width, clamped, animation.direction);
  return computeRainbow(width, clamped, animation.direction);
}
