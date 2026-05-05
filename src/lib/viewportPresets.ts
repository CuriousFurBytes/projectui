export interface ViewportPreset {
  name: string;
  cols: number;
  rows: number;
}

export const VIEWPORT_PRESETS: ViewportPreset[] = [
  { name: '80×24 (VT100)', cols: 80, rows: 24 },
  { name: '100×30', cols: 100, rows: 30 },
  { name: '120×40', cols: 120, rows: 40 },
  { name: '132×43 (Large)', cols: 132, rows: 43 },
];
