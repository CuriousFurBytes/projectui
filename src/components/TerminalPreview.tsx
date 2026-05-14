import { useMemo, useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import type { RefObject, DragEvent, MouseEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useEditor } from '@/store/editorStore';
import { render, type Cell, type Rect } from '@/renderer/render';
import { getTheme } from '@/lib/themes';
import type { AnsiColor, ComponentType } from '@/types/component';
import { getDef, COMPONENT_DEFS } from '@/lib/componentDefs';
import { buildAnimationOverlay, hasNodeAnimationEnabled } from '@/lib/animationOverlay';
import { TERMINAL_CANVAS_FONT_STACK, TERMINAL_CANVAS_FONT_STYLE } from '@/lib/fonts';
import clsx from 'clsx';

const KNOWN_TYPES = new Set<string>(COMPONENT_DEFS.map((d) => d.type));

interface CellSize { w: number; h: number }

function useCellSize(probeRef: RefObject<HTMLSpanElement>): CellSize {
  const [size, setSize] = useState<CellSize>({ w: 8, h: 16 });
  const frameRef = useRef(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (!probeRef.current) return;
      const rect = probeRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const next = { w: rect.width / 80, h: rect.height };
      setSize((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
    };
    const scheduleMeasure = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => { frameRef.current = 0; measure(); });
    };
    scheduleMeasure();
    window.addEventListener('resize', scheduleMeasure);
    const probe = probeRef.current;
    const ro = probe && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => scheduleMeasure()) : null;
    if (probe && ro) ro.observe(probe);
    const fonts = document.fonts;
    const onFonts = () => scheduleMeasure();
    fonts.ready.then(onFonts).catch(() => {});
    fonts.addEventListener('loadingdone', onFonts);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', scheduleMeasure);
      ro?.disconnect();
      fonts.removeEventListener('loadingdone', onFonts);
    };
  }, [probeRef]);
  return size;
}

// Text-editable types for B-25 double-click editing
const INLINE_EDIT_PROP: Partial<Record<ComponentType, string>> = {
  text: 'text',
  button: 'text',
  input: 'placeholder',
  textarea: 'placeholder',
  checkbox: 'label',
};

interface InlineEdit { id: string; prop: string; value: string }

