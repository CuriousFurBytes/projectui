// Generates a Node.js blessed/neo-blessed script from the project tree.
//
// Run:
//   npm install blessed
//   node app.js
import type { ComponentNode, ProjectState, AnsiColor } from '@/types/component';

const INDENT = '  ';

function jsStr(s: string): string {
  return JSON.stringify(s);
}

function nodeId(node: ComponentNode): string {
  const sanitized = (node.name ?? node.type).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const safe = sanitized === '' || /^[0-9]/.test(sanitized) ? `_${sanitized}` : sanitized;
  return `${safe}_${node.id.split('_').pop()}`;
}

function ansiToBlessed(color: AnsiColor | undefined): string {
  if (!color || color === 'default') return 'default';
  // camelCase brightX → 'bright-x'
  if (color.startsWith('bright')) {
    return `bright-${color.slice(6).toLowerCase()}`;
  }
  return color;
}

function borderOption(border: string | undefined): string {
  if (!border || border === 'none') return 'false';
  if (border === 'double') return "{ type: 'bg' }";
  // single, rounded, thick, ascii all map to line
  return "{ type: 'line' }";
}

function sizeVal(size: number | string | undefined, fallback: string): string {
  if (size === undefined || size === 'fill') return fallback;
  if (size === 'auto') return 'shrink';
  return String(size);
}

