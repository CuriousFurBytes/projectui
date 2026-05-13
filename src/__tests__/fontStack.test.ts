import { describe, expect, it } from 'vitest';
import { TERMINAL_CANVAS_FONT_STACK } from '@/lib/fonts';

describe('TERMINAL_CANVAS_FONT_STACK', () => {
  it('prefers Fira Code Nerd Font Mono for glyph coverage and fixed-width rendering', () => {
    expect(TERMINAL_CANVAS_FONT_STACK.startsWith('"FiraCode Nerd Font Mono"')).toBe(true);
    expect(TERMINAL_CANVAS_FONT_STACK).toContain('"Fira Code Nerd Font Mono"');
    expect(TERMINAL_CANVAS_FONT_STACK).toContain('"Symbols Nerd Font Mono"');
  });
});
