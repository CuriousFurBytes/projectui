import type { ProjectState } from '@/types/component';

// ── Contrast utilities ────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isContrastSafe(ratio: number, level: 'AA' | 'AAA' = 'AA'): boolean {
  return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
}

export interface ContrastIssue {
  nodeId: string;
  ratio: number;
  fg: string;
  bg: string;
}

// ANSI color name → rough hex approximation for contrast checking
const ANSI_HEX: Record<string, string> = {
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

function ansiToHex(color: string | undefined): string | undefined {
  if (!color) return undefined;
  return ANSI_HEX[color];
}

export function checkProjectContrast(project: ProjectState): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  for (const node of Object.values(project.components)) {
    const fg = ansiToHex(node.props.fg);
    const bg = ansiToHex(node.props.bg);
    if (!fg || !bg) continue;
    const ratio = contrastRatio(fg, bg);
    if (!isContrastSafe(ratio)) {
      issues.push({ nodeId: node.id, ratio, fg, bg });
    }
  }
  return issues;
}

// ── Glyph safety ─────────────────────────────────────────────────────────────

export function isSafeGlyph(ch: string): boolean {
  if (ch.length !== 1) return false;
  const code = ch.charCodeAt(0);
  return code >= 0x20 && code <= 0x7e;
}

export interface GlyphIssue {
  nodeId: string;
  glyph: string;
  position: number;
}

function scanTextForUnsafeGlyphs(nodeId: string, text: string): GlyphIssue[] {
  const issues: GlyphIssue[] = [];
  for (let i = 0; i < text.length; i++) {
    if (!isSafeGlyph(text[i])) {
      issues.push({ nodeId, glyph: text[i], position: i });
    }
  }
  return issues;
}

export function checkProjectGlyphs(project: ProjectState): GlyphIssue[] {
  const issues: GlyphIssue[] = [];
  for (const node of Object.values(project.components)) {
    if (node.props.text) {
      issues.push(...scanTextForUnsafeGlyphs(node.id, node.props.text));
    }
    if (node.props.title) {
      issues.push(...scanTextForUnsafeGlyphs(node.id, node.props.title));
    }
    if (node.props.label) {
      issues.push(...scanTextForUnsafeGlyphs(node.id, node.props.label));
    }
  }
  return issues;
}

// ── Terminal capability profiles ─────────────────────────────────────────────

export interface CapabilityProfile {
  name: string;
  label: string;
  maxColors: number;
  supportsUnicode: boolean;
  supportsTruecolor: boolean;
}

export const CAPABILITY_PROFILES: CapabilityProfile[] = [
  { name: 'truecolor', label: 'True Color (24-bit)', maxColors: 16777216, supportsUnicode: true, supportsTruecolor: true },
  { name: '256color', label: '256 Color', maxColors: 256, supportsUnicode: true, supportsTruecolor: false },
  { name: '16color', label: '16 Color (ANSI)', maxColors: 16, supportsUnicode: true, supportsTruecolor: false },
  { name: 'mono', label: 'Monochrome', maxColors: 2, supportsUnicode: false, supportsTruecolor: false },
];