function emitNode(
  node: ComponentNode,
  components: Record<string, ComponentNode>,
  lines: string[],
  parent: string,
): void {
  const p = node.props;
  const varName = nodeId(node);
  const top = sizeVal(p.y ?? p.height, '0');
  const left = sizeVal(p.x ?? p.width, '0');
  const width = sizeVal(p.width, '100%');
  const height = sizeVal(p.height, '100%');
  const fg = ansiToBlessed(p.fg);
  const bg = ansiToBlessed(p.bg);

  switch (node.type) {
    case 'container':
    case 'modal': {
      const border = borderOption(p.border);
      lines.push(`const ${varName} = blessed.box({`);
      lines.push(`${INDENT}parent: ${parent},`);
      lines.push(`${INDENT}top: ${jsStr(sizeVal(p.y, '0'))},`);
      lines.push(`${INDENT}left: ${jsStr(sizeVal(p.x, '0'))},`);
      lines.push(`${INDENT}width: ${jsStr(width)},`);
      lines.push(`${INDENT}height: ${jsStr(height)},`);
      if (p.title) lines.push(`${INDENT}label: ${jsStr(p.title)},`);
      lines.push(`${INDENT}border: ${border},`);
      if (fg !== 'default') lines.push(`${INDENT}style: { fg: ${jsStr(fg)}, bg: ${jsStr(bg)} },`);
      lines.push(`});`);
      // Recurse into children
      node.children
        .map((cid) => components[cid])
        .filter(Boolean)
        .forEach((c) => emitNode(c, components, lines, varName));
      break;
    }

    case 'text': {
      lines.push(`const ${varName} = blessed.text({`);
      lines.push(`${INDENT}parent: ${parent},`);
      lines.push(`${INDENT}top: ${jsStr(sizeVal(p.y, '0'))},`);
      lines.push(`${INDENT}left: ${jsStr(sizeVal(p.x, '0'))},`);
      lines.push(`${INDENT}content: ${jsStr(p.text ?? '')},`);
      if (fg !== 'default') lines.push(`${INDENT}style: { fg: ${jsStr(fg)}, bg: ${jsStr(bg)} },`);
      lines.push(`});`);
      break;
    }

    case 'button': {
      lines.push(`const ${varName} = blessed.button({`);
      lines.push(`${INDENT}parent: ${parent},`);
      lines.push(`${INDENT}top: ${jsStr(sizeVal(p.y, '0'))},`);
      lines.push(`${INDENT}left: ${jsStr(sizeVal(p.x, '0'))},`);
      lines.push(`${INDENT}content: ${jsStr(p.text ?? 'Button')},`);
      lines.push(`${INDENT}border: { type: 'line' },`);
      lines.push(`${INDENT}style: {`);
      lines.push(`${INDENT}${INDENT}fg: ${jsStr(fg !== 'default' ? fg : 'white')},`);
      lines.push(`${INDENT}${INDENT}bg: ${jsStr(bg !== 'default' ? bg : 'blue')},`);
      lines.push(`${INDENT}${INDENT}focus: { bg: 'cyan' },`);
      lines.push(`${INDENT}},`);
      lines.push(`});`);
      break;
    }

    case 'input': {
      lines.push(`const ${varName} = blessed.textbox({`);
      lines.push(`${INDENT}parent: ${parent},`);
      lines.push(`${INDENT}top: ${jsStr(sizeVal(p.y, '0'))},`);
      lines.push(`${INDENT}left: ${jsStr(sizeVal(p.x, '0'))},`);
      lines.push(`${INDENT}width: ${jsStr(width)},`);
      if (p.label ?? p.placeholder) lines.push(`${INDENT}label: ${jsStr(p.label ?? p.placeholder ?? '')},`);
      lines.push(`${INDENT}border: { type: 'line' },`);
      lines.push(`${INDENT}style: { fg: ${jsStr(fg !== 'default' ? fg : 'white')} },`);
      lines.push(`});`);
      break;
    }

    case 'list': {
      const items = (p.items ?? []).map(jsStr).join(', ');
      lines.push(`const ${varName} = blessed.list({`);
      lines.push(`${INDENT}parent: ${parent},`);
      lines.push(`${INDENT}top: ${jsStr(sizeVal(p.y, '0'))},`);
      lines.push(`${INDENT}left: ${jsStr(sizeVal(p.x, '0'))},`);
      lines.push(`${INDENT}width: ${jsStr(width)},`);
      lines.push(`${INDENT}height: ${jsStr(height)},`);
      lines.push(`${INDENT}items: [${items}],`);
      lines.push(`${INDENT}border: { type: 'line' },`);
      lines.push(`${INDENT}style: { selected: { bg: 'blue' } },`);
      lines.push(`});`);
      break;
    }

    case 'progressbar': {
      const filled = Math.round(Math.min(1, Math.max(0, p.progress ?? 0)) * 100);
      lines.push(`const ${varName} = blessed.progressbar({`);
      lines.push(`${INDENT}parent: ${parent},`);
      lines.push(`${INDENT}top: ${jsStr(sizeVal(p.y, '0'))},`);
      lines.push(`${INDENT}left: ${jsStr(sizeVal(p.x, '0'))},`);
      lines.push(`${INDENT}width: ${jsStr(width)},`);
      lines.push(`${INDENT}filled: ${filled},`);
      lines.push(`${INDENT}border: { type: 'line' },`);
      lines.push(`${INDENT}style: { bar: { bg: ${jsStr(fg !== 'default' ? fg : 'green')} } },`);
      lines.push(`});`);
      break;
    }

    case 'table': {
      const headers = (p.columns ?? []).map(jsStr).join(', ');
      const dataRows = (p.rows ?? []).map((r) => `[${r.map(jsStr).join(', ')}]`).join(', ');
      lines.push(`const ${varName} = blessed.listtable({`);
      lines.push(`${INDENT}parent: ${parent},`);
      lines.push(`${INDENT}top: ${jsStr(sizeVal(p.y, '0'))},`);
      lines.push(`${INDENT}left: ${jsStr(sizeVal(p.x, '0'))},`);
      lines.push(`${INDENT}width: ${jsStr(width)},`);
      lines.push(`${INDENT}height: ${jsStr(height)},`);
      lines.push(`${INDENT}border: { type: 'line' },`);
      lines.push(`${INDENT}data: [[${headers}], ${dataRows}],`);
      lines.push(`${INDENT}style: { header: { bold: true } },`);
      lines.push(`});`);
      break;
    }

    case 'tabs': {
      const items = p.items ?? [];
      lines.push(`const ${varName} = blessed.box({`);
      lines.push(`${INDENT}parent: ${parent},`);
      lines.push(`${INDENT}top: ${jsStr(sizeVal(p.y, '0'))},`);
      lines.push(`${INDENT}left: ${jsStr(sizeVal(p.x, '0'))},`);
      lines.push(`${INDENT}width: ${jsStr(width)},`);
      lines.push(`${INDENT}height: ${jsStr(height)},`);
      lines.push(`${INDENT}border: { type: 'line' },`);
      lines.push(`});`);
      // Render tab buttons along the top
      items.forEach((tab, i) => {
        lines.push(`const ${varName}_tab${i} = blessed.button({`);
        lines.push(`${INDENT}parent: ${varName},`);
        lines.push(`${INDENT}top: 0,`);
        lines.push(`${INDENT}left: ${i * 12},`);
        lines.push(`${INDENT}content: ${jsStr(tab)},`);
        lines.push(`${INDENT}style: { fg: 'white', bg: ${i === (p.selectedIndex ?? 0) ? jsStr('blue') : jsStr('black')} },`);
        lines.push(`});`);
      });
      break;
    }

    default: {
      // Generic fallback — render as blessed.text
      lines.push(`const ${varName} = blessed.text({`);
      lines.push(`${INDENT}parent: ${parent},`);
      lines.push(`${INDENT}top: ${jsStr(sizeVal(p.y, '0'))},`);
      lines.push(`${INDENT}left: ${jsStr(sizeVal(p.x, '0'))},`);
      lines.push(`${INDENT}content: ${jsStr(`<${node.type}>`)},`);
      lines.push(`});`);
      break;
    }
  }

  void top;
  void left;
}

export function exportBlessed(project: ProjectState): string {
  const root = project.components[project.rootId];
  if (!root) return '// empty project';

  const bodyLines: string[] = [];
  emitNode(root, project.components, bodyLines, 'screen');

  const body = bodyLines.map((l) => `${INDENT}${l}`).join('\n');

  return `// Auto-generated by ProjecTUI — blessed (Node.js)
//
// Setup:
//   npm install blessed
//   node app.js

const blessed = require('blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: ${jsStr(project.metadata?.name ?? 'ProjecTUI App')},
});

${body}

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

screen.render();
`;
}
