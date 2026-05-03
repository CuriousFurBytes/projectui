import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import type { RefObject, DragEvent, MouseEvent } from 'react';
import { useEditor } from '@/store/editorStore';
import { render, type Cell, type Rect } from '@/renderer/render';
import { getTheme } from '@/lib/themes';
import type { AnsiColor, ComponentType } from '@/types/component';
import { getDef, COMPONENT_DEFS } from '@/lib/componentDefs';
import { getAnimatedColors } from '@/lib/colorAnimation';
import clsx from 'clsx';

const ANIMATED_TYPES = new Set(['text', 'asciitext', 'progressbar']);

const KNOWN_TYPES = new Set<string>(COMPONENT_DEFS.map((d) => d.type));

interface CellSize {
  w: number;
  h: number;
}

function useCellSize(probeRef: RefObject<HTMLSpanElement>): CellSize {
  const [size, setSize] = useState<CellSize>({ w: 8, h: 16 });
  const frameRef = useRef(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (!probeRef.current) return;
      const rect = probeRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // The probe contains 80 chars × 1 row.
      const next = { w: rect.width / 80, h: rect.height };
      setSize((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
    };

    const scheduleMeasure = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0;
        measure();
      });
    };

    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure);

    const probe = probeRef.current;
    const resizeObserver =
      probe && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => scheduleMeasure())
        : null;
    if (probe && resizeObserver) resizeObserver.observe(probe);

    const fonts = document.fonts;
    const onFontsLoaded = () => scheduleMeasure();
    fonts.ready.then(onFontsLoaded).catch(() => {});
    fonts.addEventListener('loadingdone', onFontsLoaded);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver?.disconnect();
      fonts.removeEventListener('loadingdone', onFontsLoaded);
    };
  }, [probeRef]);
  return size;
}

