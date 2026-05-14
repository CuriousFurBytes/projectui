import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8');
const propertiesPanelSrc = readFileSync(resolve(__dirname, '../components/PropertiesPanel.tsx'), 'utf-8');
const nerdFontIconsSrc = readFileSync(resolve(__dirname, '../lib/nerdFontIcons.ts'), 'utf-8');

describe('Nerd Font input UX', () => {
  it('applies Fira Code Nerd Font stack to shared input class', () => {
    expect(css).toMatch(/\.input\s*\{[\s\S]*font-family\s*:\s*[^;]*Fira\s*Code\s*Nerd\s*Font/i);
  });

  it('applies FiraCode Nerd Font globally to html and body', () => {
    // The base html/body/root rule must set the font so every element inherits it
    expect(css).toMatch(/html[\s\S]*font-family\s*:[^;]*FiraCode Nerd Font/);
  });

  it('includes a nerd font icon picker trigger in properties text fields', () => {
    expect(propertiesPanelSrc).toContain('Insert Nerd Font icon');
  });

  it('includes a searchable nerd font icon modal in properties panel', () => {
    expect(propertiesPanelSrc).toContain('Search Nerd Font icons');
    expect(propertiesPanelSrc).toContain('Powerline');
  });

  it('PropertiesPanel imports NERD_FONT_ICONS from nerdFontIcons lib', () => {
    expect(propertiesPanelSrc).toContain('nerdFontIcons');
  });

  it('nerdFontIcons.ts includes Powerline group icons', () => {
    expect(nerdFontIconsSrc).toContain('Powerline');
  });
});
