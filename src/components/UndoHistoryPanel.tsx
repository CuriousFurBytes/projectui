import { useEditor } from '@/store/editorStore';

export function UndoHistoryPanel({ onClose }: { onClose: () => void }) {
  const past = useEditor((s) => s.past);
  const future = useEditor((s) => s.future);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);

  return (
    <section className="panel flex flex-col min-h-0 max-h-64">
      <div className="panel-header">
        <span>History</span>
        <button className="text-[10px] text-ink-400 hover:text-white" onClick={onClose}>✕</button>
      </div>
      <div className="overflow-auto flex-1 py-1">
        {/* Future (redo) entries — shown dimmed at top in reverse order */}
        {[...future].reverse().map((_, i) => {
          const realIdx = future.length - 1 - i;
          return (
            <div
              key={`future-${realIdx}`}
              className="flex items-center gap-2 px-3 py-1 text-xs text-ink-400 hover:bg-ink-700 cursor-pointer"
              onClick={() => { for (let j = 0; j <= i; j++) redo(); }}
            >
              <span className="w-3 text-center opacity-50">↷</span>
              <span className="truncate">Redo {realIdx + 1}</span>
            </div>
          );
        })}

        {/* Current state indicator */}
        <div className="flex items-center gap-2 px-3 py-1 text-xs bg-accent/20 border-l-2 border-accent">
          <span className="w-3 text-center">●</span>
          <span className="font-semibold">Current</span>
        </div>

        {/* Past (undo) entries — most recent first */}
        {[...past].reverse().map((_, i) => {
          const realIdx = past.length - 1 - i;
          return (
            <div
              key={`past-${realIdx}`}
              className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-ink-700 cursor-pointer"
              onClick={() => { for (let j = 0; j <= i; j++) undo(); }}
            >
              <span className="w-3 text-center opacity-50">↶</span>
              <span className="truncate text-ink-300">State {realIdx + 1}</span>
            </div>
          );
        })}

        {past.length === 0 && future.length === 0 && (
          <div className="text-center text-ink-400 text-xs py-4">No history yet</div>
        )}
      </div>
    </section>
  );
}