export function TerminalPreview() {
  const project = useEditor((s) => s.project);
  const selectedId = useEditor((s) => s.selectedId);
  const hoverId = useEditor((s) => s.hoverId);
  const select = useEditor((s) => s.select);
  const setHover = useEditor((s) => s.setHover);
  const addChild = useEditor((s) => s.addChild);
  const instantiateVariant = useEditor((s) => s.instantiateVariant);

  const theme = getTheme(project.theme);
  const result = useMemo(() => render(project), [project]);

  // Animation loop
  const animEpochRef = useRef<number>(performance.now());
  const [nowMs, setNowMs] = useState<number>(() => performance.now());

  const hasAnimations = useMemo(() =>
    Object.values(project.components).some(
      n => n.props.animation?.enabled && ANIMATED_TYPES.has(n.type),
    ),
  [project.components]);

  useEffect(() => {
    if (!hasAnimations) return;
    const id = setInterval(() => setNowMs(performance.now()), 50);
    return () => clearInterval(id);
  }, [hasAnimations]);

  const animOverlay = useMemo((): Map<string, AnsiColor> | null => {
    if (!hasAnimations) return null;
    const overlay = new Map<string, AnsiColor>();
    const elapsed = nowMs - animEpochRef.current;
    Object.values(project.components).forEach(node => {
      const anim = node.props.animation;
      if (!anim?.enabled || !ANIMATED_TYPES.has(node.type)) return;
      const rect = result.rects[node.id];
      if (!rect) return;
      const cycleCount = Math.floor(elapsed / anim.durationMs);
      if (!anim.loop && anim.loopCount != null && cycleCount >= anim.loopCount) return;
      const tick = (elapsed % anim.durationMs) / anim.durationMs;
      const colors = getAnimatedColors(anim, rect.w, tick);
      for (let row = rect.y; row < rect.y + rect.h; row++) {
        for (let col = rect.x; col < rect.x + rect.w; col++) {
          const c = colors[col - rect.x];
          if (c && c !== 'default') overlay.set(`${row},${col}`, c);
        }
      }
    });
    return overlay;
  }, [hasAnimations, nowMs, project.components, result.rects]);

  const probeRef = useRef<HTMLSpanElement>(null);
  const cell = useCellSize(probeRef);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Keyboard shortcuts: backspace deletes selected, ⌘Z undo, etc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable))
        return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        const node = useEditor.getState().project.components[selectedId];
        if (node && node.parentId && !node.locked) {
          useEditor.getState().remove(selectedId);
          e.preventDefault();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) useEditor.getState().redo();
        else useEditor.getState().undo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  // Find which container should receive a drop at the given client coords.
  const findDropTarget = (e: DragEvent): { parentId: string; index: number } | null => {
    const wrap = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - wrap.left) / cell.w);
    const y = Math.floor((e.clientY - wrap.top) / cell.h);
    // Find the smallest container containing (x, y).
    interface Best { parentId: string; index: number; area: number }
    let best: Best | null = null;
    Object.entries(result.rects).forEach(([id, r]) => {
      const node = project.components[id];
      if (!node) return;
      const def = getDef(node.type);
      if (!def.acceptsChildren) return;
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) {
        const area = r.w * r.h;
        if (!best || area < best.area) best = { parentId: id, index: node.children.length, area };
      }
    });
    return best ? { parentId: (best as Best).parentId, index: (best as Best).index } : null;
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-auto bg-ink-900 p-6 flex items-start justify-center">
      <div
        className="relative inline-block shadow-2xl rounded overflow-hidden"
        style={{ background: theme.bg, color: theme.fg }}
        onClick={() => select(null)}
        onDragOver={(e) => {
          const isComponent = e.dataTransfer.types.includes('application/x-tui-component');
          const isVariant = e.dataTransfer.types.includes('application/x-tui-variant');
          if (!isComponent && !isVariant) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          const target = findDropTarget(e);
          setDragOverId(target?.parentId ?? null);
        }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={(e) => {
          const variantId = e.dataTransfer.getData('application/x-tui-variant');
          if (variantId) {
            e.preventDefault();
            const target = findDropTarget(e);
            if (target) instantiateVariant(variantId, target.parentId, target.index);
            setDragOverId(null);
            return;
          }
          const type = e.dataTransfer.getData('application/x-tui-component');
          if (!type || !KNOWN_TYPES.has(type)) return;
          e.preventDefault();
          const target = findDropTarget(e);
          if (target) {
            addChild(target.parentId, type as ComponentType, target.index);
          }
          setDragOverId(null);
        }}
      >
        {/* hidden probe for measuring monospace cell size */}
        <span
          ref={probeRef}
          className="absolute -top-96 left-0 whitespace-pre"
          style={{ fontFamily: 'inherit', fontSize: 14, lineHeight: '18px' }}
          aria-hidden
        >
          {'M'.repeat(80)}
        </span>

        <CellGrid grid={result.grid} theme={theme} fontSize={14} lineHeight={18} animOverlay={animOverlay} />

        {/* Hover and drag-target overlays (no click handling, behind hitboxes) */}
        <Overlay
          rect={hoverId && hoverId !== selectedId ? result.rects[hoverId] ?? null : null}
          cell={{ w: cell.w, h: cell.h }}
          color={theme.accent}
          opacity={0.45}
          dashed
        />
        <Overlay
          rect={dragOverId ? result.rects[dragOverId] ?? null : null}
          cell={{ w: cell.w, h: cell.h }}
          color="#22c55e"
          opacity={0.6}
          dashed
        />

        {/* Click-targets per node, transparent overlay covering each rect. */}
        <div className="absolute inset-0 pointer-events-none">
          {Object.entries(result.rects).map(([id, r]) => (
            <NodeHitbox
              key={id}
              id={id}
              rect={r}
              cell={{ w: cell.w, h: cell.h }}
              onSelect={() => select(id)}
              onHover={(h) => setHover(h ? id : null)}
            />
          ))}
        </div>

        {/* Selection overlay last in DOM so it stacks on top and its onClick fires */}
        <Overlay
          rect={selectedId ? result.rects[selectedId] : null}
          cell={{ w: cell.w, h: cell.h }}
          color="#7aa2f7"
          dashed
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

function CellGrid({
  grid,
  theme,
  fontSize,
  lineHeight,
  animOverlay,
}: {
  grid: Cell[][];
  theme: ReturnType<typeof getTheme>;
  fontSize: number;
  lineHeight: number;
  animOverlay?: Map<string, AnsiColor> | null;
}) {
  const colorOf = (c?: AnsiColor) => {
    if (!c || c === 'default') return undefined;
    return theme.ansi[c];
  };

  // Group runs of same-style cells per row to keep DOM size manageable.
  return (
    <div
      className="font-mono whitespace-pre select-none"
      style={{ fontSize, lineHeight: `${lineHeight}px` }}
    >
      {grid.map((row, ri) => {
        const runs: { text: string; fg?: string; bg?: string; bold?: boolean }[] = [];
        let cur: (typeof runs)[number] | null = null;
        row.forEach((cell, ci) => {
          const animColor = animOverlay?.get(`${ri},${ci}`);
          const fg = colorOf(animColor ?? cell.fg);
          const bg = colorOf(cell.bg);
          if (cur && cur.fg === fg && cur.bg === bg && cur.bold === !!cell.bold) {
            cur.text += cell.ch;
          } else {
            cur = { text: cell.ch, fg, bg, bold: !!cell.bold };
            runs.push(cur);
          }
        });
        return (
          <div key={ri} style={{ height: lineHeight }}>
            {runs.map((run, i) => (
              <span
                key={i}
                style={{
                  color: run.fg ?? theme.fg,
                  background: run.bg,
                  fontWeight: run.bold ? 700 : undefined,
                }}
              >
                {run.text}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Overlay({
  rect,
  cell,
  color,
  dashed,
  opacity = 1,
  onClick,
}: {
  rect: Rect | null;
  cell: CellSize;
  color: string;
  dashed?: boolean;
  opacity?: number;
  onClick?: (e: MouseEvent) => void;
}) {
  if (!rect) return null;
  return (
    <div
      onClick={onClick}
      className={clsx(
        'absolute',
        onClick ? 'pointer-events-auto' : 'pointer-events-none',
        dashed ? 'border-dashed' : 'border-solid',
      )}
      style={{
        left: rect.x * cell.w,
        top: rect.y * cell.h,
        width: rect.w * cell.w,
        height: rect.h * cell.h,
        border: `1.5px ${dashed ? 'dashed' : 'solid'} ${color}`,
        opacity,
        boxSizing: 'border-box',
      }}
    />
  );
}

function NodeHitbox({
  id,
  rect,
  cell,
  onSelect,
  onHover,
}: {
  id: string;
  rect: Rect;
  cell: CellSize;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}) {
  return (
    <div
      data-node-id={id}
      className="absolute pointer-events-auto"
      style={{
        left: rect.x * cell.w,
        top: rect.y * cell.h,
        width: rect.w * cell.w,
        height: rect.h * cell.h,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    />
  );
}
