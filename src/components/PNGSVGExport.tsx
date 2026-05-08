import { useState, useEffect } from 'react';
import { useEditor } from '@/store/editorStore';
import { render } from '@/renderer/render';
import { getTheme } from '@/lib/themes';

type ExportFormat = 'png' | 'svg';

const CELL_W = 8;
const CELL_H = 16;

export function PNGSVGExport({ onClose }: { onClose: () => void }) {
  const project = useEditor((s) => s.project);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const generateSVG = (): string => {
    const result = render(project);
    const theme = getTheme(project.theme);
    const grid = result.grid;
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 0;
    const totalW = cols * CELL_W;
    const totalH = rows * CELL_H;

    const colorMap: Record<string, string> = {
      default: theme.fg,
      black: '#000000',
      red: '#cc0000',
      green: '#00cc00',
      yellow: '#cccc00',
      blue: '#0000cc',
      magenta: '#cc00cc',
      cyan: '#00cccc',
      white: '#cccccc',
      brightBlack: '#555555',
      brightRed: '#ff5555',
      brightGreen: '#55ff55',
      brightYellow: '#ffff55',
      brightBlue: '#5555ff',
      brightMagenta: '#ff55ff',
      brightCyan: '#55ffff',
      brightWhite: '#ffffff',
    };

    const resolveFg = (c?: string) => (c && c !== 'default' ? colorMap[c] ?? theme.fg : theme.fg);
    const resolveBg = (c?: string) => (c && c !== 'default' ? colorMap[c] ?? theme.bg : theme.bg);

    const textElements: string[] = [];
    const bgRects: string[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid[row][col];
        if (!cell) continue;
        const x = col * CELL_W;
        const y = row * CELL_H;
        const ch = cell.ch ?? ' ';
        const fg = resolveFg(cell.fg);
        const bg = resolveBg(cell.bg);

        if (bg !== theme.bg) {
          bgRects.push(
            `<rect x="${x}" y="${y}" width="${CELL_W}" height="${CELL_H}" fill="${bg}" />`,
          );
        }

        if (ch.trim() !== '') {
          const bold = cell.bold ? 'font-weight="bold"' : '';
          const esc = ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          textElements.push(
            `<text x="${x}" y="${y + CELL_H - 4}" font-family="monospace" font-size="${CELL_H - 2}" fill="${fg}" ${bold}>${esc}</text>`,
          );
        }
      }
    }

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`,
      `<rect width="${totalW}" height="${totalH}" fill="${theme.bg}" />`,
      ...bgRects,
      ...textElements,
      '</svg>',
    ].join('\n');
  };

  const generatePNG = async (): Promise<Blob> => {
    const svgStr = generateSVG();
    const result = render(project);
    const rows = result.grid.length;
    const cols = rows > 0 ? result.grid[0].length : 0;
    const totalW = cols * CELL_W;
    const totalH = rows * CELL_H;

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG as image: ' + String(e)));
      };
      img.src = url;
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    });
  };

  const handleExport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const projectName = project.metadata?.name ?? 'projectui-export';

      if (format === 'svg') {
        const svgStr = generateSVG();
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}.svg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      } else {
        const blob = await generatePNG();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
      onClose();
    } catch (e) {
      setError((e as Error).message ?? 'Export failed');
    } finally {
      setGenerating(false);
    }
  };

  const result = render(project);
  const rows = result.grid.length;
  const cols = rows > 0 ? result.grid[0].length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[420px] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600 shrink-0">
          <h2 className="text-sm font-semibold">Export as Image</h2>
          <button
            className="text-ink-400 hover:text-white text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Format selector */}
          <div>
            <label className="text-xs text-ink-400 uppercase tracking-wide block mb-2">Format</label>
            <div className="flex gap-2">
              {(['png', 'svg'] as const).map((f) => (
                <button
                  key={f}
                  className={[
                    'flex-1 py-2 rounded border text-sm font-mono uppercase tracking-wide',
                    format === f
                      ? 'bg-accent text-ink-900 border-accent font-bold'
                      : 'bg-ink-700 border-ink-500 text-ink-300 hover:border-accent',
                  ].join(' ')}
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Preview info */}
          <div className="bg-ink-900 rounded p-3 text-xs space-y-1">
            <div className="flex justify-between text-ink-400">
              <span>Canvas size</span>
              <span className="text-ink-200 font-mono">
                {cols * CELL_W} × {rows * CELL_H} px
              </span>
            </div>
            <div className="flex justify-between text-ink-400">
              <span>Terminal grid</span>
              <span className="text-ink-200 font-mono">
                {cols} × {rows} cells
              </span>
            </div>
            <div className="flex justify-between text-ink-400">
              <span>Theme</span>
              <span className="text-ink-200 capitalize">{project.theme}</span>
            </div>
          </div>

          {format === 'png' && (
            <p className="text-[11px] text-ink-400">
              PNG export renders the canvas via an SVG intermediate and writes to an offscreen canvas.
              Actual rendered output depends on browser font rendering.
            </p>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-ink-600 flex justify-end gap-2 shrink-0">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn bg-accent text-ink-900 hover:opacity-90 font-semibold"
            onClick={handleExport}
            disabled={generating}
          >
            {generating ? 'Generating…' : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