export function TerminalPreview({
  zoom,
  animPaused,
  showFocusOrder,
}: {
  zoom: number;
  animPaused: boolean;
  showFocusOrder: boolean;
}) {
  const project = useEditor((s) => s.project);
  const selectedId = useEditor((s) => s.selectedId);
  const hoverId = useEditor((s) => s.hoverId);
  const selectedIds = useEditor((s) => s.selectedIds);
  const select = useEditor((s) => s.select);
  const setHover = useEditor((s) => s.setHover);
  const addChild = useEditor((s) => s.addChild);
  const instantiateVariant = useEditor((s) => s.instantiateVariant);
  const updateProps = useEditor((s) => s.updateProps);
  const toggleSelectId = useEditor((s) => s.toggleSelectId);

  const theme = getTheme(project.theme);
  const result = useMemo(() => render(project), [project]);

  // Animation loop
  const animEpochRef = useRef<number>(performance.now());
  const [nowMs, setNowMs] = useState<number>(() => performance.now());

  const hasAnimations = useMemo(() =>
    Object.values(project.components).some(
      n => hasNodeAnimationEnabled(n),
    ),
  [project.components]);

  useEffect(() => {
    if (!hasAnimations || animPaused) return;
    const id = setInterval(() => setNowMs(performance.now()), 50);
    return () => clearInterval(id);
  }, [hasAnimations, animPaused]);

  const animOverlay = useMemo((): Map<string, AnsiColor> | null => {
    if (!hasAnimations || animPaused) return null;
    const elapsed = nowMs - animEpochRef.current;
    return buildAnimationOverlay(project.components, result.rects, elapsed);
  }, [hasAnimations, animPaused, nowMs, project.components, result.rects]);

  const probeRef = useRef<HTMLSpanElement>(null);
  const cell = useCellSize(probeRef);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // B-25: inline text editing state
  const [inlineEdit, setInlineEdit] = useState<InlineEdit | null>(null);

  const commitInlineEdit = useCallback(() => {
    if (!inlineEdit) return;
    updateProps(inlineEdit.id, { [inlineEdit.prop]: inlineEdit.value });
    setInlineEdit(null);
  }, [inlineEdit, updateProps]);

  // A-L: canvas resize drag state
  const [resizeDrag, setResizeDrag] = useState<{ edge: 'right' | 'bottom'; startX: number; startY: number; startCols: number; startRows: number } | null>(null);
  const setTermSize = useEditor((s) => s.setTermSize);

  useEffect(() => {
    if (!resizeDrag) return;
    const onMove = (e: PointerEvent) => {
      const { edge, startX, startY, startCols, startRows } = resizeDrag;
      if (edge === 'right') {
        const dx = e.clientX - startX;
        const newCols = Math.max(20, Math.round(startCols + dx / (cell.w * zoom)));
        setTermSize(newCols, project.termRows);
      } else {
        const dy = e.clientY - startY;
        const newRows = Math.max(5, Math.round(startRows + dy / (cell.h * zoom)));
        setTermSize(project.termCols, newRows);
      }
    };
    const onUp = () => setResizeDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [resizeDrag, cell, zoom, setTermSize, project.termCols, project.termRows]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
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
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && selectedId) {
        useEditor.getState().copyNode(selectedId);
        e.preventDefault();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        const state = useEditor.getState();
        if (state.clipboardId) {
          const parentId = selectedId ?? state.project.rootId;
          state.pasteNode(parentId);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const findDropTarget = (e: DragEvent): { parentId: string; index: number } | null => {
    const wrap = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - wrap.left) / (cell.w * zoom));
    const y = Math.floor((e.clientY - wrap.top) / (cell.h * zoom));
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

  // Focus-order: collect focusable nodes in tree order
  const focusOrder = useMemo(() => {
    if (!showFocusOrder) return [];
    const order: string[] = [];
    const walk = (id: string) => {
      const node = project.components[id];
      if (!node || node.hidden) return;
      if (node.props.focusable) order.push(id);
      node.children.forEach(walk);
    };
    walk(project.rootId);
    return order;
  }, [showFocusOrder, project.components, project.rootId]);

  const canvasWidth = project.termCols * cell.w;
  const canvasHeight = project.termRows * cell.h;

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-auto bg-ink-900 p-6 flex items-start justify-center">
      <div
        className="relative"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
      >
        <div
          className="relative inline-block shadow-2xl rounded overflow-hidden"
          style={{ background: theme.bg, color: theme.fg }}
          onClick={() => { if (!inlineEdit) select(null); }}
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
            if (target) addChild(target.parentId, type as ComponentType, target.index);
            setDragOverId(null);
          }}
        >
          {/* hidden probe for measuring monospace cell size */}
          <span
            ref={probeRef}
            className="absolute -top-96 left-0 whitespace-pre"
            style={{ ...TERMINAL_CANVAS_FONT_STYLE, fontSize: 14, lineHeight: '18px' }}
            aria-hidden
          >
            {'M'.repeat(80)}
          </span>

          <CellGrid grid={result.grid} theme={theme} fontSize={14} lineHeight={18} animOverlay={animOverlay} />

          {/* Hover overlay */}
          <Overlay
            rect={hoverId && hoverId !== selectedId ? result.rects[hoverId] ?? null : null}
            cell={cell}
            color={theme.accent}
            opacity={0.45}
            dashed
          />
          {/* Drop target overlay */}
          <Overlay
            rect={dragOverId ? result.rects[dragOverId] ?? null : null}
            cell={cell}
            color="#22c55e"
            opacity={0.6}
            dashed
          />

          {/* Click targets */}
          <div className="absolute inset-0 pointer-events-none">
            {Object.entries(result.rects).map(([id, r]) => (
              <NodeHitbox
                key={id}
                id={id}
                rect={r}
                cell={cell}
                onSelect={(shiftKey) => {
                  if (shiftKey) {
                    toggleSelectId(id);
                  } else {
                    select(id);
                    useEditor.getState().clearMultiSelect();
                  }
                }}
                onHover={(h) => setHover(h ? id : null)}
                onDoubleClick={() => {
                  const node = project.components[id];
                  if (!node) return;
                  const prop = INLINE_EDIT_PROP[node.type];
                  if (!prop) return;
                  const val = String((node.props as Record<string, unknown>)[prop] ?? '');
                  setInlineEdit({ id, prop, value: val });
                }}
              />
            ))}
          </div>

          {/* Multi-select overlays */}
          {Array.from(selectedIds).map((id) => (
            <Overlay
              key={id}
              rect={result.rects[id] ?? null}
              cell={cell}
              color="#f97316"
              opacity={0.6}
              dashed
            />
          ))}

          {/* Selection overlay */}
          <Overlay
            rect={selectedId ? result.rects[selectedId] : null}
            cell={cell}
            color="#7aa2f7"
            dashed
            onClick={(e) => e.stopPropagation()}
          />

          {/* B-25: Inline text editor */}
          {inlineEdit && result.rects[inlineEdit.id] && (() => {
            const r = result.rects[inlineEdit.id];
            return (
              <input
                key={inlineEdit.id}
                autoFocus
                className="absolute font-mono text-sm bg-ink-800 text-white border border-accent outline-none px-1"
                style={{
                  left: r.x * cell.w,
                  top: r.y * cell.h,
                  width: r.w * cell.w,
                  height: cell.h,
                  ...TERMINAL_CANVAS_FONT_STYLE,
                  fontSize: 14,
                  lineHeight: '18px',
                  zIndex: 50,
                }}
                value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onBlur={commitInlineEdit}
                onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') commitInlineEdit();
                  if (e.key === 'Escape') setInlineEdit(null);
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              />
            );
          })()}

          {/* A-N: Focus-order badges */}
          {showFocusOrder && focusOrder.map((id, i) => {
            const r = result.rects[id];
            if (!r) return null;
            return (
              <div
                key={id}
                className="absolute pointer-events-none flex items-center justify-center text-[9px] font-bold rounded-sm bg-accent text-ink-900"
                style={{ left: r.x * cell.w, top: r.y * cell.h, width: 14, height: 14, zIndex: 40 }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* A-L: Canvas resize handles */}
        {/* Right edge handle */}
        <div
          className="absolute top-0 cursor-ew-resize bg-accent/40 hover:bg-accent/70 transition-colors"
          style={{ left: canvasWidth, width: 6, height: canvasHeight, zIndex: 10 }}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setResizeDrag({ edge: 'right', startX: e.clientX, startY: e.clientY, startCols: project.termCols, startRows: project.termRows });
          }}
          title="Drag to resize width"
        />
        {/* Bottom edge handle */}
        <div
          className="absolute left-0 cursor-ns-resize bg-accent/40 hover:bg-accent/70 transition-colors"
          style={{ top: canvasHeight, width: canvasWidth, height: 6, zIndex: 10 }}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setResizeDrag({ edge: 'bottom', startX: e.clientX, startY: e.clientY, startCols: project.termCols, startRows: project.termRows });
          }}
          title="Drag to resize height"
        />
        {/* Corner handle */}
        <div
          className="absolute cursor-nwse-resize bg-accent/60 hover:bg-accent rounded-br-sm"
          style={{ left: canvasWidth, top: canvasHeight, width: 8, height: 8, zIndex: 11 }}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setResizeDrag({ edge: 'right', startX: e.clientX, startY: e.clientY, startCols: project.termCols, startRows: project.termRows });
          }}
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

  return (
    <div
      className="font-mono whitespace-pre select-none"
      style={{ ...TERMINAL_CANVAS_FONT_STYLE, fontFamily: TERMINAL_CANVAS_FONT_STACK, fontSize, lineHeight: `${lineHeight}px` }}
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
                  backgroundColor: run.bg,
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
  onDoubleClick,
}: {
  id: string;
  rect: Rect;
  cell: CellSize;
  onSelect: (shiftKey: boolean) => void;
  onHover: (hovered: boolean) => void;
  onDoubleClick: () => void;
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
        onSelect(e.shiftKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    />
  );
}
