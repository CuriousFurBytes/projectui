import { useEditor } from '@/store/editorStore';

interface AlignButton {
  label: string;
  title: string;
  action: () => void;
}

export function AlignmentToolbar() {
  const selectedIds = useEditor((s) => s.selectedIds);
  const project = useEditor((s) => s.project);
  const alignNodes = useEditor((s) => s.alignNodes);
  const distributeNodes = useEditor((s) => s.distributeNodes);
  const groupNodes = useEditor((s) => s.groupNodes);
  const groupAsColumns = useEditor((s) => s.groupAsColumns);

  const ids = Array.from(selectedIds);

  if (ids.length < 2) return null;

  // Find the shared parent id (all selected nodes must share one for grouping)
  const firstNode = project.components[ids[0]];
  const sharedParentId = firstNode?.parentId ?? project.rootId;
  const canGroup = ids.every(
    (id) => project.components[id]?.parentId === sharedParentId,
  );

  const alignButtons: AlignButton[] = [
    { label: '⬤◻◻', title: 'Align Left', action: () => alignNodes(ids, 'left') },
    { label: '◻⬤◻', title: 'Align Center (H)', action: () => alignNodes(ids, 'center-h') },
    { label: '◻◻⬤', title: 'Align Right', action: () => alignNodes(ids, 'right') },
    { label: '⬤', title: 'Align Top', action: () => alignNodes(ids, 'top') },
    { label: '—', title: 'Align Center (V)', action: () => alignNodes(ids, 'center-v') },
    { label: '⬛', title: 'Align Bottom', action: () => alignNodes(ids, 'bottom') },
  ];

  const distributeButtons: AlignButton[] = [
    {
      label: '↔',
      title: 'Distribute Horizontally',
      action: () => distributeNodes(ids, 'horizontal'),
    },
    {
      label: '↕',
      title: 'Distribute Vertically',
      action: () => distributeNodes(ids, 'vertical'),
    },
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-ink-800 border-b border-ink-600">
      <span className="text-[10px] text-ink-400 mr-1">Align</span>
      {alignButtons.map((btn) => (
        <button
          key={btn.title}
          title={btn.title}
          onClick={btn.action}
          className="btn px-1.5 py-0.5 text-xs min-w-[28px]"
          aria-label={btn.title}
        >
          {btn.label}
        </button>
      ))}

      <div className="h-4 w-px bg-ink-600 mx-1" />

      <span className="text-[10px] text-ink-400 mr-1">Distribute</span>
      {distributeButtons.map((btn) => (
        <button
          key={btn.title}
          title={btn.title}
          onClick={btn.action}
          disabled={ids.length < 3}
          className="btn px-1.5 py-0.5 text-xs min-w-[28px] disabled:opacity-40"
          aria-label={btn.title}
        >
          {btn.label}
        </button>
      ))}

      {canGroup && (
        <>
          <div className="h-4 w-px bg-ink-600 mx-1" />
          <span className="text-[10px] text-ink-400 mr-1">Group</span>
          <button
            title="Group (auto-direction: row when space allows)"
            onClick={() => groupNodes(ids, sharedParentId)}
            className="btn px-1.5 py-0.5 text-xs"
            aria-label="Group"
          >
            ⊞ Auto
          </button>
          <button
            title="Group as Columns (always side-by-side, direction: row)"
            onClick={() => groupAsColumns(ids, sharedParentId)}
            className="btn px-1.5 py-0.5 text-xs"
            aria-label="Group as Columns"
          >
            ⊟ Columns
          </button>
        </>
      )}

      <span className="ml-2 text-[10px] text-ink-400">
        {ids.length} selected
      </span>
    </div>
  );
}
