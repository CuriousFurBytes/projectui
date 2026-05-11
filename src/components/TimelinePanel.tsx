import { useState } from 'react';
import { useEditor } from '@/store/editorStore';
import type { TimelineTransition } from '@/types/component';
import clsx from 'clsx';

const EVENT_OPTIONS: TimelineTransition['event'][] = ['keypress', 'click', 'custom'];

export function TimelinePanel() {
  const {
    project,
    switchLayer,
    addTimelineStep,
    removeTimelineStep,
    updateTimelineStep,
    addTimelineTransition,
    removeTimelineTransition,
    updateTimelineTransition,
  } = useEditor();

  const steps = project.timelineSteps ?? [];
  const transitions = project.timelineTransitions ?? [];
  const layers = project.layers ?? [];
  const activeLayerIndex = project.activeLayerIndex ?? 0;
  const activeLayerId = layers[activeLayerIndex]?.id;

  const [addingTransition, setAddingTransition] = useState<{
    fromStepId: string;
    toStepId: string;
    event: TimelineTransition['event'];
    trigger: string;
    label: string;
  } | null>(null);

  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepLabel, setEditingStepLabel] = useState('');

  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="border-t border-ink-600 bg-ink-900 flex items-center px-4 py-1 gap-3">
        <button
          className="text-xs text-ink-300 hover:text-white flex items-center gap-1"
          onClick={() => setExpanded(true)}
          aria-label="Expand timeline panel"
        >
          <span>⏱</span>
          <span>Timeline</span>
          <span className="text-ink-400">({steps.length} steps · {transitions.length} transitions)</span>
          <span className="text-ink-400 text-[10px]">▲</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="border-t border-ink-600 bg-ink-900 flex flex-col"
      style={{ height: 200 }}
      data-testid="timeline-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-ink-600">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-100">⏱ Timeline</span>
          <button
            className="btn text-[10px] px-2 py-0.5"
            onClick={() => {
              const firstLayer = layers[0];
              if (firstLayer) addTimelineStep(firstLayer.id, `Step ${steps.length + 1}`);
            }}
          >
            + step
          </button>
          <button
            className="btn text-[10px] px-2 py-0.5"
            onClick={() => {
              if (steps.length < 2) return alert('Need at least 2 steps to add a transition.');
              setAddingTransition({
                fromStepId: steps[0]!.id,
                toStepId: steps[1]?.id ?? steps[0]!.id,
                event: 'keypress',
                trigger: 'enter',
                label: '',
              });
            }}
          >
            + transition
          </button>
        </div>
        <button
          className="text-xs text-ink-400 hover:text-white"
          onClick={() => setExpanded(false)}
          aria-label="Collapse timeline panel"
        >
          ▼
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto flex gap-2 p-2 items-start">

        {/* Steps */}
        <div className="flex gap-2 items-start flex-wrap min-w-max">
          {steps.map((step, idx) => {
            const layer = layers.find((l) => l.id === step.layerId);
            const isActive = step.layerId === activeLayerId;
            const outgoing = transitions.filter((t) => t.fromStepId === step.id);

            return (
              <div key={step.id} className="flex items-center gap-1">
                {/* Step card */}
                <div
                  className={clsx(
                    'flex flex-col border rounded px-2 py-1 text-xs cursor-pointer min-w-[80px]',
                    isActive
                      ? 'border-accent bg-accent/10 text-white'
                      : 'border-ink-500 bg-ink-800 text-ink-200 hover:border-ink-300',
                  )}
                  onClick={() => {
                    const layerIdx = layers.findIndex((l) => l.id === step.layerId);
                    if (layerIdx >= 0) switchLayer(layerIdx);
                  }}
                  title={`Switch to ${layer?.name ?? step.layerId}`}
                >
                  {editingStepId === step.id ? (
                    <input
                      autoFocus
                      className="bg-transparent text-xs w-full outline-none border-b border-accent"
                      value={editingStepLabel}
                      onChange={(e) => setEditingStepLabel(e.target.value)}
                      onBlur={() => {
                        if (editingStepLabel.trim()) updateTimelineStep(step.id, { label: editingStepLabel.trim() });
                        setEditingStepId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editingStepLabel.trim()) updateTimelineStep(step.id, { label: editingStepLabel.trim() });
                          setEditingStepId(null);
                        } else if (e.key === 'Escape') {
                          setEditingStepId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="font-semibold truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingStepId(step.id);
                        setEditingStepLabel(step.label ?? layer?.name ?? step.id);
                      }}
                      title="Double-click to rename"
                    >
                      {step.label ?? layer?.name ?? `Step ${idx + 1}`}
                    </span>
                  )}
                  <span className="text-ink-400 text-[10px] truncate">{layer?.name ?? step.layerId}</span>
                  <div className="flex gap-1 mt-1">
                    {/* Layer selector */}
                    <select
                      className="bg-ink-700 text-[10px] rounded px-0.5 flex-1"
                      value={step.layerId}
                      onChange={(e) => updateTimelineStep(step.id, { layerId: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {layers.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    <button
                      className="text-[10px] text-ink-400 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTimelineStep(step.id);
                      }}
                      title="Remove step"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Outgoing transitions inline */}
                {outgoing.map((t) => {
                  return (
                    <div key={t.id} className="flex items-center gap-1">
                      <div className="flex flex-col items-center">
                        <span className="text-ink-400 text-[10px]">{t.label || `${t.event}${t.trigger ? `:${t.trigger}` : ''}`}</span>
                        <span className="text-accent text-xs">→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {steps.length === 0 && (
            <div className="text-xs text-ink-400 italic">
              No steps yet. Click "+ step" to add your first screen to the flow.
            </div>
          )}
        </div>

        {/* Transition list */}
        {transitions.length > 0 && (
          <div className="border-l border-ink-600 pl-3 ml-2 flex-shrink-0">
            <div className="text-[10px] text-ink-300 mb-1 font-semibold">Transitions</div>
            {transitions.map((t) => {
              const fromStep = steps.find((s) => s.id === t.fromStepId);
              const toStep = steps.find((s) => s.id === t.toStepId);
              return (
                <div key={t.id} className="flex items-center gap-2 text-[10px] text-ink-200 mb-1">
                  <span className="text-ink-300">{fromStep?.label ?? t.fromStepId}</span>
                  <span className="text-accent">→</span>
                  <span className="text-ink-300">{toStep?.label ?? t.toStepId}</span>
                  <span className="text-ink-400">on {t.event}{t.trigger ? ` "${t.trigger}"` : ''}</span>
                  {t.label && <span className="text-ink-500">({t.label})</span>}
                  <div className="flex gap-1 ml-auto">
                    <select
                      className="bg-ink-700 rounded px-0.5 text-[10px]"
                      value={t.event}
                      onChange={(e) => updateTimelineTransition(t.id, { event: e.target.value as TimelineTransition['event'] })}
                    >
                      {EVENT_OPTIONS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                    <input
                      className="bg-ink-700 rounded px-0.5 text-[10px] w-16"
                      value={t.trigger ?? ''}
                      placeholder="trigger"
                      onChange={(e) => updateTimelineTransition(t.id, { trigger: e.target.value || undefined })}
                    />
                    <button
                      className="text-ink-400 hover:text-red-400"
                      onClick={() => removeTimelineTransition(t.id)}
                      title="Remove transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add transition modal */}
      {addingTransition && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-ink-800 border border-ink-500 rounded p-4 min-w-[320px] flex flex-col gap-3">
            <div className="text-sm font-semibold text-white">Add Transition</div>
            <label className="flex flex-col gap-1 text-xs text-ink-200">
              From step
              <select
                className="input"
                value={addingTransition.fromStepId}
                onChange={(e) => setAddingTransition({ ...addingTransition, fromStepId: e.target.value })}
              >
                {steps.map((s) => <option key={s.id} value={s.id}>{s.label ?? s.id}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-200">
              To step
              <select
                className="input"
                value={addingTransition.toStepId}
                onChange={(e) => setAddingTransition({ ...addingTransition, toStepId: e.target.value })}
              >
                {steps.map((s) => <option key={s.id} value={s.id}>{s.label ?? s.id}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-200">
              Event
              <select
                className="input"
                value={addingTransition.event}
                onChange={(e) => setAddingTransition({ ...addingTransition, event: e.target.value as TimelineTransition['event'] })}
              >
                {EVENT_OPTIONS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-200">
              Trigger (e.g. "enter", "q", mouse_click)
              <input
                className="input"
                value={addingTransition.trigger}
                onChange={(e) => setAddingTransition({ ...addingTransition, trigger: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-200">
              Label (optional)
              <input
                className="input"
                value={addingTransition.label}
                placeholder="Open modal"
                onChange={(e) => setAddingTransition({ ...addingTransition, label: e.target.value })}
              />
            </label>
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={() => setAddingTransition(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (addingTransition.fromStepId === addingTransition.toStepId) {
                    alert('From and To steps must be different.');
                    return;
                  }
                  addTimelineTransition(
                    addingTransition.fromStepId,
                    addingTransition.toStepId,
                    addingTransition.event,
                    addingTransition.trigger || undefined,
                    addingTransition.label || undefined,
                  );
                  setAddingTransition(null);
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
