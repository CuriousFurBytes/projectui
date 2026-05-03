import { describe, it, expect } from 'vitest';
import { getAnimatedColors } from '../lib/colorAnimation';
import type { ColorAnimation } from '../types/component';

function makeAnim(overrides: Partial<ColorAnimation> = {}): ColorAnimation {
  return {
    enabled: true,
    type: 'solid',
    direction: 'ltr',
    durationMs: 1000,
    loop: true,
    ...overrides,
  };
}

const RAINBOW_COLORS = new Set([
  'brightRed', 'brightYellow', 'brightGreen', 'brightCyan', 'brightBlue', 'brightMagenta',
]);

describe('getAnimatedColors', () => {
  describe('common', () => {
    it('returns array of correct length', () => {
      expect(getAnimatedColors(makeAnim(), 10, 0)).toHaveLength(10);
    });
    it('handles width=0', () => {
      expect(getAnimatedColors(makeAnim(), 0, 0)).toHaveLength(0);
    });
    it('handles width=1 without throwing', () => {
      expect(() => getAnimatedColors(makeAnim(), 1, 0)).not.toThrow();
      expect(getAnimatedColors(makeAnim(), 1, 0)).toHaveLength(1);
    });
  });

  describe('solid / ltr', () => {
    it('at tick=0 active cell is at position 0', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'ltr' }), 10, 0);
      expect(colors[0]).not.toBe('default');
      expect(colors[1]).toBe('default');
    });
    it('at tick=0.5 active cell is at position 5', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'ltr' }), 10, 0.5);
      expect(colors[5]).not.toBe('default');
      expect(colors[0]).toBe('default');
      expect(colors[9]).toBe('default');
    });
    it('at tick=0.2 active cell is at position 2, all others default', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'ltr' }), 10, 0.2);
      expect(colors[2]).not.toBe('default');
      colors.forEach((c, i) => { if (i !== 2) expect(c).toBe('default'); });
    });
    it('exactly one cell is non-default', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'ltr' }), 20, 0.3);
      const active = colors.filter(c => c !== 'default');
      expect(active).toHaveLength(1);
    });
  });

  describe('solid / rtl', () => {
    it('at tick=0 active cell is at rightmost position', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'rtl' }), 10, 0);
      expect(colors[9]).not.toBe('default');
      expect(colors[0]).toBe('default');
    });
    it('at tick=0.5 active cell is at position 4', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'rtl' }), 10, 0.5);
      expect(colors[4]).not.toBe('default');
      expect(colors[9]).toBe('default');
    });
    it('exactly one cell is non-default', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'rtl' }), 20, 0.7);
      expect(colors.filter(c => c !== 'default')).toHaveLength(1);
    });
  });

  describe('solid / center-out', () => {
    it('at tick=0 center cell is active', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'center-out' }), 10, 0);
      const center = Math.floor(10 / 2);
      expect(colors[center]).not.toBe('default');
    });
    it('at tick near 1 both edge cells are active', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'center-out' }), 10, 0.95);
      expect(colors[0]).not.toBe('default');
      expect(colors[9]).not.toBe('default');
    });
    it('active cells move outward as tick increases', () => {
      const colorsA = getAnimatedColors(makeAnim({ type: 'solid', direction: 'center-out' }), 20, 0.1);
      const colorsB = getAnimatedColors(makeAnim({ type: 'solid', direction: 'center-out' }), 20, 0.8);
      const rightA = Math.max(...colorsA.map((c, i) => (c !== 'default' ? i : -1)));
      const rightB = Math.max(...colorsB.map((c, i) => (c !== 'default' ? i : -1)));
      expect(rightB).toBeGreaterThan(rightA);
    });
  });

  describe('solid / sides-in', () => {
    it('at tick=0 both edge cells are active', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'sides-in' }), 10, 0);
      expect(colors[0]).not.toBe('default');
      expect(colors[9]).not.toBe('default');
    });
    it('at tick near 1 active cells are near center', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'solid', direction: 'sides-in' }), 10, 0.95);
      const center = Math.floor(10 / 2);
      const activePositions = colors.map((c, i) => (c !== 'default' ? i : -1)).filter(i => i >= 0);
      expect(activePositions.some(pos => Math.abs(pos - center) <= 1)).toBe(true);
    });
    it('active cells move inward as tick increases', () => {
      const colorsA = getAnimatedColors(makeAnim({ type: 'solid', direction: 'sides-in' }), 20, 0.1);
      const colorsB = getAnimatedColors(makeAnim({ type: 'solid', direction: 'sides-in' }), 20, 0.8);
      const leftEdgeA = Math.min(...colorsA.map((c, i) => (c !== 'default' ? i : Infinity)));
      const leftEdgeB = Math.min(...colorsB.map((c, i) => (c !== 'default' ? i : Infinity)));
      expect(leftEdgeB).toBeGreaterThan(leftEdgeA);
    });
  });

  describe('gradient / ltr', () => {
    it('cells near head position are non-default at tick=0.5 width=20', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'gradient', direction: 'ltr' }), 20, 0.5);
      const head = 10;
      expect(colors[head]).not.toBe('default');
    });
    it('cells far behind head are default', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'gradient', direction: 'ltr' }), 20, 0.5);
      expect(colors[0]).toBe('default');
    });
    it('cells ahead of head are default', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'gradient', direction: 'ltr' }), 20, 0.3);
      expect(colors[19]).toBe('default');
    });
    it('head cell differs from trailing cells (gradient effect)', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'gradient', direction: 'ltr' }), 20, 0.6);
      const head = 12;
      if (head > 0 && colors[head] !== 'default' && colors[head - 1] !== 'default') {
        expect(colors[head]).not.toBe(colors[head - 1]);
      }
    });
  });

  describe('gradient / rtl', () => {
    it('head is at right side at tick=0', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'gradient', direction: 'rtl' }), 20, 0);
      const nonDefault = colors.map((c, i) => (c !== 'default' ? i : -1)).filter(i => i >= 0);
      expect(Math.max(...nonDefault)).toBe(19);
    });
    it('head moves left as tick increases', () => {
      const colors0 = getAnimatedColors(makeAnim({ type: 'gradient', direction: 'rtl' }), 20, 0);
      const colors5 = getAnimatedColors(makeAnim({ type: 'gradient', direction: 'rtl' }), 20, 0.5);
      const maxRight0 = Math.max(...colors0.map((c, i) => (c !== 'default' ? i : -1)));
      const maxRight5 = Math.max(...colors5.map((c, i) => (c !== 'default' ? i : -1)));
      expect(maxRight0).toBeGreaterThan(maxRight5);
    });
  });

  describe('gradient / center-out', () => {
    it('non-default cells exist near center at tick=0', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'gradient', direction: 'center-out' }), 20, 0);
      const center = 10;
      const nearCenter = colors.slice(center - 3, center + 4);
      expect(nearCenter.some(c => c !== 'default')).toBe(true);
    });
    it('returns array of correct length', () => {
      expect(getAnimatedColors(makeAnim({ type: 'gradient', direction: 'center-out' }), 15, 0.5)).toHaveLength(15);
    });
  });

  describe('gradient / sides-in', () => {
    it('non-default cells exist near edges at tick=0', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'gradient', direction: 'sides-in' }), 20, 0);
      expect(colors[0]).not.toBe('default');
      expect(colors[19]).not.toBe('default');
    });
    it('returns array of correct length', () => {
      expect(getAnimatedColors(makeAnim({ type: 'gradient', direction: 'sides-in' }), 15, 0.5)).toHaveLength(15);
    });
  });

  describe('rainbow', () => {
    it('all cells have non-default colors', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'rainbow', direction: 'ltr' }), 10, 0);
      colors.forEach(c => expect(c).not.toBe('default'));
    });
    it('only uses rainbow color set', () => {
      const colors = getAnimatedColors(makeAnim({ type: 'rainbow', direction: 'ltr' }), 10, 0);
      colors.forEach(c => expect(RAINBOW_COLORS.has(c)).toBe(true));
    });
    it('pattern shifts with tick (ltr)', () => {
      const a = getAnimatedColors(makeAnim({ type: 'rainbow', direction: 'ltr' }), 12, 0);
      const b = getAnimatedColors(makeAnim({ type: 'rainbow', direction: 'ltr' }), 12, 0.5);
      expect(a.join(',')).not.toBe(b.join(','));
    });
    it('rtl differs from ltr at same tick', () => {
      const ltr = getAnimatedColors(makeAnim({ type: 'rainbow', direction: 'ltr' }), 12, 0.2);
      const rtl = getAnimatedColors(makeAnim({ type: 'rainbow', direction: 'rtl' }), 12, 0.2);
      expect(ltr.join(',')).not.toBe(rtl.join(','));
    });
    it('handles width=1', () => {
      expect(() => getAnimatedColors(makeAnim({ type: 'rainbow' }), 1, 0)).not.toThrow();
      const colors = getAnimatedColors(makeAnim({ type: 'rainbow' }), 1, 0);
      expect(colors).toHaveLength(1);
      expect(RAINBOW_COLORS.has(colors[0])).toBe(true);
    });
    it('all directions produce only rainbow colors', () => {
      const dirs: ColorAnimation['direction'][] = ['ltr', 'rtl', 'center-out', 'sides-in'];
      dirs.forEach(direction => {
        const colors = getAnimatedColors(makeAnim({ type: 'rainbow', direction }), 12, 0.3);
        colors.forEach(c => expect(RAINBOW_COLORS.has(c)).toBe(true));
      });
    });
  });
});
