// Generates a Bubble Tea (Go) program from the project tree.
//
// The exporter produces a self-contained `main.go` that uses Bubble Tea +
// Lip Gloss to render a static layout matching the design. It is not a 1:1
// port of all behaviors (Bubble Tea components are not direct equivalents
// of Textual widgets), but it gives the user a solid, runnable starting point.
import type { AnsiColor, ComponentNode, ProjectState, Size } from '@/types/component';

const ANSI_INDEX: Record<AnsiColor, string> = {
  default: '',
  black: '0',
  red: '1',
  green: '2',
  yellow: '3',
  blue: '4',
  magenta: '5',
  cyan: '6',
  white: '7',
  brightBlack: '8',
  brightRed: '9',
  brightGreen: '10',
  brightYellow: '11',
  brightBlue: '12',
  brightMagenta: '13',
  brightCyan: '14',
  brightWhite: '15',
};

function goStr(s: string): string {
  return JSON.stringify(s);
}

function sizeVal(s: Size | undefined, parent: number): number {
  if (s === undefined || s === 'fill') return parent;
  if (s === 'auto') return 0;
  return s;
}

function renderWidget(node: ComponentNode, components: Record<string, ComponentNode>, parent: { w: number; h: number }): string {
  const p = node.props;
  const w = sizeVal(p.width, parent.w);
  const h = sizeVal(p.height, parent.h);

  const inner: string = (() => {
    switch (node.type) {
      case 'container':
      case 'modal': {
        const childStrs = node.children
          .map((cid) => components[cid])
          .filter(Boolean)
          .map((c) => renderWidget(c, components, { w, h }));
        const join =
          p.direction === 'row'
            ? `lipgloss.JoinHorizontal(lipgloss.Top, ${childStrs.join(', ')})`
            : `lipgloss.JoinVertical(lipgloss.Left, ${childStrs.join(', ')})`;
        return childStrs.length === 0 ? `""` : join;
      }
      case 'text':
        return goStr(p.text ?? '');
      case 'button':
        return goStr(`[ ${p.text ?? 'Button'} ]`);
      case 'input':
        return goStr(`▎ ${String(p.value ?? '') || p.placeholder || ''}`);
      case 'textarea':
        return goStr(String(p.value ?? '') || p.placeholder || '');
      case 'checkbox':
        return goStr(`${p.checked ? '[x]' : '[ ]'} ${p.label ?? ''}`);
      case 'select':
        return goStr(`${(p.items ?? [])[p.selectedIndex ?? 0] ?? ''} ▾`);
      case 'list':
        return goStr((p.items ?? []).map((it, i) => `${i === (p.selectedIndex ?? -1) ? '› ' : '  '}${it}`).join('\n'));
      case 'tabs':
        return goStr((p.items ?? []).map((it, i) => (i === (p.selectedIndex ?? 0) ? `[${it}]` : ` ${it} `)).join(' '));
      case 'statusbar':
        return goStr(p.text ?? '');
      case 'progressbar': {
        const totalCols = typeof p.width === 'number' ? p.width : 20;
        const progress = Math.min(1, Math.max(0, p.progress ?? 0));
        const filled = Math.round(totalCols * progress);
        return goStr(`${'█'.repeat(filled)}${'░'.repeat(Math.max(0, totalCols - filled))}`);
      }
      case 'table': {
        const cols = p.columns ?? [];
        const rows = p.rows ?? [];
        const lines = [cols.join(' | '), cols.map(() => '---').join(' | '), ...rows.map((r) => r.join(' | '))];
        return goStr(lines.join('\n'));
      }
      case 'asciitext':
        return goStr(p.text ?? 'TEXT');
      case 'spinner':
        return goStr('⠋ Loading...');
      case 'divider':
        return goStr(p.text ? `── ${p.text} ──` : '────────────────────');
      case 'toast':
        return goStr(`[${p.toastVariant ?? 'info'}] ${p.text ?? ''}`);
      case 'timer':
        return goStr(p.timerValue ?? '00:00');
      case 'filepicker': {
        const files = (p.items ?? ['Documents/', 'Downloads/', 'file.txt']).join('\n');
        return goStr(files);
      }
      case 'treeview': {
        const items = (p.treeItems ?? []).map((ti) => `▶ ${ti.label ?? ''}`).join('\n');
        return goStr(items || '▶ item');
      }
      case 'metriccard':
        return goStr(`${p.metricLabel ?? 'Metric'}\n${p.metricValue ?? '—'}${p.metricDelta ? `  ${p.metricDelta}` : ''}`);
      case 'markdowntext':
        return goStr(p.markdownContent ?? '');
      case 'grid':
      case 'viewport': {
        const childStrs = node.children
          .map((cid) => components[cid])
          .filter(Boolean)
          .map((c) => renderWidget(c, components, { w, h }));
        return childStrs.length === 0 ? `""` : `lipgloss.JoinVertical(lipgloss.Left, ${childStrs.join(', ')})`;
      }
      default:
        return goStr(`<${node.type}>`);
    }
  })();

  // Wrap with style
  const styleParts: string[] = ['lipgloss.NewStyle()'];
  if (p.fg && p.fg !== 'default') styleParts.push(`Foreground(lipgloss.ANSIColor(${ANSI_INDEX[p.fg]}))`);
  if (p.bg && p.bg !== 'default') styleParts.push(`Background(lipgloss.ANSIColor(${ANSI_INDEX[p.bg]}))`);
  if (p.bold) styleParts.push('Bold(true)');
  if (p.padding) styleParts.push(`Padding(${p.padding})`);
  if (p.border && p.border !== 'none') {
    const b =
      p.border === 'rounded'
        ? 'lipgloss.RoundedBorder()'
        : p.border === 'double'
        ? 'lipgloss.DoubleBorder()'
        : p.border === 'thick'
        ? 'lipgloss.ThickBorder()'
        : p.border === 'ascii'
        ? 'lipgloss.ASCIIBorder()'
        : 'lipgloss.NormalBorder()';
    styleParts.push(`Border(${b})`);
    if (p.title) styleParts.push(`Title(${goStr(p.title)})`);
    if (p.borderColor && p.borderColor !== 'default')
      styleParts.push(`BorderForeground(lipgloss.ANSIColor(${ANSI_INDEX[p.borderColor]}))`);
  }
  if (typeof p.width === 'number') styleParts.push(`Width(${p.width})`);
  if (typeof p.height === 'number') styleParts.push(`Height(${p.height})`);

  const style = styleParts.length > 1 ? styleParts.join('.') : null;
  if (!style) return inner;
  return `${style}.Render(${inner})`;
}

