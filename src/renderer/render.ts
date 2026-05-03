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
  TitleAlign,
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
  const existing = row[x];
  row[x] = {
    ch: cell.ch,
    fg: cell.fg ?? existing.fg,
    bg: cell.bg ?? existing.bg,
    bold: cell.bold ?? existing.bold,
  };
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

function drawBox(
  grid: Cell[][],
  rect: Rect,
  style: BorderStyle,
  fg?: AnsiColor,
  bg?: AnsiColor,
  title?: string,
  titleAlign?: TitleAlign,
  borderColor?: AnsiColor,
  titleColor?: AnsiColor,
) {
  // Use borderColor if specified, falling back to fg for border characters.
  const bfg = borderColor ?? fg;
  // Use titleColor if specified, falling back to bfg for title text.
  const tfg = titleColor ?? bfg;

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
  setCell(grid, x, y, { ch: b.tl, fg: bfg, bg });
  setCell(grid, x + w - 1, y, { ch: b.tr, fg: bfg, bg });
  setCell(grid, x, y + h - 1, { ch: b.bl, fg: bfg, bg });
  setCell(grid, x + w - 1, y + h - 1, { ch: b.br, fg: bfg, bg });
  // edges
  for (let xx = x + 1; xx < x + w - 1; xx++) {
    setCell(grid, xx, y, { ch: b.h, fg: bfg, bg });
    setCell(grid, xx, y + h - 1, { ch: b.h, fg: bfg, bg });
  }
  for (let yy = y + 1; yy < y + h - 1; yy++) {
    setCell(grid, x, yy, { ch: b.v, fg: bfg, bg });
    setCell(grid, x + w - 1, yy, { ch: b.v, fg: bfg, bg });
  }
  // title
  if (title) {
    const t = ` ${title.trim()} `.slice(0, w - 2);
    const align: TitleAlign = titleAlign ?? 'left';
    let tx = x + 1;
    if (align === 'center') tx = x + 1 + Math.floor((w - 2 - t.length) / 2);
    else if (align === 'right') tx = x + w - 1 - t.length;
    writeText(grid, tx, y, t, w - 2, tfg, bg, true);
  }
}

// ─── ASCII art font (3-row, basic uppercase + digits) ────────────────────────

const ASCII_FONT: Record<string, string[]> = {
  A: [' ▄█▄ ', '█   █', '█████'],
  B: ['████ ', '████ ', '████ '],
  C: [' ████', '█    ', ' ████'],
  D: ['████ ', '█   █', '████ '],
  E: ['█████', '████ ', '█████'],
  F: ['█████', '████ ', '█    '],
  G: [' ████', '█   █', ' ████'],
  H: ['█   █', '█████', '█   █'],
  I: ['█████', '  █  ', '█████'],
  J: ['  ███', '    █', '████ '],
  K: ['█  █ ', '███  ', '█  █ '],
  L: ['█    ', '█    ', '█████'],
  M: ['█   █', '██ ██', '█   █'],
  N: ['█   █', '██  █', '█   █'],
  O: [' ███ ', '█   █', ' ███ '],
  P: ['████ ', '████ ', '█    '],
  Q: [' ███ ', '█   █', ' ████'],
  R: ['████ ', '████ ', '█   █'],
  S: [' ████', ' ███ ', '████ '],
  T: ['█████', '  █  ', '  █  '],
  U: ['█   █', '█   █', ' ███ '],
  V: ['█   █', '█   █', ' █   '],
  W: ['█   █', '██ ██', '█   █'],
  X: ['█   █', ' ███ ', '█   █'],
  Y: ['█   █', ' ███ ', '  █  '],
  Z: ['████ ', ' ███ ', '  ███'],
  '0': [' ███ ', '█   █', ' ███ '],
  '1': [' ██  ', '  █  ', '█████'],
  '2': ['████ ', ' ███ ', ' ████'],
  '3': ['████ ', ' ████', '████ '],
  '4': ['█   █', '█████', '    █'],
  '5': ['█████', '████ ', ' ████'],
  '6': [' ████', '████ ', ' ████'],
  '7': ['█████', '   █ ', '   █ '],
  '8': [' ███ ', ' ███ ', ' ███ '],
  '9': [' ████', ' ████', ' ████'],
  ' ': ['     ', '     ', '     '],
  '!': ['  █  ', '  █  ', '  ▀  '],
  '?': [' ███ ', '  ██ ', '  ▀  '],
  '.': ['     ', '     ', '  █  '],
  '-': ['     ', ' ███ ', '     '],
};

