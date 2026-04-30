// Simulated terminal renderer.
//
// Walks the component tree, computes a row/column flex layout into character
// rects, and paints each node into a 2D cell grid. The grid is then rendered
// to the DOM as styled <span>s. This is intentionally a faithful approximation
// of how Textual / Bubble Tea would lay these widgets out — not a perfect
// reproduction.
import type {
  AnsiColor,
  BorderStyle,
  ComponentNode,
  ComponentProps,
  ProjectState,
} from '@/types/component';
import { BOX } from './boxStyles';

export interface Cell {
  ch: string;
  fg?: AnsiColor;
  bg?: AnsiColor;
  bold?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RenderResult {
  grid: Cell[][];
  // Map of nodeId -> rect, used by the canvas to draw selection overlays.
  rects: Record<string, Rect>;
  cols: number;
  rows: number;
}

const EMPTY: Cell = { ch: ' ' };

function makeGrid(cols: number, rows: number, bg?: AnsiColor): Cell[][] {
  const g: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) row.push(bg ? { ch: ' ', bg } : { ...EMPTY });
    g.push(row);
  }
  return g;
}

function setCell(grid: Cell[][], x: number, y: number, cell: Cell) {
  if (y < 0 || y >= grid.length) return;
  const row = grid[y];
  if (x < 0 || x >= row.length) return;
  row[x] = { ...row[x], ...cell };
}

function writeText(
  grid: Cell[][],
  x: number,
  y: number,
  text: string,
  maxW: number,
  fg?: AnsiColor,
  bg?: AnsiColor,
  bold?: boolean,
) {
  const t = text.slice(0, Math.max(0, maxW));
  for (let i = 0; i < t.length; i++) {
    setCell(grid, x + i, y, { ch: t[i] === '\n' ? ' ' : t[i], fg, bg, bold });
  }
}

function drawBox(grid: Cell[][], rect: Rect, style: BorderStyle, fg?: AnsiColor, bg?: AnsiColor, title?: string) {
  if (style === 'none' || rect.w < 2 || rect.h < 2) {
    if (bg) {
      for (let yy = rect.y; yy < rect.y + rect.h; yy++)
        for (let xx = rect.x; xx < rect.x + rect.w; xx++) setCell(grid, xx, yy, { ch: ' ', bg });
    }
    return;
  }
  const b = BOX[style];
  const { x, y, w, h } = rect;
  // background fill
  if (bg) {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) setCell(grid, xx, yy, { ch: ' ', bg });
  }
  // corners
  setCell(grid, x, y, { ch: b.tl, fg, bg });
  setCell(grid, x + w - 1, y, { ch: b.tr, fg, bg });
  setCell(grid, x, y + h - 1, { ch: b.bl, fg, bg });
  setCell(grid, x + w - 1, y + h - 1, { ch: b.br, fg, bg });
  // edges
  for (let xx = x + 1; xx < x + w - 1; xx++) {
    setCell(grid, xx, y, { ch: b.h, fg, bg });
    setCell(grid, xx, y + h - 1, { ch: b.h, fg, bg });
  }
  for (let yy = y + 1; yy < y + h - 1; yy++) {
    setCell(grid, x, yy, { ch: b.v, fg, bg });
    setCell(grid, x + w - 1, yy, { ch: b.v, fg, bg });
  }
  // title
  if (title) {
    const t = ` ${title.trim()} `.slice(0, w - 2);
    writeText(grid, x + 1, y, t, w - 2, fg, bg, true);
  }
}

// ────────────────────────────────────────────────────────────────────────
// Layout
// ────────────────────────────────────────────────────────────────────────

function intrinsicWidth(node: ComponentNode): number {
  const p = node.props;
  switch (node.type) {
    case 'text':
      return Math.max(1, (p.text ?? '').length);
    case 'button':
      return Math.max(4, (p.text ?? '').length + 4);
    case 'checkbox':
      return Math.max(4, (p.label ?? '').length + 4);
    case 'statusbar':
      return Math.max(8, (p.text ?? '').length);
    case 'progressbar':
      return 20;
    case 'tabs':
      return Math.max(8, (p.items ?? []).reduce((s, i) => s + i.length + 3, 1));
    case 'select':
    case 'input':
    case 'textarea':
      return 20;
    case 'list':
      return Math.max(10, (p.items ?? []).reduce((m, s) => Math.max(m, s.length + 4), 10));
    case 'table':
      return (p.columns ?? []).reduce((s, c) => s + Math.max(c.length, 4) + 3, 1);
    default:
      return 10;
  }
}

