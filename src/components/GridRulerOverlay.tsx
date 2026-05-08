import { useEditor } from '@/store/editorStore';

interface Props {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  zoom: number;
}

export function GridRulerOverlay({ cols, rows, cellWidth, cellHeight, zoom }: Props) {
  const preferences = useEditor((s) => s.preferences);
  const { showGrid, showRulers, gridSize } = preferences;

  if (!showGrid && !showRulers) return null;

  const totalWidth = cols * cellWidth * zoom;
  const totalHeight = rows * cellHeight * zoom;
  const scaledCellW = cellWidth * zoom;
  const scaledCellH = cellHeight * zoom;
  const gSize = Math.max(1, gridSize ?? 4);

  const rulerH = 18;
  const rulerV = 20;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 5 }}
    >
      {/* SVG layer for grid lines */}
      {showGrid && (
        <svg
          className="absolute"
          style={{ left: showRulers ? rulerV : 0, top: showRulers ? rulerH : 0 }}
          width={totalWidth}
          height={totalHeight}
          aria-hidden="true"
        >
          {/* Vertical grid lines */}
          {Array.from({ length: Math.floor(cols / gSize) + 1 }, (_, i) => i * gSize).map((col) => (
            <line
              key={`v${col}`}
              x1={col * scaledCellW}
              y1={0}
              x2={col * scaledCellW}
              y2={totalHeight}
              stroke="rgba(100,120,180,0.2)"
              strokeWidth={col % (gSize * 5) === 0 ? 1 : 0.5}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: Math.floor(rows / gSize) + 1 }, (_, i) => i * gSize).map((row) => (
            <line
              key={`h${row}`}
              x1={0}
              y1={row * scaledCellH}
              x2={totalWidth}
              y2={row * scaledCellH}
              stroke="rgba(100,120,180,0.2)"
              strokeWidth={row % (gSize * 5) === 0 ? 1 : 0.5}
            />
          ))}
        </svg>
      )}

      {/* Rulers */}
      {showRulers && (
        <>
          {/* Top ruler (horizontal — shows column numbers) */}
          <svg
            className="absolute top-0"
            style={{ left: rulerV }}
            width={totalWidth}
            height={rulerH}
            aria-hidden="true"
          >
            <rect width={totalWidth} height={rulerH} fill="rgba(20,25,40,0.85)" />
            {Array.from({ length: Math.floor(cols / 5) + 1 }, (_, i) => i * 5).map((col) => (
              <g key={col}>
                <line
                  x1={col * scaledCellW}
                  y1={rulerH - 5}
                  x2={col * scaledCellW}
                  y2={rulerH}
                  stroke="rgba(140,160,220,0.6)"
                  strokeWidth={1}
                />
                {col % 10 === 0 && (
                  <text
                    x={col * scaledCellW + 2}
                    y={rulerH - 6}
                    fill="rgba(140,160,220,0.8)"
                    fontSize={8}
                    fontFamily="monospace"
                  >
                    {col}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Left ruler (vertical — shows row numbers) */}
          <svg
            className="absolute left-0"
            style={{ top: rulerH }}
            width={rulerV}
            height={totalHeight}
            aria-hidden="true"
          >
            <rect width={rulerV} height={totalHeight} fill="rgba(20,25,40,0.85)" />
            {Array.from({ length: Math.floor(rows / 5) + 1 }, (_, i) => i * 5).map((row) => (
              <g key={row}>
                <line
                  x1={rulerV - 5}
                  y1={row * scaledCellH}
                  x2={rulerV}
                  y2={row * scaledCellH}
                  stroke="rgba(140,160,220,0.6)"
                  strokeWidth={1}
                />
                {row % 10 === 0 && (
                  <text
                    x={1}
                    y={row * scaledCellH + 9}
                    fill="rgba(140,160,220,0.8)"
                    fontSize={8}
                    fontFamily="monospace"
                  >
                    {row}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Corner square */}
          <div
            className="absolute top-0 left-0 bg-ink-900 border-r border-b border-ink-600"
            style={{ width: rulerV, height: rulerH }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
