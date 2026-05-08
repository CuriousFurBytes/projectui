import type { AnsiColor } from '@/types/component';
import { contrastRatio, isContrastSafe } from '@/lib/accessibility';

export const ANSI_HEX_MAP: Record<AnsiColor, string> = {
  default: '#c0caf5',
  black: '#000000',
  red: '#cc0000',
  green: '#00aa00',
  yellow: '#aaaa00',
  blue: '#0000cc',
  magenta: '#aa00aa',
  cyan: '#00aaaa',
  white: '#aaaaaa',
  brightBlack: '#555555',
  brightRed: '#ff5555',
  brightGreen: '#55ff55',
  brightYellow: '#ffff55',
  brightBlue: '#5555ff',
  brightMagenta: '#ff55ff',
  brightCyan: '#55ffff',
  brightWhite: '#ffffff',
};

const ALL_COLORS = Object.keys(ANSI_HEX_MAP) as AnsiColor[];

export interface SafePair {
  fg: AnsiColor;
  bg: AnsiColor;
  ratio: number;
}

export function generateSafePairs(level: 'AA' | 'AAA' = 'AA'): SafePair[] {
  const pairs: SafePair[] = [];
  for (const fg of ALL_COLORS) {
    for (const bg of ALL_COLORS) {
      if (fg === bg) continue;
      const ratio = contrastRatio(ANSI_HEX_MAP[fg], ANSI_HEX_MAP[bg]);
      if (isContrastSafe(ratio, level)) {
        pairs.push({ fg, bg, ratio });
      }
    }
  }
  return pairs;
}

function hexDistance(a: string, b: string): number {
  const parse = (h: string): [number, number, number] => {
    const c = h.replace('#', '');
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function suggestContrastFix(fg: AnsiColor, bg: AnsiColor): SafePair | null {
  const fgHex = ANSI_HEX_MAP[fg];
  const bgHex = ANSI_HEX_MAP[bg];
  const safePairs = generateSafePairs('AA');
  let best: SafePair | null = null;
  let bestDist = Infinity;
  for (const pair of safePairs) {
    if (pair.bg !== bg && pair.fg !== fg) continue;
    const altFgHex = ANSI_HEX_MAP[pair.fg];
    const altBgHex = ANSI_HEX_MAP[pair.bg];
    const dist = hexDistance(fgHex, altFgHex) + hexDistance(bgHex, altBgHex);
    if (dist < bestDist) {
      bestDist = dist;
      best = pair;
    }
  }
  if (!best) {
    for (const pair of safePairs) {
      const altFgHex = ANSI_HEX_MAP[pair.fg];
      const altBgHex = ANSI_HEX_MAP[pair.bg];
      const dist = hexDistance(fgHex, altFgHex) + hexDistance(bgHex, altBgHex);
      if (dist < bestDist) {
        bestDist = dist;
        best = pair;
      }
    }
  }
  return best;
}

export function getTopContrastPairs(n = 10): SafePair[] {
  return generateSafePairs('AA')
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, n);
}
