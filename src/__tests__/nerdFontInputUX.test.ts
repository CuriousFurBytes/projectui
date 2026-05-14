import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8');
const propertiesPanelSrc = readFileSync(resolve(__dirname, '../components/PropertiesPanel.tsx'), 'utf-8');

describe('Nerd Font input UX', () => {
  it('applies Fira Code Nerd Font stack to shared input class', () => {
    expect(css).toMatch(/\.input\s*\{[\s\S]*font-family\s*:\s*[^;]*Fira\s*Code\s*Nerd\s*Font/i);
  });

  it('includes a nerd font icon picker trigger in properties text fields', () => {
    expect(propertiesPanelSrc).toContain('Insert Nerd Font icon');
  });

  it('includes a searchable nerd font icon modal in properties panel', () => {
    expect(propertiesPanelSrc).toContain('Search Nerd Font icons');
    expect(propertiesPanelSrc).toContain('Powerline');
  });
});
