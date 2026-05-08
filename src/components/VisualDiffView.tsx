import { useState, useEffect } from 'react';
import { useEditor } from '@/store/editorStore';
import { listAutosaves, getAutosave } from '@/lib/autosave';
import { diffProjects } from '@/lib/visualDiff';
import type { ProjectState } from '@/types/component';

export function VisualDiffView({ onClose }: { onClose: () => void }) {
  const currentProject = useEditor((s) => s.project);
  const autosaves = listAutosaves();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [beforeProject, setBeforeProject] = useState<ProjectState | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (selectedIdx === null) {
      setBeforeProject(null);
      return;
    }
    const saved = getAutosave(selectedIdx);
    setBeforeProject(saved ?? null);
  }, [selectedIdx]);

  const diff = beforeProject ? diffProjects(beforeProject, currentProject) : null;

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[680px] max-h-[85vh] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600 shrink-0">
          <h2 className="text-sm font-semibold">Visual Diff</h2>
          <button
            className="text-ink-400 hover:text-white text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Snapshot selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-ink-300 shrink-0">Compare with autosave:</label>
            <select
              className="input flex-1 text-xs"
              value={selectedIdx ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedIdx(v === '' ? null : Number(v));
              }}
            >
              <option value="">— Select a snapshot —</option>
              {autosaves.map((save, i) => (
                <option key={i} value={i}>
                  {formatTimestamp(save.timestamp)} ({Object.keys(save.project.components).length} components)
                </option>
              ))}
            </select>
          </div>

          {autosaves.length === 0 && (
            <div className="text-sm text-ink-400 text-center py-4">
              No autosave snapshots available yet. The project is autosaved periodically.
            </div>
          )}

          {/* Diff summary */}
          {diff && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{diff.summary.added}</div>
                <div className="text-xs text-green-400/70 mt-1">Added</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{diff.summary.removed}</div>
                <div className="text-xs text-red-400/70 mt-1">Removed</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{diff.summary.changed}</div>
                <div className="text-xs text-yellow-400/70 mt-1">Changed</div>
              </div>
              <div className="bg-ink-700 border border-ink-600 rounded p-3 text-center">
                <div className="text-2xl font-bold text-ink-300">{diff.summary.unchanged}</div>
                <div className="text-xs text-ink-400 mt-1">Unchanged</div>
              </div>
            </div>
          )}

          {/* Side-by-side panels */}
          {diff && (
            <div className="grid grid-cols-2 gap-4">
              {/* Before */}
              <div>
                <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">
                  Before (autosave)
                </h3>
                <div className="bg-ink-900 rounded p-2 max-h-64 overflow-auto text-xs space-y-0.5">
                  {Object.values(beforeProject?.components ?? {}).map((node) => {
                    const inDiff = diff.removed.some((d) => d.nodeId === node.id)
                      ? 'removed'
                      : diff.changed.some((d) => d.nodeId === node.id)
                      ? 'changed'
                      : 'unchanged';
                    return (
                      <div
                        key={node.id}
                        className={[
                          'px-2 py-0.5 rounded font-mono flex items-center gap-1',
                          inDiff === 'removed'
                            ? 'bg-red-500/10 text-red-400'
                            : inDiff === 'changed'
                            ? 'bg-yellow-500/10 text-yellow-300'
                            : 'text-ink-400',
                        ].join(' ')}
                      >
                        {inDiff === 'removed' && <span>−</span>}
                        {inDiff === 'changed' && <span>~</span>}
                        {inDiff === 'unchanged' && <span className="text-ink-600"> </span>}
                        <span>{node.name ?? node.type}</span>
                        <span className="text-ink-600 text-[10px] ml-auto">{node.type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* After */}
              <div>
                <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">
                  After (current)
                </h3>
                <div className="bg-ink-900 rounded p-2 max-h-64 overflow-auto text-xs space-y-0.5">
                  {Object.values(currentProject.components).map((node) => {
                    const inDiff = diff.added.some((d) => d.nodeId === node.id)
                      ? 'added'
                      : diff.changed.some((d) => d.nodeId === node.id)
                      ? 'changed'
                      : 'unchanged';
                    return (
                      <div
                        key={node.id}
                        className={[
                          'px-2 py-0.5 rounded font-mono flex items-center gap-1',
                          inDiff === 'added'
                            ? 'bg-green-500/10 text-green-400'
                            : inDiff === 'changed'
                            ? 'bg-yellow-500/10 text-yellow-300'
                            : 'text-ink-400',
                        ].join(' ')}
                      >
                        {inDiff === 'added' && <span>+</span>}
                        {inDiff === 'changed' && <span>~</span>}
                        {inDiff === 'unchanged' && <span className="text-ink-600"> </span>}
                        <span>{node.name ?? node.type}</span>
                        <span className="text-ink-600 text-[10px] ml-auto">{node.type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Changed nodes detail */}
          {diff && diff.changed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">
                Changed Props
              </h3>
              <div className="bg-ink-900 rounded p-2 max-h-40 overflow-auto space-y-2 text-xs">
                {diff.changed.map((d) => (
                  <div key={d.nodeId} className="border-b border-ink-700 pb-1.5 last:border-0">
                    <span className="text-yellow-300 font-mono">
                      {d.newNode?.name ?? d.newNode?.type ?? d.nodeId}
                    </span>
                    <span className="text-ink-400 ml-2">
                      Changed: {d.changedProps?.join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-ink-600 flex justify-end shrink-0">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
