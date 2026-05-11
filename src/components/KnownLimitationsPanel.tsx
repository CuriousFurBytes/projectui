import { useEffect } from 'react';
import { EXPORTER_CAPABILITIES } from '@/lib/exporterUtils';

const COMPONENT_TYPES = [
  'container', 'text', 'button', 'input', 'checkbox', 'select', 'list', 'textarea',
  'table', 'tabs', 'statusbar', 'progressbar', 'modal', 'spinner', 'divider', 'toast',
  'grid', 'viewport', 'timer', 'filepicker', 'asciitext', 'treeview', 'metriccard',
  'markdowntext',
];

const EXPORTERS = ['textual', 'bubbletea', 'ratatui', 'blessed', 'ncurses'] as const;

const EXPORTER_LABELS: Record<string, string> = {
  textual: 'Textual',
  bubbletea: 'Bubble Tea',
  ratatui: 'Ratatui',
  blessed: 'Blessed',
  ncurses: 'ncurses',
};

const KNOWN_LIMITATIONS = [
  'Bubble Tea: All layout is text-based; no pixel-perfect positioning.',
  'ncurses: Colors require terminal capability detection at runtime (initscr/start_color).',
  'Animations only preview in browser; exported code has static frames.',
  'Ratatui: No built-in modal widget; modals render as floating containers with absolute positioning simulation.',
  'Blessed/neo-blessed: Spinner animations require a timer loop not captured by static export.',
  'Textual: filepicker, timer, and asciitext components have no direct equivalent and are omitted.',
  'treeview, metriccard, markdowntext are advanced components not supported by any exporter yet.',
];

type SupportLevel = 'supported' | 'partial' | 'unsupported';

function getLevel(exporter: string, type: string): SupportLevel {
  const cap = EXPORTER_CAPABILITIES[exporter];
  if (!cap) return 'unsupported';
  if (cap.supported.includes(type)) return 'supported';
  if (cap.partial.includes(type)) return 'partial';
  return 'unsupported';
}

const LEVEL_STYLE: Record<SupportLevel, string> = {
  supported: 'text-green-400',
  partial: 'text-yellow-400',
  unsupported: 'text-red-400/70',
};

const LEVEL_SYMBOL: Record<SupportLevel, string> = {
  supported: '✓',
  partial: '~',
  unsupported: '✗',
};

export function KnownLimitationsPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[780px] max-h-[85vh] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600 shrink-0">
          <h2 className="text-sm font-semibold">Known Limitations &amp; Exporter Support</h2>
          <button
            className="text-ink-400 hover:text-white text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto flex-1 p-4 space-y-6">
          {/* Support matrix */}
          <section>
            <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-3">
              Component Support Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink-600">
                    <th className="text-left px-3 py-2 text-ink-400 font-medium w-36">Component</th>
                    {EXPORTERS.map((exp) => (
                      <th key={exp} className="text-center px-3 py-2 text-ink-400 font-medium">
                        {EXPORTER_LABELS[exp]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPONENT_TYPES.map((type) => (
                    <tr key={type} className="border-b border-ink-700 hover:bg-ink-700/30">
                      <td className="px-3 py-1.5 font-mono text-ink-300">{type}</td>
                      {EXPORTERS.map((exp) => {
                        const level = getLevel(exp, type);
                        return (
                          <td
                            key={exp}
                            className={`text-center px-3 py-1.5 font-mono font-bold ${LEVEL_STYLE[level]}`}
                          >
                            {LEVEL_SYMBOL[level]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-2 text-xs text-ink-400">
              <span><span className="text-green-400 font-bold">✓</span> Supported</span>
              <span><span className="text-yellow-400 font-bold">~</span> Partial</span>
              <span><span className="text-red-400/70 font-bold">✗</span> Unsupported</span>
            </div>
          </section>

          {/* Known limitations list */}
          <section>
            <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-3">
              Known Limitations
            </h3>
            <ul className="space-y-2">
              {KNOWN_LIMITATIONS.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-200">
                  <span className="text-yellow-400 shrink-0">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="px-4 py-3 border-t border-ink-600 shrink-0 flex justify-end">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
