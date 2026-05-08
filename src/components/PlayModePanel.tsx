import { useState, useEffect, useRef } from 'react';
import { useEditor } from '@/store/editorStore';

interface RecordedEvent {
  key: string;
  timestamp: number;
}

export function PlayModePanel({ onClose }: { onClose: () => void }) {
  const project = useEditor((s) => s.project);
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  const layers = project.layers ?? [];
  const activeIdx = project.activeLayerIndex ?? 0;
  const activeLayer = layers[activeIdx];
  const transitions = project.timelineTransitions ?? [];
  const steps = project.timelineSteps ?? [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [recordedEvents]);

  const handleKeyCapture = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') return;
    e.preventDefault();
    const key = e.key;
    setRecordedEvents((prev) => [...prev, { key, timestamp: Date.now() }]);
  };

  const handleClear = () => {
    setRecordedEvents([]);
    setPlaybackIndex(-1);
  };

  const handlePlayback = () => {
    if (recordedEvents.length === 0) return;
    setPlaybackIndex(0);
  };

  const handleStepForward = () => {
    setPlaybackIndex((i) => Math.min(i + 1, recordedEvents.length - 1));
  };

  const handleStepBack = () => {
    setPlaybackIndex((i) => Math.max(i - 1, 0));
  };

  const getMatchingTransitions = (key: string) => {
    const activeStep = steps.find((s) => s.layerId === activeLayer?.id);
    if (!activeStep) return [];
    return transitions.filter(
      (t) =>
        t.fromStepId === activeStep.id &&
        (t.event === 'keypress' || t.event === 'custom') &&
        (t.trigger === key || !t.trigger),
    );
  };

  const currentEvent = playbackIndex >= 0 ? recordedEvents[playbackIndex] : null;
  const matchingTransitions = currentEvent ? getMatchingTransitions(currentEvent.key) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[560px] max-h-[80vh] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600 shrink-0">
          <h2 className="text-sm font-semibold">▶ Play Mode</h2>
          <button
            className="text-ink-400 hover:text-white text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Current screen info */}
          <div className="bg-ink-900 rounded p-3 text-xs">
            <span className="text-ink-400">Current screen: </span>
            <span className="text-accent font-semibold">
              {activeLayer?.name ?? 'Unknown'}
            </span>
            <span className="text-ink-400 ml-2">
              ({Object.keys(project.components).length} components)
            </span>
          </div>

          {/* Key capture area */}
          <div>
            <label className="text-xs text-ink-400 mb-1 block">
              Key Input Capture — click here and type keys to record them:
            </label>
            <input
              ref={inputRef}
              className="input w-full text-sm font-mono"
              placeholder="Click here and press keys to record…"
              onKeyDown={handleKeyCapture}
              readOnly
              value=""
              onChange={() => {}}
              aria-label="Key capture input"
            />
          </div>

          {/* Recorded events timeline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ink-400">Recorded Events ({recordedEvents.length})</span>
              <button className="btn text-xs" onClick={handleClear}>
                Clear
              </button>
            </div>
            <div className="bg-ink-900 rounded p-2 max-h-32 overflow-auto font-mono text-xs space-y-0.5">
              {recordedEvents.length === 0 ? (
                <span className="text-ink-500">No events recorded yet.</span>
              ) : (
                recordedEvents.map((evt, i) => (
                  <div
                    key={i}
                    className={[
                      'px-2 py-0.5 rounded flex items-center gap-2',
                      i === playbackIndex ? 'bg-accent/20 text-accent' : 'text-ink-300',
                    ].join(' ')}
                  >
                    <span className="text-ink-500 w-6 text-right">{i + 1}.</span>
                    <kbd className="bg-ink-700 border border-ink-600 px-1.5 py-0.5 rounded text-[11px]">
                      {evt.key}
                    </kbd>
                    {i === playbackIndex && (
                      <span className="text-[10px] text-accent ml-auto">◀ current</span>
                    )}
                  </div>
                ))
              )}
              <div ref={eventsEndRef} />
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button
              className="btn text-xs"
              onClick={handlePlayback}
              disabled={recordedEvents.length === 0}
            >
              ▶ Start Playback
            </button>
            <button
              className="btn text-xs"
              onClick={handleStepBack}
              disabled={playbackIndex <= 0}
            >
              ← Step Back
            </button>
            <button
              className="btn text-xs"
              onClick={handleStepForward}
              disabled={playbackIndex < 0 || playbackIndex >= recordedEvents.length - 1}
            >
              Step Forward →
            </button>
            <span className="text-[10px] text-ink-400 ml-auto">
              {playbackIndex >= 0
                ? `Step ${playbackIndex + 1} / ${recordedEvents.length}`
                : 'Not playing'}
            </span>
          </div>

          {/* Matching transitions */}
          {currentEvent && (
            <div>
              <span className="text-xs text-ink-400 mb-1 block">
                Transitions triggered by key &quot;{currentEvent.key}&quot;:
              </span>
              <div className="bg-ink-900 rounded p-2 text-xs space-y-1">
                {matchingTransitions.length === 0 ? (
                  <span className="text-ink-500">No transitions match this key from the current screen.</span>
                ) : (
                  matchingTransitions.map((t) => {
                    const toStep = steps.find((s) => s.id === t.toStepId);
                    const toLayer = layers.find((l) => l.id === toStep?.layerId);
                    return (
                      <div key={t.id} className="flex items-center gap-2 text-ink-200">
                        <span className="text-accent">→</span>
                        <span>Navigate to</span>
                        <span className="text-accent font-semibold">
                          {toLayer?.name ?? toStep?.label ?? t.toStepId}
                        </span>
                        {t.label && <span className="text-ink-400">({t.label})</span>}
                      </div>
                    );
                  })
                )}
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
