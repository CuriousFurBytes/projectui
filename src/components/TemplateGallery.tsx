import { TEMPLATES } from '@/lib/templates';
import { useEditor } from '@/store/editorStore';

export function TemplateGallery({ onClose }: { onClose: () => void }) {
  const loadFromJson = useEditor((s) => s.loadFromJson);

  const loadTemplate = (id: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === id);
    if (!tmpl) return;
    if (!confirm(`Load template "${tmpl.name}"? Unsaved changes will be lost.`)) return;
    const project = tmpl.make();
    loadFromJson(JSON.stringify(project));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-[600px] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600">
          <h2 className="text-sm font-semibold">Template Gallery</h2>
          <button className="text-ink-400 hover:text-white text-lg" onClick={onClose}>✕</button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 overflow-auto max-h-[70vh]">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              className="text-left bg-ink-700 hover:bg-ink-600 border border-ink-500 hover:border-accent rounded-lg p-4 transition-colors"
              onClick={() => loadTemplate(tmpl.id)}
            >
              <div className="text-sm font-semibold mb-1">{tmpl.name}</div>
              <div className="text-[11px] text-ink-300 leading-relaxed">{tmpl.description}</div>
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-ink-600 text-[10px] text-ink-400">
          Click a template to load it — this replaces the current project.
        </div>
      </div>
    </div>
  );
}
