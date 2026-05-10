import { describe, it, expect } from 'vitest';
import {
  contrastRatio,
  isContrastSafe,
  checkProjectContrast,
  isSafeGlyph,
  checkProjectGlyphs,
  CAPABILITY_PROFILES,
  hexToRgb,
} from '../lib/accessibility';
import type { ProjectState, ComponentNode } from '../types/component';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeNode(id: string, overrides: Partial<ComponentNode> = {}): ComponentNode {
  return {
    id,
    type: 'container',
    parentId: null,
    children: [],
    props: {},
    ...overrides,
  };
}

function makeProject(nodes: Record<string, ComponentNode>): ProjectState {
  return {
    rootId: Object.keys(nodes)[0],
    components: nodes,
    termCols: 80,
    termRows: 24,
    theme: 'dracula',
  };
}

// ── hexToRgb ──────────────────────────────────────────────────────────────────

describe('hexToRgb', () => {
  it('parses a 6-digit hex with #', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
  });

  it('parses a 6-digit hex without #', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('parses a 3-digit hex (expands shorthand)', () => {
    expect(hexToRgb('#f0a')).toEqual({ r: 255, g: 0, b: 170 });
  });

  it('returns {0,0,0} for "notahex"', () => {
    const rgb = hexToRgb('notahex');
    expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
    expect(Number.isNaN(rgb.r)).toBe(false);
    expect(Number.isNaN(rgb.g)).toBe(false);
    expect(Number.isNaN(rgb.b)).toBe(false);
  });

  it('returns {0,0,0} for "#zzzzzz"', () => {
    const rgb = hexToRgb('#zzzzzz');
    expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
    expect(Number.isNaN(rgb.r)).toBe(false);
  });

  it('returns {0,0,0} for empty string', () => {
    const rgb = hexToRgb('');
    expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
    expect(Number.isNaN(rgb.r)).toBe(false);
  });
});

// ── contrastRatio ─────────────────────────────────────────────────────────────

describe('contrastRatio', () => {
  it('returns ~21 for black on white', () => {
    const ratio = contrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns ~21 for white on black', () => {
    const ratio = contrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 5);
    expect(contrastRatio('#000000', '#000000')).toBeCloseTo(1, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('returns a value >= 1 for any color pair', () => {
    const ratio = contrastRatio('#aabbcc', '#112233');
    expect(ratio).toBeGreaterThanOrEqual(1);
  });
});

// ── isContrastSafe ────────────────────────────────────────────────────────────

describe('isContrastSafe', () => {
  it('ratio 4.5 is safe at AA level', () => {
    expect(isContrastSafe(4.5, 'AA')).toBe(true);
  });

  it('ratio 4.4 is not safe at AA level', () => {
    expect(isContrastSafe(4.4, 'AA')).toBe(false);
  });

  it('ratio 7 is safe at AAA level', () => {
    expect(isContrastSafe(7, 'AAA')).toBe(true);
  });

  it('ratio 6.9 is not safe at AAA level', () => {
    expect(isContrastSafe(6.9, 'AAA')).toBe(false);
  });

  it('defaults to AA level when level is omitted', () => {
    expect(isContrastSafe(4.5)).toBe(true);
    expect(isContrastSafe(4.4)).toBe(false);
  });
});

// ── checkProjectContrast ──────────────────────────────────────────────────────

describe('checkProjectContrast', () => {
  it('returns issues for a node with bad contrast (blue text on blue bg)', () => {
    // blue (#0000cc) on blue (#0000cc) → ratio 1 → fails AA
    const project = makeProject({
      root: makeNode('root', { props: { fg: 'blue', bg: 'blue' } }),
    });
    const issues = checkProjectContrast(project);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].nodeId).toBe('root');
    expect(issues[0].ratio).toBeCloseTo(1, 1);
  });

  it('returns no issues for a node with good contrast (black on white)', () => {
    // 'black' maps to #000000, 'brightWhite' maps to #ffffff → ratio ~21
    const project = makeProject({
      root: makeNode('root', { props: { fg: 'black', bg: 'brightWhite' } }),
    });
    const issues = checkProjectContrast(project);
    expect(issues).toHaveLength(0);
  });

  it('skips nodes that do not have both fg and bg defined', () => {
    const project = makeProject({
      root: makeNode('root', { props: { fg: 'black' } }), // no bg
      other: makeNode('other', { props: {} }),             // neither
    });
    const issues = checkProjectContrast(project);
    expect(issues).toHaveLength(0);
  });

  it('skips nodes with an unrecognised ANSI color name', () => {
    const project = makeProject({
      root: makeNode('root', { props: { fg: 'unknown-color' as never, bg: 'black' } }),
    });
    const issues = checkProjectContrast(project);
    expect(issues).toHaveLength(0);
  });

  it('reports nodeId, ratio, fg and bg hex in each issue', () => {
    const project = makeProject({
      root: makeNode('root', { props: { fg: 'blue', bg: 'blue' } }),
    });
    const issues = checkProjectContrast(project);
    expect(issues[0]).toHaveProperty('nodeId');
    expect(issues[0]).toHaveProperty('ratio');
    expect(issues[0]).toHaveProperty('fg');
    expect(issues[0]).toHaveProperty('bg');
  });
});

