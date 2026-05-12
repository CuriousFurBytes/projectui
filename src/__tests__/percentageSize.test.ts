import { describe, it, expect } from 'vitest';
import { stringToSize, sizeToString, resolvePercentSize } from '../lib/sizeUtils';

describe('stringToSize', () => {
  it('parses percentage strings', () => {
    expect(stringToSize('50%')).toBe('50%');
    expect(stringToSize('100%')).toBe('100%');
    expect(stringToSize('33%')).toBe('33%');
    expect(stringToSize('25%')).toBe('25%');
  });

  it('still parses positive integers', () => {
    expect(stringToSize('20')).toBe(20);
    expect(stringToSize('1')).toBe(1);
  });

  it('still parses fill and auto keywords', () => {
    expect(stringToSize('fill')).toBe('fill');
    expect(stringToSize('auto')).toBe('auto');
  });

  it('falls back to auto for invalid input', () => {
    expect(stringToSize('abc')).toBe('auto');
    expect(stringToSize('')).toBe('auto');
  });
});

describe('sizeToString', () => {
  it('returns percentage strings unchanged', () => {
    expect(sizeToString('50%')).toBe('50%');
    expect(sizeToString('100%')).toBe('100%');
  });

  it('returns fill for undefined', () => {
    expect(sizeToString(undefined)).toBe('fill');
  });

  it('converts numbers to strings', () => {
    expect(sizeToString(20)).toBe('20');
  });

  it('returns auto and fill as-is', () => {
    expect(sizeToString('auto')).toBe('auto');
    expect(sizeToString('fill')).toBe('fill');
  });
});

describe('resolvePercentSize', () => {
  it('resolves 50% to half of parent', () => {
    expect(resolvePercentSize('50%', 100)).toBe(50);
  });

  it('resolves 25% correctly', () => {
    expect(resolvePercentSize('25%', 80)).toBe(20);
  });

  it('resolves 100% to full parent size', () => {
    expect(resolvePercentSize('100%', 60)).toBe(60);
  });

  it('returns null for numeric sizes', () => {
    expect(resolvePercentSize(10, 100)).toBeNull();
  });

  it('returns null for fill', () => {
    expect(resolvePercentSize('fill', 100)).toBeNull();
  });

  it('returns null for auto', () => {
    expect(resolvePercentSize('auto', 100)).toBeNull();
  });
});
