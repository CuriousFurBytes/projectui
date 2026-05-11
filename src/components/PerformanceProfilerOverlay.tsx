import { useEffect, useRef, useState } from 'react';
import { useEditor } from '@/store/editorStore';

interface Props {
  visible: boolean;
}

const FRAME_HISTORY = 60;

export function PerformanceProfilerOverlay({ visible }: Props) {
  const project = useEditor((s) => s.project);
  const [lastRenderMs, setLastRenderMs] = useState(0);
  const [avgRenderMs, setAvgRenderMs] = useState(0);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number>(0);

  const componentCount = Object.keys(project.components).length;

  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const measure = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      frameTimesRef.current = [...frameTimesRef.current, delta].slice(-FRAME_HISTORY);
      const avg =
        frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;

      setLastRenderMs(parseFloat(delta.toFixed(2)));
      setAvgRenderMs(parseFloat(avg.toFixed(2)));

      rafRef.current = requestAnimationFrame(measure);
    };

    rafRef.current = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  if (!visible) return null;

  const getFpsColor = (ms: number) => {
    const fps = 1000 / ms;
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const fps = lastRenderMs > 0 ? Math.round(1000 / lastRenderMs) : 0;
  const avgFps = avgRenderMs > 0 ? Math.round(1000 / avgRenderMs) : 0;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-ink-900/90 border border-ink-600 rounded-lg px-3 py-2 text-xs font-mono shadow-lg backdrop-blur-sm min-w-[180px]">
      <div className="text-ink-400 font-semibold mb-1.5 text-[10px] uppercase tracking-wide">
        Performance
      </div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-ink-400">Frame</span>
          <span className={getFpsColor(lastRenderMs)}>
            {lastRenderMs}ms ({fps} fps)
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-400">Avg (60f)</span>
          <span className={getFpsColor(avgRenderMs)}>
            {avgRenderMs}ms ({avgFps} fps)
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-400">Components</span>
          <span className="text-ink-200">{componentCount}</span>
        </div>
      </div>

      {/* Mini frame time sparkline */}
      <div className="mt-2 flex items-end gap-px h-8" aria-hidden="true">
        {frameTimesRef.current.slice(-30).map((t, i) => {
          const maxT = Math.max(...frameTimesRef.current.slice(-30), 16.7);
          const pct = Math.min(t / maxT, 1);
          const color = t < 20 ? '#4ade80' : t < 33 ? '#facc15' : '#f87171';
          return (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{ height: `${Math.max(2, pct * 100)}%`, backgroundColor: color, opacity: 0.8 }}
            />
          );
        })}
      </div>
    </div>
  );
}
