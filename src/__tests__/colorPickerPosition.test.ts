import { describe, it, expect } from 'vitest';
import { getColorPickerSide } from '../lib/colorPickerPosition';

describe('getColorPickerSide', () => {
  it('returns right when there is enough space to the right', () => {
    // button at x=100, viewport=1200, dropdown=176px → right edge=276 < 1200
    expect(getColorPickerSide(100, 1200, 176)).toBe('right');
  });

  it('returns left when dropdown would overflow the right edge', () => {
    // button at x=1100, viewport=1200, dropdown=176px → right edge=1276 > 1200
    expect(getColorPickerSide(1100, 1200, 176)).toBe('left');
  });

  it('returns right when exactly enough space', () => {
    // button at x=1024, viewport=1200, dropdown=176px → right edge=1200 = 1200
    expect(getColorPickerSide(1024, 1200, 176)).toBe('right');
  });

  it('returns left when one pixel too close to right edge', () => {
    // button at x=1025, viewport=1200, dropdown=176px → right edge=1201 > 1200
    expect(getColorPickerSide(1025, 1200, 176)).toBe('left');
  });

  it('always returns right when button is at origin', () => {
    expect(getColorPickerSide(0, 800, 176)).toBe('right');
  });
});
