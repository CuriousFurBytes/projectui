// Generates a C++ ncurses application from the project tree.
//
// Compile & run:
//   g++ -o app app.cpp -lncurses
//   ./app
import type { ComponentNode, ProjectState, AnsiColor } from '@/types/component';

const INDENT = '    ';

function cStr(s: string): string {
  // Escape backslashes and double-quotes for a C string literal.
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

function nodeId(node: ComponentNode): string {
  const sanitized = (node.name ?? node.type).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const safe = sanitized === '' || /^[0-9]/.test(sanitized) ? `_${sanitized}` : sanitized;
  return `${safe}_${node.id.split('_').pop()}`;
}

// Maps AnsiColor names to ncurses COLOR_* constants.
function ansiToNcursesColor(color: AnsiColor | undefined): string {
  if (!color || color === 'default') return 'COLOR_WHITE';
  const map: Record<string, string> = {
    black: 'COLOR_BLACK',
    red: 'COLOR_RED',
    green: 'COLOR_GREEN',
    yellow: 'COLOR_YELLOW',
    blue: 'COLOR_BLUE',
    magenta: 'COLOR_MAGENTA',
    cyan: 'COLOR_CYAN',
    white: 'COLOR_WHITE',
    brightBlack: 'COLOR_BLACK',
    brightRed: 'COLOR_RED',
    brightGreen: 'COLOR_GREEN',
    brightYellow: 'COLOR_YELLOW',
    brightBlue: 'COLOR_BLUE',
    brightMagenta: 'COLOR_MAGENTA',
    brightCyan: 'COLOR_CYAN',
    brightWhite: 'COLOR_WHITE',
  };
  return map[color] ?? 'COLOR_WHITE';
}

interface ColorPair {
  fg: AnsiColor | undefined;
  bg: AnsiColor | undefined;
  index: number;
}

// Collect all unique fg/bg combos used across the tree so we can
// call init_pair() for each one at program startup.
function collectColorPairs(
  node: ComponentNode,
  components: Record<string, ComponentNode>,
  pairs: Map<string, ColorPair>,
): void {
  const p = node.props;
  const fg = p.fg;
  const bg = p.bg;
  if ((fg && fg !== 'default') || (bg && bg !== 'default')) {
    const key = `${fg ?? 'default'}:${bg ?? 'default'}`;
    if (!pairs.has(key)) {
      pairs.set(key, { fg, bg, index: pairs.size + 1 });
    }
  }
  node.children
    .map((cid) => components[cid])
    .filter(Boolean)
    .forEach((c) => collectColorPairs(c, components, pairs));
}

function sizeVal(size: number | string | undefined, fallback: number): number {
  if (typeof size === 'number') return size;
  return fallback;
}

function emitNode(
  node: ComponentNode,
  components: Record<string, ComponentNode>,
  pairs: Map<string, ColorPair>,
  lines: string[],
): void {
  const p = node.props;
  const win = nodeId(node);
  const x = sizeVal(p.x, 0);
  const y = sizeVal(p.y, 0);
  const width = sizeVal(p.width, 40);
  const height = sizeVal(p.height, 10);
  const hasBorder = p.border && p.border !== 'none';

  switch (node.type) {
    case 'container':
    case 'modal': {
      lines.push(`WINDOW* ${win} = newwin(${height}, ${width}, ${y}, ${x});`);
      if (hasBorder) {
        lines.push(`box(${win}, 0, 0);`);
        if (p.title) {
          lines.push(`mvwprintw(${win}, 0, 1, ${cStr(` ${p.title} `)});`);
        }
      }
      lines.push(`wrefresh(${win});`);
      // Recurse into children
      node.children
        .map((cid) => components[cid])
        .filter(Boolean)
        .forEach((c) => emitNode(c, components, pairs, lines));
      break;
    }

    case 'text': {
      lines.push(`mvwprintw(stdscr, ${y}, ${x}, "%s", ${cStr(p.text ?? '')});`);
      break;
    }

    case 'button': {
      const label = p.text ?? 'Button';
      lines.push(`mvwprintw(stdscr, ${y}, ${x}, "[ %s ]", ${cStr(label)});`);
      break;
    }

    case 'input': {
      const label = p.label ?? p.placeholder ?? '';
      const barWidth = sizeVal(p.width, 20);
      lines.push(`mvwprintw(stdscr, ${y}, ${x}, ${cStr(label + ': ')});`);
      lines.push(`// Input field — barWidth: ${barWidth}`);
      lines.push(`mvwhline(stdscr, ${y}, ${x + label.length + 2}, '_', ${barWidth});`);
      break;
    }

    case 'list': {
      const items = p.items ?? [];
      items.forEach((item, i) => {
        lines.push(`mvwprintw(stdscr, ${y + i}, ${x}, "%s", ${cStr(item)});`);
      });
      break;
    }

    case 'progressbar': {
      const total = sizeVal(p.width, 20);
      const filled = Math.round(Math.min(1, Math.max(0, p.progress ?? 0)) * total);
      const empty = total - filled;
      const bar = '#'.repeat(filled) + ' '.repeat(empty);
      lines.push(`mvwprintw(stdscr, ${y}, ${x}, "[%s]", ${cStr(bar)});`);
      break;
    }

    case 'table': {
      const cols = p.columns ?? [];
      const rows = p.rows ?? [];
      const colWidth = 12;
      // header row
      let header = '';
      cols.forEach((col) => {
        header += col.padEnd(colWidth).slice(0, colWidth);
      });
      lines.push(`mvwprintw(stdscr, ${y}, ${x}, "%s", ${cStr(header)});`);
      // data rows
      rows.forEach((row, ri) => {
        let rowStr = '';
        row.forEach((cell) => {
          rowStr += cell.padEnd(colWidth).slice(0, colWidth);
        });
        lines.push(`mvwprintw(stdscr, ${y + 1 + ri}, ${x}, "%s", ${cStr(rowStr)});`);
      });
      break;
    }

    case 'tabs': {
      const items = p.items ?? [];
      let tabX = x;
      items.forEach((tab, i) => {
        const label = i === (p.selectedIndex ?? 0) ? `[${tab}]` : ` ${tab} `;
        lines.push(`mvwprintw(stdscr, ${y}, ${tabX}, "%s", ${cStr(label)});`);
        tabX += label.length + 1;
      });
      break;
    }

    default: {
      lines.push(`mvwprintw(stdscr, ${y}, ${x}, "%s", ${cStr(`<${node.type}>`)});`);
      break;
    }
  }

  // Apply color pair if one is defined
  const fg = p.fg;
  const bg = p.bg;
  if ((fg && fg !== 'default') || (bg && bg !== 'default')) {
    const key = `${fg ?? 'default'}:${bg ?? 'default'}`;
    const pair = pairs.get(key);
    if (pair) {
      // We prepend/append attron/attroff around the widget output — but since we've
      // already emitted the printw calls we just note the pair index as a comment.
      lines.push(`// color pair ${pair.index} (${fg ?? 'default'}/${bg ?? 'default'}) available via COLOR_PAIR(${pair.index})`);
    }
  }
}

export function exportNcurses(project: ProjectState): string {
  const root = project.components[project.rootId];
  if (!root) return '// empty project';

  // Collect all color pairs used in the tree
  const pairs = new Map<string, ColorPair>();
  collectColorPairs(root, project.components, pairs);

  const bodyLines: string[] = [];
  emitNode(root, project.components, pairs, bodyLines);

  const body = bodyLines.map((l) => `${INDENT}${l}`).join('\n');

  // Build color init section
  const colorInits = Array.from(pairs.values())
    .map(
      (cp) =>
        `${INDENT}init_pair(${cp.index}, ${ansiToNcursesColor(cp.fg)}, ${ansiToNcursesColor(cp.bg)});`,
    )
    .join('\n');

  return `// Auto-generated by ProjecTUI — ncurses (C++)
//
// Compile:
//   g++ -o app app.cpp -lncurses
// Run:
//   ./app

#include <ncurses.h>
#include <string>
#include <vector>

int main() {
${INDENT}initscr();
${INDENT}cbreak();
${INDENT}noecho();
${INDENT}keypad(stdscr, TRUE);
${INDENT}start_color();
${colorInits ? colorInits + '\n' : ''}
${body}

${INDENT}refresh();
${INDENT}getch();
${INDENT}endwin();
${INDENT}return 0;
}
`;
}
