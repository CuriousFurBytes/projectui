// TDD tests for mobile browser blocking on the main dashboard.
// RED phase: these tests must fail before the feature is implemented.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const appSrc = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8');
const mobileBlockPath = resolve(__dirname, '../components/MobileBlock.tsx');

describe('MobileBlock component – exists', () => {
  it('MobileBlock.tsx file exists', () => {
    expect(existsSync(mobileBlockPath)).toBe(true);
  });
});

describe('MobileBlock component – content', () => {
  it('contains mobile browser detection via userAgent', () => {
    const src = readFileSync(mobileBlockPath, 'utf-8');
    expect(src).toMatch(/userAgent|isMobile|useMobileDetect/i);
  });

  it('links to /docs/ so mobile users can still read docs', () => {
    const src = readFileSync(mobileBlockPath, 'utf-8');
    expect(src).toMatch(/href="\/docs\//);
  });

  it('has a meaningful desktop-required message', () => {
    const src = readFileSync(mobileBlockPath, 'utf-8');
    expect(src.toLowerCase()).toMatch(/desktop|mobile.*not|not.*mobile/);
  });
});

describe('App.tsx – integrates mobile block', () => {
  it('imports MobileBlock', () => {
    expect(appSrc).toMatch(/MobileBlock/);
  });

  it('conditionally renders MobileBlock based on mobile detection', () => {
    // App must use isMobile / useMobileDetect and render MobileBlock
    expect(appSrc).toMatch(/isMobile|useMobileDetect/);
  });
});
