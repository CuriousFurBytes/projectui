import { useEditor } from '@/store/editorStore';
import { getDef } from '@/lib/componentDefs';

export function QuickActionsToolbar() {
  const {
    project,
    selectedId,
    select,
    remove,
    copyNode,
    pasteNode,
    move,
    clipboardId,
  } = useEditor();

  if (!selectedId) return null;

  const node = project.components[selectedId];
  if (!node) return null;

  const def = getDef(node.type);
  const isRoot = selectedId === project.rootId;
  const parentId = node.parentId;
  const parent = parentId ? project.components[parentId] : null;
  const siblings = parent?.children ?? [];
  const idx = siblings.indexOf(selectedId);

  const handleMoveUp = () => {
    if (!parentId || idx <= 0) return;
    move(selectedId, parentId, idx - 1);
  };

  const handleMoveDown = () => {
    if (!parentId || idx >= siblings.length - 1) return;
    move(selectedId, parentId, idx + 2);
  };

  const handleDuplicate = () => {
    copyNode(selectedId);
    const targetParentId = parentId ?? project.rootId;
    const newId = pasteNode(targetParentId);
    if (newId) select(newId);
  };

  const handleDelete = () => {
    if (isRoot || node.locked) return;
    const label = node.name ?? def.label;
    if (confirm(`Delete "${label}"?`)) {
      remove(selectedId);
    }
  };

  const handleScrollToProps = () => {
    const el = document.getElementById('properties-panel');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-ink-800 border-b border-ink-600 text-xs shrink-0">
      {/* Component label */}
      <span className="text-ink-300">
        <span className="text-accent font-mono mr-1">{def.icon}</span>
        <span className="font-semibold text-ink-100">{node.name ?? def.label}</span>
        <span className="ml-1 text-[10px] text-ink-400 bg-ink-700 px-1.5 py-0.5 rounded">
          {node.type}
        </span>
      </span>

      <div className="h-4 w-px bg-ink-600 mx-1" />

      <button
        className="btn px-1.5 py-0.5 disabled:opacity-40"
        title="Move Up in parent"
        disabled={isRoot || idx <= 0}
        onClick={handleMoveUp}
      >
        ↑ Up
      </button>
      <button
        className="btn px-1.5 py-0.5 disabled:opacity-40"
        title="Move Down in parent"
        disabled={isRoot || idx >= siblings.length - 1}
        onClick={handleMoveDown}
      >
        ↓ Down
      </button>

      <div className="h-4 w-px bg-ink-600 mx-1" />

      <button
        className="btn px-1.5 py-0.5"
        title="Duplicate component"
        onClick={handleDuplicate}
        disabled={isRoot}
      >
        ⧉ Duplicate
      </button>
      <button
        className="btn px-1.5 py-0.5"
        title="Copy component"
        onClick={() => copyNode(selectedId)}
      >
        ⎘ Copy
      </button>
      {clipboardId && (
        <button
          className="btn px-1.5 py-0.5"
          title="Paste as sibling"
          onClick={() => pasteNode(parentId ?? project.rootId)}
        >
          📋 Paste
        </button>
      )}

      <div className="h-4 w-px bg-ink-600 mx-1" />

      <button
        className="btn px-1.5 py-0.5 text-red-400 hover:text-red-300 disabled:opacity-40"
        title={node.locked ? 'Unlock to delete' : 'Delete component'}
        disabled={isRoot || node.locked}
        onClick={handleDelete}
      >
        ✕ Delete
      </button>

      <div className="h-4 w-px bg-ink-600 mx-1" />

      <button
        className="btn px-1.5 py-0.5"
        title="Scroll to Properties panel"
        onClick={handleScrollToProps}
      >
        ⚙ Properties
      </button>
    </div>
  );
}
