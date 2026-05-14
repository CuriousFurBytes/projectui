// TDD tests for the full Nerd Font icon set (nerdFontIcons.ts).
// Written RED first — fail before nerdFontIcons.ts exists, then GREEN.
import { describe, it, expect } from 'vitest';

describe('NERD_FONT_ICONS — full cheat-sheet coverage', () => {
  it('exports NERD_FONT_ICONS from lib/nerdFontIcons', async () => {
    const mod = await import('@/lib/nerdFontIcons');
    expect(mod.NERD_FONT_ICONS).toBeDefined();
    expect(Array.isArray(mod.NERD_FONT_ICONS)).toBe(true);
  });

  it('contains all icons from the cheat sheet (>= 10 000)', async () => {
    const { NERD_FONT_ICONS } = await import('@/lib/nerdFontIcons');
    expect(NERD_FONT_ICONS.length).toBeGreaterThanOrEqual(10_000);
  });

  it('every entry has symbol, name, and group', async () => {
    const { NERD_FONT_ICONS } = await import('@/lib/nerdFontIcons');
    for (const icon of NERD_FONT_ICONS) {
      expect(typeof icon.symbol).toBe('string');
      expect(icon.symbol.length).toBeGreaterThan(0);
      expect(typeof icon.name).toBe('string');
      expect(typeof icon.group).toBe('string');
    }
  });

  it('includes icons from Powerline group', async () => {
    const { NERD_FONT_ICONS } = await import('@/lib/nerdFontIcons');
    const powerline = NERD_FONT_ICONS.filter((i) => i.group === 'Powerline');
    expect(powerline.length).toBeGreaterThan(0);
  });

  it('includes icons from FontAwesome group', async () => {
    const { NERD_FONT_ICONS } = await import('@/lib/nerdFontIcons');
    const fa = NERD_FONT_ICONS.filter((i) => i.group === 'FontAwesome');
    expect(fa.length).toBeGreaterThan(0);
  });

  it('includes icons from Material Design group', async () => {
    const { NERD_FONT_ICONS } = await import('@/lib/nerdFontIcons');
    const md = NERD_FONT_ICONS.filter((i) => i.group === 'Material Design');
    expect(md.length).toBeGreaterThan(0);
  });

  it('includes icons from Codicons group', async () => {
    const { NERD_FONT_ICONS } = await import('@/lib/nerdFontIcons');
    const cod = NERD_FONT_ICONS.filter((i) => i.group === 'Codicons');
    expect(cod.length).toBeGreaterThan(0);
  });

  it('includes icons from Devicons group', async () => {
    const { NERD_FONT_ICONS } = await import('@/lib/nerdFontIcons');
    const dev = NERD_FONT_ICONS.filter((i) => i.group === 'Devicons');
    expect(dev.length).toBeGreaterThan(0);
  });

  it('includes icons from Octicons group', async () => {
    const { NERD_FONT_ICONS } = await import('@/lib/nerdFontIcons');
    const oct = NERD_FONT_ICONS.filter((i) => i.group === 'Octicons');
    expect(oct.length).toBeGreaterThan(0);
  });
});
