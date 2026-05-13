import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const layersPanelSrc = readFileSync(resolve(__dirname, '../components/LayersPanel.tsx'), 'utf-8');

describe('LayersPanel – vertical reorder controls', () => {
  it('exposes a Move up control for nodes', () => {
    expect(layersPanelSrc).toContain('Move up');
  });

  it('exposes a Move down control for nodes', () => {
    expect(layersPanelSrc).toContain('Move down');
  });
});
