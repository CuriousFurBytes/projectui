import { useEditor } from '@/store/editorStore';
import { getDef } from '@/lib/componentDefs';
import type {
  AnsiColor,
  BorderStyle,
  ComponentNode,
  ComponentProps,
  Direction,
  Size,
} from '@/types/component';

const ANSI_COLORS: AnsiColor[] = [
  'default',
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite',
];

const BORDER_STYLES: BorderStyle[] = ['none', 'single', 'double', 'rounded', 'thick'];

function sizeToString(s: Size | undefined): string {
  if (s === undefined) return 'fill';
  if (typeof s === 'number') return String(s);
  return s;
}
function stringToSize(s: string): Size {
  if (s === 'fill' || s === 'auto') return s;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 'auto';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-ink-600">
      <div className="panel-header !border-b-0 !py-1.5">{title}</div>
      <div className="px-3 py-2 grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export function PropertiesPanel() {
  const { selectedId, project, updateProps, rename } = useEditor();
  const node = selectedId ? project.components[selectedId] ?? null : null;

  if (!node) {
    return (
      <section className="panel flex-1 flex flex-col min-h-0">
        <div className="panel-header">
          <span>Properties</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-ink-300 px-6 text-center">
          Select a component on the canvas or in the Layers panel to edit its properties.
        </div>
      </section>
    );
  }

  const def = getDef(node.type);
  const p = node.props;

  const setProp = <K extends keyof ComponentProps>(key: K, value: ComponentProps[K]) =>
    updateProps(node.id, { [key]: value } as Partial<ComponentProps>);

  return (
    <section className="panel flex-1 flex flex-col min-h-0">
      <div className="panel-header">
        <span>Properties</span>
        <span className="text-[10px] normal-case tracking-normal text-accent">{def.label}</span>
      </div>
      <div className="overflow-auto flex-1">
        <Section title="Identity">
          <div className="col-span-2">
            <Field label="Name">
              <input
                className="input"
                value={node.name ?? ''}
                placeholder={def.label}
                onChange={(e) => rename(node.id, e.target.value)}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Type">
              <input className="input opacity-60" value={node.type} disabled />
            </Field>
          </div>
        </Section>

        <Section title="Layout">
          <Field label="Width">
            <input
              className="input"
              value={sizeToString(p.width)}
              onChange={(e) => setProp('width', stringToSize(e.target.value))}
              placeholder="auto / fill / 20"
            />
          </Field>
          <Field label="Height">
            <input
              className="input"
              value={sizeToString(p.height)}
              onChange={(e) => setProp('height', stringToSize(e.target.value))}
              placeholder="auto / fill / 5"
            />
          </Field>
          {def.acceptsChildren && (
            <>
              <Field label="Direction">
                <select
                  className="input"
                  value={p.direction ?? 'column'}
                  onChange={(e) => setProp('direction', e.target.value as Direction)}
                >
                  <option value="column">Column</option>
                  <option value="row">Row</option>
                </select>
              </Field>
              <Field label="Gap">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={p.gap ?? 0}
                  onChange={(e) => setProp('gap', Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Padding">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={p.padding ?? 0}
                  onChange={(e) => setProp('padding', Number(e.target.value) || 0)}
                />
              </Field>
            </>
          )}
        </Section>

        <Section title="Style">
          <Field label="Border">
            <select
              className="input"
              value={p.border ?? 'none'}
              onChange={(e) => setProp('border', e.target.value as BorderStyle)}
            >
              {BORDER_STYLES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input
              className="input"
              value={p.title ?? ''}
              onChange={(e) => setProp('title', e.target.value)}
            />
          </Field>
          <Field label="Foreground">
            <select
              className="input"
              value={p.fg ?? 'default'}
              onChange={(e) => setProp('fg', e.target.value as AnsiColor)}
            >
              {ANSI_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Background">
            <select
              className="input"
              value={p.bg ?? 'default'}
              onChange={(e) => setProp('bg', e.target.value as AnsiColor)}
            >
              {ANSI_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <div className="col-span-2 flex items-center gap-2">
            <input
              id="bold"
              type="checkbox"
              checked={!!p.bold}
              onChange={(e) => setProp('bold', e.target.checked)}
            />
            <label htmlFor="bold" className="text-xs">
              Bold
            </label>
          </div>
        </Section>

        <ContentSection node={node} />

        <Section title="Behavior">
          <div className="col-span-1 flex items-center gap-2">
            <input
              id="focusable"
              type="checkbox"
              checked={!!p.focusable}
              onChange={(e) => setProp('focusable', e.target.checked)}
            />
            <label htmlFor="focusable" className="text-xs">
              Focusable
            </label>
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <input
              id="disabled"
              type="checkbox"
              checked={!!p.disabled}
              onChange={(e) => setProp('disabled', e.target.checked)}
            />
            <label htmlFor="disabled" className="text-xs">
              Disabled
            </label>
          </div>
        </Section>
      </div>
    </section>
  );
}

function ContentSection({ node }: { node: ComponentNode }) {
  const { updateProps } = useEditor();
  const p = node.props;
  const setProp = <K extends keyof ComponentProps>(key: K, value: ComponentProps[K]) =>
    updateProps(node.id, { [key]: value } as Partial<ComponentProps>);

  switch (node.type) {
    case 'text':
    case 'button':
    case 'statusbar':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Text">
              <input className="input" value={p.text ?? ''} onChange={(e) => setProp('text', e.target.value)} />
            </Field>
          </div>
        </Section>
      );
    case 'input':
    case 'textarea':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Placeholder">
              <input
                className="input"
                value={p.placeholder ?? ''}
                onChange={(e) => setProp('placeholder', e.target.value)}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Value">
              <input
                className="input"
                value={String(p.value ?? '')}
                onChange={(e) => setProp('value', e.target.value)}
              />
            </Field>
          </div>
        </Section>
      );
    case 'checkbox':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Label">
              <input
                className="input"
                value={p.label ?? ''}
                onChange={(e) => setProp('label', e.target.value)}
              />
            </Field>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              id="checked"
              type="checkbox"
              checked={!!p.checked}
              onChange={(e) => setProp('checked', e.target.checked)}
            />
            <label htmlFor="checked" className="text-xs">
              Checked
            </label>
          </div>
        </Section>
      );
    case 'select':
    case 'list':
    case 'tabs':
      return (
        <Section title="Items">
          <div className="col-span-2">
            <Field label="Items (one per line)">
              <textarea
                className="input min-h-[80px]"
                value={(p.items ?? []).join('\n')}
                onChange={(e) =>
                  setProp(
                    'items',
                    e.target.value.split('\n').map((s) => s.trimEnd()),
                  )
                }
              />
            </Field>
          </div>
          <Field label="Selected index">
            <input
              type="number"
              min={0}
              className="input"
              value={p.selectedIndex ?? 0}
              onChange={(e) => setProp('selectedIndex', Number(e.target.value) || 0)}
            />
          </Field>
        </Section>
      );
    case 'progressbar':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label={`Progress: ${Math.round((p.progress ?? 0) * 100)}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((p.progress ?? 0) * 100)}
                onChange={(e) => setProp('progress', Number(e.target.value) / 100)}
              />
            </Field>
          </div>
        </Section>
      );
    case 'table':
      return (
        <Section title="Data">
          <div className="col-span-2">
            <Field label="Columns (comma-separated)">
              <input
                className="input"
                value={(p.columns ?? []).join(', ')}
                onChange={(e) =>
                  setProp(
                    'columns',
                    e.target.value.split(',').map((s) => s.trim()),
                  )
                }
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Rows (one per line, comma-separated cells)">
              <textarea
                className="input min-h-[100px]"
                value={(p.rows ?? []).map((r) => r.join(', ')).join('\n')}
                onChange={(e) =>
                  setProp(
                    'rows',
                    e.target.value
                      .split('\n')
                      .map((line) => line.split(',').map((c) => c.trim())),
                  )
                }
              />
            </Field>
          </div>
        </Section>
      );
    default:
      return null;
  }
}
