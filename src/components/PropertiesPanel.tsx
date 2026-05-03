import type { ReactNode } from 'react';
import { useState } from 'react';
import { useEditor } from '@/store/editorStore';
import { getDef } from '@/lib/componentDefs';
import type {
  AnsiColor,
  BorderStyle,
  ComponentNode,
  ComponentProps,
  Direction,
  RichSpan,
  Size,
  SpinnerStyle,
  TitleAlign,
  ToastVariant,
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
const TITLE_ALIGNS: TitleAlign[] = ['left', 'center', 'right'];

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

function Field({ label, children, span2 }: { label: string; children: ReactNode; span2?: boolean }) {
  return (
    <label className={span2 ? 'col-span-2 flex flex-col gap-1' : 'flex flex-col gap-1'}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-ink-600">
      <div className="panel-header !border-b-0 !py-1.5">{title}</div>
      <div className="px-3 py-2 grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function ColorSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: AnsiColor;
  onChange: (v: AnsiColor) => void;
}) {
  return (
    <Field label={label}>
      <select className="input" value={value ?? 'default'} onChange={(e) => onChange(e.target.value as AnsiColor)}>
        {ANSI_COLORS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function PropertiesPanel() {
  const node = useEditor((s) => (s.selectedId ? s.project.components[s.selectedId] ?? null : null));
  const rootId = useEditor((s) => s.project.rootId);
  const updateProps = useEditor((s) => s.updateProps);
  const rename = useEditor((s) => s.rename);
  const saveVariant = useEditor((s) => s.saveVariant);
  const [variantName, setVariantName] = useState('');
  const [savingVariant, setSavingVariant] = useState(false);

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

  const hasBorder = p.border && p.border !== 'none';

  return (
    <section className="panel flex-1 flex flex-col min-h-0">
      <div className="panel-header">
        <span>Properties</span>
        <span className="text-[10px] normal-case tracking-normal text-accent">{def.label}</span>
      </div>
      <div className="overflow-auto flex-1">
        {/* Identity */}
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

        {/* Layout */}
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
          {node.type === 'grid' && (
            <>
              <Field label="Columns">
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="input"
                  value={p.gridCols ?? 2}
                  onChange={(e) => setProp('gridCols', Math.max(1, Number(e.target.value) || 2))}
                />
              </Field>
              <Field label="Grid gap">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={p.gridGap ?? 0}
                  onChange={(e) => setProp('gridGap', Number(e.target.value) || 0)}
                />
              </Field>
            </>
          )}
          {/* Free positioning */}
          <div className="col-span-2 flex items-center gap-2">
            <input
              id="absolute"
              type="checkbox"
              checked={!!p.absolute}
              onChange={(e) => setProp('absolute', e.target.checked)}
            />
            <label htmlFor="absolute" className="text-xs">
              Absolute position
            </label>
          </div>
          {p.absolute && (
            <>
              <Field label="X">
                <input
                  type="number"
                  className="input"
                  value={p.x ?? 0}
                  onChange={(e) => setProp('x', Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Y">
                <input
                  type="number"
                  className="input"
                  value={p.y ?? 0}
                  onChange={(e) => setProp('y', Number(e.target.value) || 0)}
                />
              </Field>
            </>
          )}
        </Section>

        {/* Style */}
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
          {hasBorder && (
            <>
              <Field label="Title align">
                <select
                  className="input"
                  value={p.titleAlign ?? 'left'}
                  onChange={(e) => setProp('titleAlign', e.target.value as TitleAlign)}
                >
                  {TITLE_ALIGNS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Field>
              <ColorSelect label="Border color" value={p.borderColor} onChange={(v) => setProp('borderColor', v)} />
              <ColorSelect label="Title color" value={p.titleColor} onChange={(v) => setProp('titleColor', v)} />
            </>
          )}
          <ColorSelect label="Foreground" value={p.fg} onChange={(v) => setProp('fg', v)} />
          <ColorSelect label="Background" value={p.bg} onChange={(v) => setProp('bg', v)} />
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

        {/* Behavior */}
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

        {/* Save as Variant — not available for root node */}
        {node.id !== rootId && (
          <div className="border-t border-ink-600 p-3">
            <div className="panel-header !border-b-0 !py-1.5 !px-0 mb-2">Variants</div>
            {savingVariant ? (
              <div className="flex gap-1">
                <input
                  className="input flex-1 text-xs"
                  placeholder="Variant name…"
                  value={variantName}
                  autoFocus
                  onChange={(e) => setVariantName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && variantName.trim()) {
                      saveVariant(node.id, variantName.trim());
                      setVariantName('');
                      setSavingVariant(false);
                    } else if (e.key === 'Escape') {
                      setVariantName('');
                      setSavingVariant(false);
                    }
                  }}
                />
                <button
                  className="btn text-xs"
                  disabled={!variantName.trim()}
                  onClick={() => {
                    saveVariant(node.id, variantName.trim());
                    setVariantName('');
                    setSavingVariant(false);
                  }}
                >
                  Save
                </button>
                <button
                  className="btn text-xs"
                  onClick={() => {
                    setVariantName('');
                    setSavingVariant(false);
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="btn w-full text-xs"
                onClick={() => setSavingVariant(true)}
                title="Save this component and its children as a reusable variant"
              >
                ◈ Save as Variant
              </button>
            )}
          </div>
        )}
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
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Text">
              <input className="input" value={p.text ?? ''} onChange={(e) => setProp('text', e.target.value)} />
            </Field>
          </div>
          <RichSpansEditor spans={p.richSpans} onChange={(s) => setProp('richSpans', s)} />
        </Section>
      );
    case 'button':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Text">
              <input className="input" value={p.text ?? ''} onChange={(e) => setProp('text', e.target.value)} />
            </Field>
          </div>
        </Section>
      );
    case 'statusbar':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Text (plain)">
              <input className="input" value={p.text ?? ''} onChange={(e) => setProp('text', e.target.value)} />
            </Field>
          </div>
          <RichSpansEditor spans={p.richSpans} onChange={(s) => setProp('richSpans', s)} />
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
    case 'spinner':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Label">
              <input className="input" value={p.text ?? ''} onChange={(e) => setProp('text', e.target.value)} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Style">
              <select
                className="input"
                value={p.spinnerStyle ?? 'dots'}
                onChange={(e) => setProp('spinnerStyle', e.target.value as SpinnerStyle)}
              >
                {(['dots', 'line', 'braille', 'arc'] as SpinnerStyle[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>
      );
    case 'toast':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Message">
              <input className="input" value={p.text ?? ''} onChange={(e) => setProp('text', e.target.value)} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Variant">
              <select
                className="input"
                value={p.toastVariant ?? 'info'}
                onChange={(e) => setProp('toastVariant', e.target.value as ToastVariant)}
              >
                {(['info', 'success', 'warning', 'error'] as ToastVariant[]).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>
      );
    case 'timer':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Value (e.g. 01:23:45)">
              <input className="input" value={p.timerValue ?? '00:00'} onChange={(e) => setProp('timerValue', e.target.value)} />
            </Field>
          </div>
        </Section>
      );
    case 'filepicker':
      return (
        <Section title="Files">
          <div className="col-span-2">
            <Field label="Items (one per line)">
              <textarea
                className="input min-h-[80px]"
                value={(p.items ?? []).join('\n')}
                onChange={(e) =>
                  setProp('items', e.target.value.split('\n').map((s) => s.trimEnd()))
                }
              />
            </Field>
          </div>
        </Section>
      );
    case 'asciitext':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Text">
              <input
                className="input"
                value={p.text ?? ''}
                placeholder="HELLO"
                onChange={(e) => setProp('text', e.target.value)}
              />
            </Field>
          </div>
        </Section>
      );
    case 'divider':
      return (
        <Section title="Content">
          <div className="col-span-2">
            <Field label="Label (optional)">
              <input className="input" value={p.text ?? ''} onChange={(e) => setProp('text', e.target.value)} />
            </Field>
          </div>
          <Field label="Orientation">
            <select
              className="input"
              value={p.orientation ?? 'horizontal'}
              onChange={(e) => setProp('orientation', e.target.value as 'horizontal' | 'vertical')}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </Field>
          <Field label="Label align">
            <select
              className="input"
              value={p.titleAlign ?? 'center'}
              onChange={(e) => setProp('titleAlign', e.target.value as TitleAlign)}
            >
              {(['left', 'center', 'right'] as TitleAlign[]).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Field>
        </Section>
      );
    default:
      return null;
  }
}

// ── Rich text span editor ─────────────────────────────────────────────────

function RichSpansEditor({
  spans,
  onChange,
}: {
  spans?: RichSpan[];
  onChange: (s: RichSpan[] | undefined) => void;
}) {
  const list = spans ?? [];

  const add = () => onChange([...list, { text: 'text', fg: 'default' }]);
  const remove = (i: number) => {
    const next = list.filter((_, idx) => idx !== i);
    onChange(next.length ? next : undefined);
  };
  const update = (i: number, patch: Partial<RichSpan>) => {
    onChange(list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="label">Rich spans</span>
        <button className="btn text-[10px] px-1 py-0.5" onClick={add}>+ span</button>
      </div>
      {list.map((span, i) => (
        <div key={i} className="flex gap-1 items-center">
          <input
            className="input flex-1 text-xs"
            value={span.text}
            placeholder="text"
            onChange={(e) => update(i, { text: e.target.value })}
          />
          <select
            className="input w-20 text-xs"
            value={span.fg ?? 'default'}
            onChange={(e) => update(i, { fg: e.target.value as AnsiColor })}
          >
            {ANSI_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="input w-20 text-xs"
            value={span.bg ?? 'default'}
            onChange={(e) => update(i, { bg: e.target.value as AnsiColor })}
          >
            {ANSI_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            className="text-ink-300 hover:text-red-400 text-xs"
            onClick={() => remove(i)}
          >✕</button>
        </div>
      ))}
    </div>
  );
}