function renderAsciiText(
  grid: Cell[][],
  rect: Rect,
  text: string,
  fg?: AnsiColor,
  bg?: AnsiColor,
) {
  const upper = text.toUpperCase();
  const charW = 6; // 5 chars + 1 gap
  let cx = rect.x;
  for (const ch of upper) {
    if (cx + charW > rect.x + rect.w) break;
    const glyph = ASCII_FONT[ch] ?? ASCII_FONT[' ']!;
    for (let row = 0; row < 3; row++) {
      const line = glyph[row] ?? '     ';
      const y = rect.y + row;
      if (y >= rect.y + rect.h) break;
      writeText(grid, cx, y, line, charW, fg, bg);
    }
    cx += charW;
  }
}

// Spinner frames per style
const SPINNER_FRAMES: Record<string, string[]> = {
  dots:   ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line:   ['|', '/', '-', '\\'],
  braille:['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  arc:    ['◜', '◠', '◝', '◞', '◡', '◟'],
};

// Toast variant icons and default colors
const TOAST_STYLE: Record<string, { icon: string; fg: AnsiColor; bg: AnsiColor }> = {
  info:    { icon: 'ℹ', fg: 'white',      bg: 'blue'   },
  success: { icon: '✓', fg: 'black',      bg: 'green'  },
  warning: { icon: '⚠', fg: 'black',      bg: 'yellow' },
  error:   { icon: '✗', fg: 'white',      bg: 'red'    },
};

// ────────────────────────────────────────────────────────────────────────
// Layout
// ────────────────────────────────────────────────────────────────────────

function intrinsicWidth(node: ComponentNode): number {
  const p = node.props;
  switch (node.type) {
    case 'text':
      if (p.richSpans?.length) return p.richSpans.reduce((s, sp) => s + sp.text.length, 0);
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
    case 'spinner':
      return 3;
    case 'timer':
      return Math.max(8, (p.timerValue ?? '00:00').length);
    case 'divider':
      return 10;
    case 'toast':
      return Math.max(20, (p.text ?? '').length + 6);
    case 'filepicker':
      return 30;
    case 'asciitext':
      return Math.max(10, (p.text ?? '').length * 6);
    case 'viewport':
    case 'grid':
      return 20;
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
    case 'spinner':
      return 1;
    case 'timer':
      return 1;
    case 'divider':
      return 1;
    case 'toast':
      return 3;
    case 'filepicker':
      return 8;
    case 'asciitext':
      return 5;
    case 'viewport':
      return 8;
    case 'grid':
      return 6;
    default:
      return 5;
  }
}

function borderInset(props: ComponentProps): number {
  return props.border && props.border !== 'none' ? 1 : 0;
}

const LAYOUT_TYPES = new Set(['container', 'modal', 'viewport', 'grid']);

// Recursive layout. Each call assigns node's rect and returns it.
function layoutNode(
  node: ComponentNode,
  components: Record<string, ComponentNode>,
  rect: Rect,
  rects: Record<string, Rect>,
) {
  rects[node.id] = rect;
  if (!LAYOUT_TYPES.has(node.type)) return;

  // Grid type: 2D grid layout
  if (node.type === 'grid') {
    layoutGrid(node, components, rect, rects);
    return;
  }

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
    .filter((c) => c && !c.hidden && !c.props.absolute);

  // Layout absolute children separately
  node.children
    .map((id) => components[id])
    .filter((c) => c && !c.hidden && c.props.absolute)
    .forEach((child) => {
      const ax = innerX + (child.props.x ?? 0);
      const ay = innerY + (child.props.y ?? 0);
      const aw = typeof child.props.width === 'number' ? child.props.width : intrinsicWidth(child);
      const ah = typeof child.props.height === 'number' ? child.props.height : intrinsicHeight(child);
      layoutNode(child, components, { x: ax, y: ay, w: aw, h: ah }, rects);
    });

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

  // justify: center — offset the main-axis start so children are centered as a group.
  const justify = node.props.justify;
  const totalUsed = sizes.reduce((s, v) => s + v, 0) + totalGap;
  const mainOffset =
    justify === 'center'
      ? Math.floor(((direction === 'row' ? innerW : innerH) - totalUsed) / 2)
      : 0;

  const align = node.props.align;

  // Cross axis: each child fills the cross axis (or honors a fixed size).
  let cursor = (direction === 'row' ? innerX : innerY) + Math.max(0, mainOffset);
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
      // align:center on cross axis (vertical) for row direction
      cy = align === 'center' ? innerY + Math.floor((innerH - ch) / 2) : innerY;
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
      // align:center on cross axis (horizontal) for column direction
      cx = align === 'center' ? innerX + Math.floor((innerW - cw) / 2) : innerX;
      cy = cursor;
      cursor += ch + gap;
    }
    layoutNode(child, components, { x: cx, y: cy, w: cw, h: ch }, rects);
  });
}