function buildScreenRouting(project: ProjectState): { screens: string; updateCases: string } {
  const layers = project.layers ?? [];
  const steps = project.timelineSteps ?? [];
  const transitions = project.timelineTransitions ?? [];
  if (layers.length <= 1 || transitions.length === 0) return { screens: '', updateCases: '' };

  // Map layerId -> layer
  const layerById = new Map(layers.map((l) => [l.id, l]));
  // Map stepId -> layerId
  const stepLayerMap = new Map(steps.map((s) => [s.id, s.layerId]));
  // Build screen name map: layerId -> Go identifier
  const screenName = (layerId: string) => {
    const layer = layerById.get(layerId);
    return (layer?.name ?? layerId).replace(/[^a-zA-Z0-9]/g, '') || 'Screen';
  };

  const screenConsts = layers.map((l, i) => `\tscreen${screenName(l.id)} = ${i}`).join('\n');
  const screens = `\ntype screen int\n\nconst (\n${screenConsts}\n)\n`;

  const switchCases = transitions.map((t) => {
    const fromLayerId = stepLayerMap.get(t.fromStepId) ?? '';
    const toLayerId = stepLayerMap.get(t.toStepId) ?? '';
    if (!fromLayerId || !toLayerId) return '';
    const trigger = t.trigger ?? '';
    const key = t.event === 'keypress' && trigger ? `"${trigger}"` : `"${trigger || 'enter'}"`;
    return `\t\t\tcase screen${screenName(fromLayerId)}:\n\t\t\t\tif msg.String() == ${key} { m.screen = screen${screenName(toLayerId)} }`;
  }).filter(Boolean).join('\n');

  const updateCases = switchCases
    ? `\t\tswitch m.screen {\n${switchCases}\n\t\t}`
    : '';

  return { screens, updateCases };
}

export function exportBubbleTea(project: ProjectState): string {
  const root = project.components[project.rootId];
  if (!root) return '// empty project';

  const view = renderWidget(root, project.components, { w: project.termCols, h: project.termRows });
  const layers = project.layers ?? [];
  const hasRouting = layers.length > 1 && (project.timelineTransitions ?? []).length > 0;
  const { screens, updateCases } = buildScreenRouting(project);

  const modelField = hasRouting ? '\n\tscreen screen' : '';
  const updateKeyHandler = hasRouting && updateCases
    ? `\n${updateCases}`
    : '';

  // Build per-screen views if routing
  let viewBody = `\treturn ${view}`;
  if (hasRouting && layers.length > 1) {
    const viewCases = layers.map((layer) => {
      const layerRoot = layer.components[layer.rootId];
      if (!layerRoot) return '';
      const layerView = renderWidget(layerRoot, layer.components, { w: project.termCols, h: project.termRows });
      const layerById = new Map((project.layers ?? []).map((l) => [l.id, l]));
      const layerObj = layerById.get(layer.id);
      const name = (layerObj?.name ?? layer.id).replace(/[^a-zA-Z0-9]/g, '') || 'Screen';
      return `\tcase screen${name}:\n\t\treturn ${layerView}`;
    }).filter(Boolean).join('\n');
    viewBody = `\tswitch m.screen {\n${viewCases}\n\t}\n\treturn ""`;
  }

  return `// Auto-generated by ProjecTUI.
//
// Run:
//   go mod init tui-app
//   go get github.com/charmbracelet/bubbletea github.com/charmbracelet/lipgloss
//   go run main.go
package main

import (
\t"fmt"
\t"os"

\ttea "github.com/charmbracelet/bubbletea"
\t"github.com/charmbracelet/lipgloss"
)
${screens}
type model struct{${modelField}
}

func (m model) Init() tea.Cmd { return nil }

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
\tswitch msg := msg.(type) {
\tcase tea.KeyMsg:
\t\tswitch msg.String() {
\t\tcase "q", "ctrl+c":
\t\t\treturn m, tea.Quit
\t\t}${updateKeyHandler}
\t}
\treturn m, nil
}

func (m model) View() string {
${viewBody}
}

func main() {
\tp := tea.NewProgram(model{}, tea.WithAltScreen())
\tif _, err := p.Run(); err != nil {
\t\tfmt.Fprintf(os.Stderr, "error: %v\\n", err)
\t\tos.Exit(1)
\t}
}
`;
}