function intrinsicHeight(node: ComponentNode): number {
  const p = node.props;
  switch (node.type) {
    case 'text':
      return 1;
    case 'button':
      return 3;
    case 'checkbox':
      return 1;
    case 'statusbar':
      return 1;
    case 'progressbar':
      return 1;
    case 'tabs':
      return 1;
    case 'input':
    case 'select':
      return 3;
    case 'textarea':
      return 6;
    case 'list':
      return Math.max(3, (p.items ?? []).length + 2);
    case 'table':
      return (p.rows ?? []).length + 3;
    default:
      return 5;
  }
}

function borderInset(props: ComponentProps): number {
  return props.border && props.border !== 'none' ? 1 : 0;
}

// Recursive layout. Each call assigns `node.rect` and returns it.
function layoutNode(
  node: ComponentNode,
  components: Record<string, ComponentNode>,
  rect: Rect,
  rects: Record<string, Rect>,
) {
  rects[node.id] = rect;
  if (node.type !== 'container' && node.type !== 'modal') return;
  if (node.children.length === 0) return;

  const inset = borderInset(node.props);
  const padding = node.props.padding ?? 0;
  const innerX = rect.x + inset + padding;
  const innerY = rect.y + inset + padding;
  const innerW = Math.max(0, rect.w - 2 * (inset + padding));
  const innerH = Math.max(0, rect.h - 2 * (inset + padding));
  const direction = node.props.direction ?? 'column';
  const gap = node.props.gap ?? 0;

  const children = node.children
    .map((id) => components[id])
    .filter((c) => c && !c.hidden);

  // Compute requested sizes along the main axis.
  const totalGap = gap * Math.max(0, children.length - 1);
  const mainAvail = (direction === 'row' ? innerW : innerH) - totalGap;

  // First pass: account for fixed and auto sizes; collect 'fill' children.
  const sizes = new Array<number>(children.length).fill(0);
  const fillIdx: number[] = [];
  let used = 0;
  children.forEach((child, i) => {
    const sizeProp = direction === 'row' ? child.props.width : child.props.height;
    if (sizeProp === 'fill' || sizeProp === undefined) {
      fillIdx.push(i);
    } else if (typeof sizeProp === 'number') {
      sizes[i] = Math.max(1, sizeProp);
      used += sizes[i];
    } else {
      // auto
      const intr = direction === 'row' ? intrinsicWidth(child) : intrinsicHeight(child);
      sizes[i] = intr;
      used += sizes[i];
    }
  });
  const remaining = Math.max(0, mainAvail - used);
  if (fillIdx.length > 0) {
    const each = Math.floor(remaining / fillIdx.length);
    let leftover = remaining - each * fillIdx.length;
    fillIdx.forEach((i) => {
      sizes[i] = each + (leftover > 0 ? 1 : 0);
      if (leftover > 0) leftover--;
    });
  }

  // Cross axis: each child fills the cross axis (or honors a fixed size).
  let cursor = direction === 'row' ? innerX : innerY;
  children.forEach((child, i) => {
    let cx: number, cy: number, cw: number, ch: number;
    if (direction === 'row') {
      cw = sizes[i];
      const heightProp = child.props.height;
      ch =
        heightProp === undefined || heightProp === 'fill'
          ? innerH
          : typeof heightProp === 'number'
          ? Math.min(heightProp, innerH)
          : Math.min(intrinsicHeight(child), innerH);
      cx = cursor;
      cy = innerY;
      cursor += cw + gap;
    } else {
      ch = sizes[i];
      const widthProp = child.props.width;
      cw =
        widthProp === undefined || widthProp === 'fill'
          ? innerW
          : typeof widthProp === 'number'
          ? Math.min(widthProp, innerW)
          : Math.min(intrinsicWidth(child), innerW);
      cx = innerX;
      cy = cursor;
      cursor += ch + gap;
    }
    layoutNode(child, components, { x: cx, y: cy, w: cw, h: ch }, rects);
  });
}

// ────────────────────────────────────────────────────────────────────────
// Paint
// ────────────────────────────────────────────────────────────────────────