function layoutGrid(
  node: ComponentNode,
  components: Record<string, ComponentNode>,
  rect: Rect,
  rects: Record<string, Rect>,
) {
  const cols = Math.max(1, node.props.gridCols ?? 2);
  const gap = node.props.gridGap ?? 0;
  const inset = borderInset(node.props);
  const padding = node.props.padding ?? 0;
  const innerX = rect.x + inset + padding;
  const innerY = rect.y + inset + padding;
  const innerW = Math.max(0, rect.w - 2 * (inset + padding));
  const innerH = Math.max(0, rect.h - 2 * (inset + padding));

  const children = node.children
    .map((id) => components[id])
    .filter((c) => c && !c.hidden);

  const totalGapW = gap * (cols - 1);
  const colW = Math.max(1, Math.floor((innerW - totalGapW) / cols));
  // Compute row heights
  const rowCount = Math.ceil(children.length / cols);
  const totalGapH = gap * (rowCount - 1);
  const rowH = rowCount > 0 ? Math.max(1, Math.floor((innerH - totalGapH) / rowCount)) : innerH;

  children.forEach((child, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = innerX + col * (colW + gap);
    const cy = innerY + row * (rowH + gap);
    layoutNode(child, components, { x: cx, y: cy, w: colW, h: rowH }, rects);
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
    case 'modal':
    case 'viewport': {
      drawBox(grid, rect, p.border ?? 'none', p.fg, p.bg, p.title, p.titleAlign, p.borderColor, p.titleColor);
      node.children.forEach((cid) => {
        const child = components[cid];
        if (child) paintNode(child, components, rects, grid);
      });
      break;
    }
    case 'grid': {
      drawBox(grid, rect, p.border ?? 'none', p.fg, p.bg, p.title, p.titleAlign, p.borderColor, p.titleColor);
      node.children.forEach((cid) => {
        const child = components[cid];
        if (child) paintNode(child, components, rects, grid);
      });
      break;
    }
    case 'text': {
      if (p.richSpans?.length) {
        let cx = rect.x;
        for (const span of p.richSpans) {
          const avail = Math.max(0, rect.x + rect.w - cx);
          if (avail <= 0) break;
          writeText(grid, cx, rect.y, span.text, avail, span.fg, span.bg, span.bold);
          cx += span.text.length;
        }
      } else {
        writeText(grid, rect.x, rect.y, p.text ?? '', rect.w, p.fg, p.bg, p.bold);
      }
      break;
    }
    case 'button': {
      drawBox(grid, rect, p.border ?? 'rounded', p.fg, p.bg, undefined, undefined, p.borderColor);
      const label = p.text ?? 'Button';
      const inner = rect.w - 2;
      const tx = rect.x + 1 + Math.max(0, Math.floor((inner - label.length) / 2));
      const ty = rect.y + Math.floor(rect.h / 2);
      writeText(grid, tx, ty, label, inner, p.fg, p.bg, true);
      break;
    }
    case 'input': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg, undefined, undefined, p.borderColor);
      const text = String(p.value ?? '') || p.placeholder || '';
      const dim = !p.value && p.placeholder ? 'brightBlack' : p.fg;
      writeText(grid, rect.x + 1, rect.y + Math.floor(rect.h / 2), text, rect.w - 2, dim, p.bg);
      break;
    }
    case 'textarea': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg, undefined, undefined, p.borderColor);
      const lines = (String(p.value ?? '') || p.placeholder || '').split('\n');
      const dim = !p.value && p.placeholder ? 'brightBlack' : p.fg;
      const inset = p.border && p.border !== 'none' ? 1 : 0;
      lines.slice(0, Math.max(0, rect.h - 2 * inset)).forEach((line, i) => {
        writeText(grid, rect.x + inset, rect.y + inset + i, line, Math.max(0, rect.w - 2 * inset), dim, p.bg);
      });
      break;
    }
    case 'checkbox': {
      const mark = p.checked ? '[x]' : '[ ]';
      writeText(grid, rect.x, rect.y, `${mark} ${p.label ?? ''}`, rect.w, p.fg, p.bg);
      break;
    }
    case 'select': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg, undefined, undefined, p.borderColor);
      const items = p.items ?? [];
      const idx = p.selectedIndex ?? 0;
      const cur = items[idx] ?? '';
      writeText(grid, rect.x + 1, rect.y + 1, cur, rect.w - 4, p.fg, p.bg);
      writeText(grid, rect.x + rect.w - 2, rect.y + 1, '▾', 1, p.fg, p.bg);
      break;
    }
    case 'list': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg, p.title, p.titleAlign, p.borderColor, p.titleColor);
      const items = p.items ?? [];
      const idx = p.selectedIndex ?? -1;
      const inset = p.border && p.border !== 'none' ? 1 : 0;
      items.slice(0, Math.max(0, rect.h - 2 * inset)).forEach((it, i) => {
        const sel = i === idx;
        writeText(
          grid,
          rect.x + inset,
          rect.y + inset + i,
          (sel ? '› ' : '  ') + it,
          Math.max(0, rect.w - 2 * inset),
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
      if (p.richSpans?.length) {
        // Rich-text statusbar: render each span
        let cx = rect.x;
        for (const span of p.richSpans) {
          const avail = Math.max(0, rect.x + rect.w - cx);
          if (avail <= 0) break;
          writeText(grid, cx, rect.y, span.text, avail, span.fg, span.bg, span.bold);
          cx += span.text.length;
        }
        // Fill remainder with default statusbar colors
        if (cx < rect.x + rect.w) {
          const pad = ' '.repeat(rect.x + rect.w - cx);
          writeText(grid, cx, rect.y, pad, pad.length, p.fg ?? 'black', p.bg ?? 'cyan');
        }
      } else {
        const text = (p.text ?? '').padEnd(rect.w, ' ').slice(0, rect.w);
        writeText(grid, rect.x, rect.y, text, rect.w, p.fg ?? 'black', p.bg ?? 'cyan');
      }
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
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg, p.title, p.titleAlign, p.borderColor, p.titleColor);
      const cols = p.columns ?? [];
      const rows = p.rows ?? [];
      if (cols.length === 0) break;
      const inset = p.border && p.border !== 'none' ? 1 : 0;
      const innerW = Math.max(0, rect.w - 2 * inset);
      const colW = Math.floor(innerW / cols.length);
      // header — only if there is a row inside the widget bounds
      if (rect.h > inset) {
        cols.forEach((c, i) => {
          writeText(grid, rect.x + inset + i * colW, rect.y + inset, c, colW, 'brightWhite', p.bg, true);
        });
      }
      // separator — only if there is a row below the header
      if (rect.h > inset + 1) {
        for (let i = 0; i < innerW; i++) {
          setCell(grid, rect.x + inset + i, rect.y + inset + 1, { ch: '─', fg: p.fg ?? 'brightBlack', bg: p.bg });
        }
      }
      // data rows
      rows.slice(0, Math.max(0, rect.h - 2 * inset - 2)).forEach((row, ri) => {
        row.forEach((cell, ci) => {
          writeText(grid, rect.x + inset + ci * colW, rect.y + inset + 2 + ri, cell ?? '', colW, p.fg, p.bg);
        });
      });
      break;
    }
    case 'spinner': {
      const style = p.spinnerStyle ?? 'dots';
      const frames = SPINNER_FRAMES[style] ?? SPINNER_FRAMES['dots']!;
      const frame = frames[0]!; // static preview shows first frame
      writeText(grid, rect.x, rect.y, frame, rect.w, p.fg ?? 'cyan', p.bg);
      if (p.text) {
        writeText(grid, rect.x + 2, rect.y, ' ' + p.text, rect.w - 2, p.fg, p.bg);
      }
      break;
    }
    case 'divider': {
      const orientation = p.orientation ?? 'horizontal';
      if (orientation === 'vertical') {
        for (let yy = rect.y; yy < rect.y + rect.h; yy++) {
          setCell(grid, rect.x, yy, { ch: '│', fg: p.fg ?? p.borderColor, bg: p.bg });
        }
      } else {
        const divFg = p.fg ?? p.borderColor;
        if (p.text) {
          const label = ` ${p.text} `;
          const align: TitleAlign = p.titleAlign ?? 'center';
          let labelX = rect.x + 1;
          if (align === 'center') {
            labelX = rect.x + Math.floor((rect.w - label.length) / 2);
          } else if (align === 'right') {
            labelX = rect.x + rect.w - label.length - 1;
          }
          // Draw full horizontal line first
          for (let xx = rect.x; xx < rect.x + rect.w; xx++) {
            setCell(grid, xx, rect.y, { ch: '─', fg: divFg, bg: p.bg });
          }
          // Overwrite label position
          writeText(grid, labelX, rect.y, label, label.length, p.fg ?? 'default', p.bg);
        } else {
          for (let xx = rect.x; xx < rect.x + rect.w; xx++) {
            setCell(grid, xx, rect.y, { ch: '─', fg: divFg, bg: p.bg });
          }
        }
      }
      break;
    }
    case 'toast': {
      const variant = p.toastVariant ?? 'info';
      const style = TOAST_STYLE[variant] ?? TOAST_STYLE['info']!;
      const toastFg = p.fg ?? style.fg;
      const toastBg = p.bg ?? style.bg;
      drawBox(grid, rect, p.border ?? 'rounded', toastFg, toastBg, undefined, undefined, p.borderColor, p.titleColor);
      const icon = style.icon;
      const msg = p.text ?? '';
      const inner = rect.w - 4;
      const ty = rect.y + Math.floor(rect.h / 2);
      writeText(grid, rect.x + 1, ty, `${icon} ${msg}`, inner, toastFg, toastBg, p.bold);
      break;
    }
    case 'timer': {
      const value = p.timerValue ?? '00:00';
      drawBox(grid, rect, p.border ?? 'none', p.fg, p.bg, p.title, p.titleAlign, p.borderColor, p.titleColor);
      const inset = p.border && p.border !== 'none' ? 1 : 0;
      const ty = rect.y + inset + Math.floor((rect.h - 2 * inset) / 2);
      const tx = rect.x + inset + Math.floor((rect.w - 2 * inset - value.length) / 2);
      writeText(grid, tx, ty, value, rect.w - 2 * inset, p.fg ?? 'brightCyan', p.bg, p.bold);
      break;
    }
    case 'filepicker': {
      drawBox(grid, rect, p.border ?? 'single', p.fg, p.bg, p.title ?? ' Files ', p.titleAlign, p.borderColor, p.titleColor);
      const inset = p.border && p.border !== 'none' ? 1 : 0;
      const files = p.items ?? ['📁 Documents', '📁 Downloads', '📄 file.txt', '📄 notes.md'];
      files.slice(0, Math.max(0, rect.h - 2 * inset)).forEach((f, i) => {
        writeText(grid, rect.x + inset + 1, rect.y + inset + i, f, rect.w - 2 * inset - 2, p.fg, p.bg);
      });
      break;
    }
    case 'asciitext': {
      renderAsciiText(grid, rect, p.text ?? 'TEXT', p.fg, p.bg);
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
