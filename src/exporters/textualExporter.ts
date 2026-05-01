// Generates a Textual (Python) app from the project tree.
// The output is intentionally close to idiomatic Textual code so the user
// can run `pip install textual && python app.py` and immediately see it.
import type { ComponentNode, ProjectState, Size } from '@/types/component';

const INDENT = '    ';

function id(node: ComponentNode): string {
  const sanitized = (node.name ?? node.type).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const safe = sanitized === '' || /^[0-9]/.test(sanitized) ? `_${sanitized}` : sanitized;
  return `${safe}_${node.id.split('_').pop()}`;
}

function pyStr(s: string): string {
  return JSON.stringify(s);
}

function sizeToCss(size: Size | undefined): string {
  if (size === undefined || size === 'fill') return '1fr';
  if (size === 'auto') return 'auto';
  return String(size);
}

function styleBlock(node: ComponentNode): string[] {
  const p = node.props;
  const lines: string[] = [];
  if (p.width !== undefined) lines.push(`width: ${sizeToCss(p.width)};`);
  if (p.height !== undefined) lines.push(`height: ${sizeToCss(p.height)};`);
  if (p.padding) lines.push(`padding: ${p.padding};`);
  if (p.fg && p.fg !== 'default') lines.push(`color: ${ansiToRich(p.fg)};`);
  if (p.bg && p.bg !== 'default') lines.push(`background: ${ansiToRich(p.bg)};`);
  if (p.border && p.border !== 'none') lines.push(`border: ${textualBorder(p.border)};`);
  if (p.bold) lines.push('text-style: bold;');
  return lines;
}

function ansiToRich(c: string): string {
  if (c.startsWith('bright')) return c.slice(6).toLowerCase();
  return c;
}

function textualBorder(b: string): string {
  switch (b) {
    case 'single':
      return 'solid $primary';
    case 'double':
      return 'double $primary';
    case 'rounded':
      return 'round $primary';
    case 'thick':
      return 'heavy $primary';
    default:
      return 'none';
  }
}

function emitWidget(node: ComponentNode, components: Record<string, ComponentNode>, depth: number): string {
  const pad = INDENT.repeat(depth);
  const p = node.props;
  switch (node.type) {
    case 'container':
    case 'modal': {
      const klass = p.direction === 'row' ? 'Horizontal' : 'Vertical';
      const inner = node.children
        .map((cid) => components[cid])
        .filter(Boolean)
        .map((c) => emitWidget(c, components, depth + 1))
        .join(',\n');
      return `${pad}${klass}(\n${inner}${inner ? ',\n' : ''}${pad}${INDENT}id=${pyStr(id(node))},\n${pad})`;
    }
    case 'text':
      return `${pad}Static(${pyStr(p.text ?? '')}, id=${pyStr(id(node))})`;
    case 'button':
      return `${pad}Button(${pyStr(p.text ?? 'Button')}, id=${pyStr(id(node))})`;
    case 'input':
      return `${pad}Input(placeholder=${pyStr(p.placeholder ?? '')}, value=${pyStr(String(p.value ?? ''))}, id=${pyStr(id(node))})`;
    case 'textarea':
      return `${pad}TextArea(${pyStr(String(p.value ?? p.placeholder ?? ''))}, id=${pyStr(id(node))})`;
    case 'checkbox':
      return `${pad}Checkbox(${pyStr(p.label ?? '')}, value=${p.checked ? 'True' : 'False'}, id=${pyStr(id(node))})`;
    case 'select': {
      const items = (p.items ?? []).map((it, i) => `(${pyStr(it)}, ${i})`).join(', ');
      return `${pad}Select([${items}], value=${p.selectedIndex ?? 0}, id=${pyStr(id(node))})`;
    }
    case 'list': {
      const items = (p.items ?? []).map((s) => `ListItem(Label(${pyStr(s)}))`).join(', ');
      return `${pad}ListView(${items}, id=${pyStr(id(node))})`;
    }
    case 'tabs': {
      const items = (p.items ?? []).map((s) => `Tab(${pyStr(s)})`).join(', ');
      return `${pad}Tabs(${items}, id=${pyStr(id(node))})`;
    }
    case 'progressbar':
      return `${pad}ProgressBar(total=100, id=${pyStr(id(node))})  # set value via .progress = ${(p.progress ?? 0) * 100}`;
    case 'statusbar':
      return `${pad}Static(${pyStr(p.text ?? '')}, id=${pyStr(id(node))}, classes="statusbar")`;
    case 'table':
      return `${pad}DataTable(id=${pyStr(id(node))})`;
    default:
      return `${pad}Static(${pyStr(`<${node.type}>`)}, id=${pyStr(id(node))})`;
  }
}

function collectCss(node: ComponentNode, components: Record<string, ComponentNode>, out: string[]) {
  const lines = styleBlock(node);
  if (lines.length > 0) {
    out.push(`#${id(node)} {\n${lines.map((l) => INDENT + l).join('\n')}\n}`);
  }
  node.children.forEach((cid) => {
    const c = components[cid];
    if (c) collectCss(c, components, out);
  });
}

function tableInit(node: ComponentNode, components: Record<string, ComponentNode>): string[] {
  const out: string[] = [];
  Object.values(components).forEach((n) => {
    if (n.type === 'table') {
      const cols = (n.props.columns ?? []).map(pyStr).join(', ');
      const rows = (n.props.rows ?? []).map((r) => `(${r.map(pyStr).join(', ')})`).join(', ');
      out.push(
        `        table = self.query_one("#${id(n)}", DataTable)`,
        `        table.add_columns(${cols})`,
        `        for row in [${rows}]:`,
        `            table.add_row(*row)`,
      );
    }
    if (n.type === 'progressbar') {
      out.push(
        `        self.query_one("#${id(n)}", ProgressBar).update(progress=${(n.props.progress ?? 0) * 100})`,
      );
    }
  });
  void node;
  return out;
}

export function exportTextual(project: ProjectState): string {
  const root = project.components[project.rootId];
  if (!root) return '# empty project';

  const cssLines: string[] = [];
  collectCss(root, project.components, cssLines);

  const widgets = emitWidget(root, project.components, 2);
  const inits = tableInit(root, project.components).join('\n');

  return `"""
Auto-generated by TUI Builder.

Run:
    pip install textual
    python app.py
"""
from textual.app import App, ComposeResult
from textual.containers import Vertical, Horizontal
from textual.widgets import (
    Static, Button, Input, TextArea, Checkbox, Select,
    ListView, ListItem, Label, Tabs, Tab, ProgressBar, DataTable,
)


class GeneratedApp(App):
    CSS = """
${cssLines.map((l) => l.replace(/^/gm, '    ')).join('\n\n')}

    .statusbar {
        dock: bottom;
        height: 1;
    }
    """

    def compose(self) -> ComposeResult:
        yield (
${widgets}
        )

    def on_mount(self) -> None:
${inits || '        pass'}


if __name__ == "__main__":
    GeneratedApp().run()
`;
}