// ── isSafeGlyph ───────────────────────────────────────────────────────────────

describe('isSafeGlyph', () => {
  it('returns true for printable ASCII characters', () => {
    expect(isSafeGlyph('A')).toBe(true);
    expect(isSafeGlyph('z')).toBe(true);
    expect(isSafeGlyph('0')).toBe(true);
    expect(isSafeGlyph('!')).toBe(true);
    expect(isSafeGlyph(' ')).toBe(true); // space (0x20) is inclusive
    expect(isSafeGlyph('~')).toBe(true); // tilde (0x7e) is inclusive
  });

  it('returns false for non-printable ASCII characters', () => {
    expect(isSafeGlyph('\x00')).toBe(false); // NUL
    expect(isSafeGlyph('\x1b')).toBe(false); // ESC
    expect(isSafeGlyph('\x7f')).toBe(false); // DEL (0x7f, just above range)
    expect(isSafeGlyph('\n')).toBe(false);
    expect(isSafeGlyph('\t')).toBe(false);
  });

  it('returns false for multi-character strings', () => {
    expect(isSafeGlyph('AB')).toBe(false);
    expect(isSafeGlyph('')).toBe(false);
  });

  it('returns false for emoji (multi-code-unit characters)', () => {
    // emoji are not single printable ASCII chars
    expect(isSafeGlyph('😀')).toBe(false);
  });

  it('returns false for unicode characters outside printable ASCII range', () => {
    expect(isSafeGlyph('é')).toBe(false);
    expect(isSafeGlyph('中')).toBe(false);
  });
});

// ── checkProjectGlyphs ────────────────────────────────────────────────────────

describe('checkProjectGlyphs', () => {
  it('returns no issues for a node with safe ASCII text', () => {
    const project = makeProject({
      root: makeNode('root', { props: { text: 'Hello, world!' } }),
    });
    const issues = checkProjectGlyphs(project);
    expect(issues).toHaveLength(0);
  });

  it('returns issues when text contains an emoji', () => {
    const project = makeProject({
      root: makeNode('root', { props: { text: 'Hi 😀' } }),
    });
    const issues = checkProjectGlyphs(project);
    // Emoji '😀' is 2 UTF-16 code units (surrogate pair), each flagged separately
    expect(issues.length).toBeGreaterThanOrEqual(2);
    expect(issues[0].nodeId).toBe('root');
    expect(issues[0].position).toBeGreaterThanOrEqual(3);
  });

  it('checks the title prop for unsafe glyphs', () => {
    const project = makeProject({
      root: makeNode('root', { props: { title: 'Status: \x1b[OK]' } }),
    });
    const issues = checkProjectGlyphs(project);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.nodeId === 'root')).toBe(true);
  });

  it('checks the label prop for unsafe glyphs', () => {
    const project = makeProject({
      root: makeNode('root', { props: { label: 'Click\x00here' } }),
    });
    const issues = checkProjectGlyphs(project);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.nodeId === 'root')).toBe(true);
  });

  it('reports position of unsafe glyph in the string', () => {
    const project = makeProject({
      root: makeNode('root', { props: { text: 'abc\x1bdef' } }),
    });
    const issues = checkProjectGlyphs(project);
    const issue = issues.find((i) => i.nodeId === 'root');
    expect(issue).toBeDefined();
    expect(issue!.position).toBe(3); // index of \x1b
  });

  it('skips nodes with no text/title/label props', () => {
    const project = makeProject({
      root: makeNode('root', { props: {} }),
    });
    expect(checkProjectGlyphs(project)).toHaveLength(0);
  });
});

// ── CAPABILITY_PROFILES ───────────────────────────────────────────────────────

describe('CAPABILITY_PROFILES', () => {
  it('has exactly 4 profiles', () => {
    expect(CAPABILITY_PROFILES).toHaveLength(4);
  });

  it('includes a truecolor profile', () => {
    const truecolor = CAPABILITY_PROFILES.find((p) => p.name === 'truecolor');
    expect(truecolor).toBeDefined();
    expect(truecolor!.supportsTruecolor).toBe(true);
  });

  it('truecolor profile supports 16 million colors', () => {
    const truecolor = CAPABILITY_PROFILES.find((p) => p.name === 'truecolor');
    expect(truecolor!.maxColors).toBe(16777216);
  });

  it('all profiles have required fields', () => {
    for (const profile of CAPABILITY_PROFILES) {
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('label');
      expect(typeof profile.maxColors).toBe('number');
      expect(typeof profile.supportsUnicode).toBe('boolean');
      expect(typeof profile.supportsTruecolor).toBe('boolean');
    }
  });

  it('only the truecolor profile has supportsTruecolor = true', () => {
    const truecolorOnes = CAPABILITY_PROFILES.filter((p) => p.supportsTruecolor);
    expect(truecolorOnes).toHaveLength(1);
    expect(truecolorOnes[0].name).toBe('truecolor');
  });
});
