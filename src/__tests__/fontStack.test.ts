import { describe, expect, it } from 'vitest';
import { TERMINAL_CANVAS_FONT_STACK } from '@/lib/fonts';

describe('TERMINAL_CANVAS_FONT_STACK', () => {
  it('prefers FiraCode Nerd Font for glyph coverage and fixed-width rendering', () => {
    expect(TERMINAL_CANVAS_FONT_STACK.startsWith('"FiraCode Nerd Font"')).toBe(true);
    expect(TERMINAL_CANVAS_FONT_STACK).toContain('"FiraCode Nerd Font Mono"');
    expect(TERMINAL_CANVAS_FONT_STACK).toContain('"Symbols Nerd Font Mono"');
  });
});
