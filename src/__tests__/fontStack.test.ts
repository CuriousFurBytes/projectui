import { describe, expect, it } from 'vitest';
import { TERMINAL_CANVAS_FONT_STACK } from '@/lib/fonts';

describe('TERMINAL_CANVAS_FONT_STACK', () => {
  it('prefers FiraCode Nerd Font for glyph coverage', () => {
    expect(TERMINAL_CANVAS_FONT_STACK).toContain('"FiraCode Nerd Font"');
    expect(TERMINAL_CANVAS_FONT_STACK.startsWith('"FiraCode Nerd Font"')).toBe(true);
  });
});