function paintNode(
  node: ComponentNode,
  components: Record<string, ComponentNode>,
  rects: Record<string, Rect>,
  grid: Cell[][],
) {
  if (node.hidden) return;
  const rect = rects[node.id];
  if (!rect || rect.w <= 0 || rect.h <= 0) return;
  const p = node.props;

  switch (node.type) {
    case 'container':
    case 'modal': {
      drawBox(grid, rect, p.border ?? 'none', p.fg, p.bg, p.title);
      node.children.forEach((cid) => {
        const child = components[cid];
        if (child) paintNode(child, components, rects, grid);
      });
      break;
    }
    case 'text': {
      writeText(grid, rect.x, rect.y, p.text ?? '', rect.w, p.fg, p.bg, p.bold);
      break;
    }
    case 'button': {
      drawBox(grid, rect, p.border ?? 'rounded', p.fg, p.bg);
      const label = p.text ?? 'Button';
      const inner = rect.w - 2;
      const tx = rect.x + 1 + Math.max(0, Math.floor((inner - label.length) / 2));
      const ty = rect.y + Math.floor(rect.h / 2);
      writeText(grid, tx, ty, label, inner, p.fg, p.bg, true);
      break;
    }
    case 'input': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg);
      const text = String(p.value ?? '') || p.placeholder || '';
      const dim = !p.value && p.placeholder ? 'brightBlack' : p.fg;
      writeText(grid, rect.x + 1, rect.y + Math.floor(rect.h / 2), text, rect.w - 2, dim, p.bg);
      break;
    }
    case 'textarea': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg);
      const lines = (String(p.value ?? '') || p.placeholder || '').split('\n');
      const dim = !p.value && p.placeholder ? 'brightBlack' : p.fg;
      lines.slice(0, rect.h - 2).forEach((line, i) => {
        writeText(grid, rect.x + 1, rect.y + 1 + i, line, rect.w - 2, dim, p.bg);
      });
      break;
    }
    case 'checkbox': {
      const mark = p.checked ? '[x]' : '[ ]';
      writeText(grid, rect.x, rect.y, `${mark} ${p.label ?? ''}`, rect.w, p.fg, p.bg);
      break;
    }
    case 'select': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg);
      const items = p.items ?? [];
      const idx = p.selectedIndex ?? 0;
      const cur = items[idx] ?? '';
      writeText(grid, rect.x + 1, rect.y + 1, cur, rect.w - 4, p.fg, p.bg);
      writeText(grid, rect.x + rect.w - 2, rect.y + 1, '▾', 1, p.fg, p.bg);
      break;
    }
    case 'list': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg, p.title);
      const items = p.items ?? [];
      const idx = p.selectedIndex ?? -1;
      items.slice(0, rect.h - 2).forEach((it, i) => {
        const sel = i === idx;
        writeText(
          grid,
          rect.x + 1,
          rect.y + 1 + i,
          (sel ? '› ' : '  ') + it,
          rect.w - 2,
          sel ? 'brightWhite' : p.fg,
          sel ? 'brightBlack' : p.bg,
          sel,
        );
      });
      break;
    }
    case 'tabs': {
      const items = p.items ?? [];
      const sel = p.selectedIndex ?? 0;
      let x = rect.x;
      items.forEach((it, i) => {
        const tab = ` ${it} `;
        const isSel = i === sel;
        writeText(grid, x, rect.y, tab, rect.w - (x - rect.x), isSel ? 'brightWhite' : p.fg ?? 'brightBlack', isSel ? 'blue' : p.bg, isSel);
        x += tab.length + 1;
        if (x - rect.x >= rect.w) return;
      });
      break;
    }
    case 'statusbar': {
      const text = (p.text ?? '').padEnd(rect.w, ' ').slice(0, rect.w);
      writeText(grid, rect.x, rect.y, text, rect.w, p.fg ?? 'black', p.bg ?? 'cyan');
      break;
    }
    case 'progressbar': {
      const ratio = Math.max(0, Math.min(1, p.progress ?? 0));
      const filled = Math.round(rect.w * ratio);
      for (let i = 0; i < rect.w; i++) {
        setCell(grid, rect.x + i, rect.y, {
          ch: i < filled ? '█' : '░',
          fg: p.fg ?? 'green',
          bg: p.bg,
        });
      }
      break;
    }
    case 'table': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg, p.title);
      const cols = p.columns ?? [];
      const rows = p.rows ?? [];
      if (cols.length === 0) break;
      const innerW = rect.w - 2;
      const colW = Math.floor(innerW / cols.length);
      // header
      cols.forEach((c, i) => {
        writeText(grid, rect.x + 1 + i * colW, rect.y + 1, c, colW, 'brightWhite', p.bg, true);
      });
      // separator
      for (let i = 0; i < innerW; i++) {
        setCell(grid, rect.x + 1 + i, rect.y + 2, { ch: '─', fg: p.fg ?? 'brightBlack', bg: p.bg });
      }
      rows.slice(0, rect.h - 4).forEach((row, ri) => {
        row.forEach((cell, ci) => {
          writeText(grid, rect.x + 1 + ci * colW, rect.y + 3 + ri, cell ?? '', colW, p.fg, p.bg);
        });
      });
      break;
    }
  }
}

export function render(project: ProjectState): RenderResult {
  const cols = project.termCols;
  const rows = project.termRows;
  const grid = makeGrid(cols, rows);
  const rects: Record<string, Rect> = {};
  const root = project.components[project.rootId];
  if (!root) return { grid, rects, cols, rows };
  layoutNode(root, project.components, { x: 0, y: 0, w: cols, h: rows }, rects);
  paintNode(root, project.components, rects, grid);
  return { grid, rects, cols, rows };
}
