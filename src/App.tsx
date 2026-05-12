import { useState, useEffect } from 'react';
import { TopBar, type AppView } from './components/Layout/TopBar';
import { ComponentLibrary } from './components/ComponentLibrary';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { TerminalPreview } from './components/TerminalPreview';
import { CodeView } from './components/CodeView';
import { TextualLivePreview } from './components/TextualLivePreview';
import { TimelinePanel } from './components/TimelinePanel';
import { CommandPalette } from './components/CommandPalette';
import { TemplateGallery } from './components/TemplateGallery';
import { UndoHistoryPanel } from './components/UndoHistoryPanel';
import { DemoGallery } from './components/DemoGallery';
import { PreferencesPanel } from './components/PreferencesPanel';
import { KeyboardShortcutsScreen } from './components/KeyboardShortcutsScreen';
import { VisualDiffView } from './components/VisualDiffView';
import { PlayModePanel } from './components/PlayModePanel';
import { KnownLimitationsPanel } from './components/KnownLimitationsPanel';
import { PNGSVGExport } from './components/PNGSVGExport';
import { AsciiMotionImportDialog } from './components/AsciiMotionImportDialog';
import { PerformanceProfilerOverlay } from './components/PerformanceProfilerOverlay';
import { RightClickMenu } from './components/RightClickMenu';
import { OnboardingTour } from './components/OnboardingTour';
import { AlignmentToolbar } from './components/AlignmentToolbar';
import { QuickActionsToolbar } from './components/QuickActionsToolbar';
import { GridRulerOverlay } from './components/GridRulerOverlay';
import { MotionAccessibilityToggle } from './components/MotionAccessibilityToggle';
import { useEditor } from './store/editorStore';
import { saveAutosave } from '@/lib/autosave';
import { buildProjectHash, parseProjectFromHash } from '@/lib/shareUrl';
import { MobileBlock, isMobile } from './components/MobileBlock';
import clsx from 'clsx';

interface RightClickState {
  x: number;
  y: number;
  nodeId: string;
}

export default function App() {
  const isMobileDevice = isMobile();
  const [view, setView] = useState<AppView>('preview');
  const [zoom, setZoom] = useState(1);
  const [animPaused, setAnimPaused] = useState(false);
  const [showFocusOrder, setShowFocusOrder] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);

  // New panel states
  const [showPreferences, setShowPreferences] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showVisualDiff, setShowVisualDiff] = useState(false);
  const [showPlayMode, setShowPlayMode] = useState(false);
  const [showKnownLimitations, setShowKnownLimitations] = useState(false);
  const [showDemoGallery, setShowDemoGallery] = useState(false);
  const [showPNGExport, setShowPNGExport] = useState(false);
  const [showAsciiMotionImport, setShowAsciiMotionImport] = useState(false);
  const [showPerformanceProfiler, setShowPerformanceProfiler] = useState(false);
  const [rightClickMenu, setRightClickMenu] = useState<RightClickState | null>(null);

  const selectedId = useEditor((s) => s.selectedId);
  const loadFromJson = useEditor((s) => s.loadFromJson);
  const preferences = useEditor((s) => s.preferences);
  const project = useEditor((s) => s.project);

  // Global ⌘K opens command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // On mount: load project from URL hash if present.
  useEffect(() => {
    parseProjectFromHash(window.location.hash).then((loaded) => {
      if (loaded) loadFromJson(JSON.stringify(loaded));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL hash in sync with current project state (debounced 1s).
  useEffect(() => {
    const id = setTimeout(() => {
      buildProjectHash(project).then((hash) => {
        history.replaceState(null, '', hash);
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [project]);

  const autoSaveIntervalMs = preferences.autoSaveIntervalMs;
  useEffect(() => {
    if (!autoSaveIntervalMs || autoSaveIntervalMs <= 0) return;
    const id = setInterval(() => {
      saveAutosave(useEditor.getState().project);
    }, autoSaveIntervalMs);
    return () => clearInterval(id);
  }, [autoSaveIntervalMs]);

  const handleCanvasRightClick = (e: React.MouseEvent) => {
    // Only activate right-click menu if clicking on a node
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node-id]') as HTMLElement | null;
    if (!nodeEl) return;
    const nodeId = nodeEl.dataset.nodeId;
    if (!nodeId) return;
    e.preventDefault();
    setRightClickMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const showGridOrRulers = preferences.showGrid || preferences.showRulers;

  if (isMobileDevice) return <MobileBlock />;

  return (
    <div className="h-full flex flex-col">
      <TopBar
        view={view}
        setView={setView}
        zoom={zoom}
        setZoom={setZoom}
        animPaused={animPaused}
        setAnimPaused={setAnimPaused}
        showFocusOrder={showFocusOrder}
        setShowFocusOrder={setShowFocusOrder}
        onOpenCommandPalette={() => setCmdPaletteOpen(true)}
        onOpenTemplates={() => setTemplateGalleryOpen(true)}
        onOpenHistory={() => setHistoryPanelOpen(true)}
      />

      {/* Secondary toolbar — new panel buttons */}
      <div className="h-9 shrink-0 border-b border-ink-600 bg-ink-900 flex items-center px-3 gap-1 overflow-x-auto">
        <button
          className={clsx('btn text-xs px-1.5 py-0.5 shrink-0', showPreferences ? 'bg-accent text-ink-900' : '')}
          title="Preferences"
          onClick={() => setShowPreferences(true)}
          aria-label="Open Preferences"
        >
          ⚙ Prefs
        </button>
        <button
          className={clsx('btn text-xs px-1.5 py-0.5 shrink-0', showKeyboardShortcuts ? 'bg-accent text-ink-900' : '')}
          title="Keyboard shortcuts"
          onClick={() => setShowKeyboardShortcuts(true)}
          aria-label="Keyboard Shortcuts"
        >
          ⌨ Shortcuts
        </button>

        <div className="h-4 w-px bg-ink-600 mx-1 shrink-0" />

        <MotionAccessibilityToggle />

        <button
          className={clsx('btn text-xs px-1.5 py-0.5 shrink-0', showPerformanceProfiler ? 'bg-accent text-ink-900' : '')}
          title="Performance profiler"
          onClick={() => setShowPerformanceProfiler((v) => !v)}
          aria-label="Toggle Performance Profiler"
        >
          📊 Perf
        </button>

        <div className="h-4 w-px bg-ink-600 mx-1 shrink-0" />

        <button
          className="btn text-xs px-1.5 py-0.5 shrink-0"
          title="Known limitations"
          aria-label="Known limitations"
          onClick={() => setShowKnownLimitations(true)}
        >
          ! Limitations
        </button>
        <button
          className="btn text-xs px-1.5 py-0.5 shrink-0"
          title="Visual diff"
          aria-label="Visual diff"
          onClick={() => setShowVisualDiff(true)}
        >
          ≠ Diff
        </button>
        <button
          className="btn text-xs px-1.5 py-0.5 shrink-0"
          title="Play mode"
          aria-label="Play mode"
          onClick={() => setShowPlayMode(true)}
        >
          ▶ Play
        </button>
        <button
          className="btn text-xs px-1.5 py-0.5 shrink-0"
          title="Import ASCII Motion"
          aria-label="Import ASCII Motion"
          onClick={() => setShowAsciiMotionImport(true)}
        >
          ↓ ASCII Motion
        </button>

        <div className="h-4 w-px bg-ink-600 mx-1 shrink-0" />

        <button
          className="btn text-xs px-1.5 py-0.5 shrink-0"
          title="Demo gallery"
          aria-label="Demo gallery"
          onClick={() => setShowDemoGallery(true)}
        >
          🖼 Gallery
        </button>
        <button
          className="btn text-xs px-1.5 py-0.5 shrink-0"
          title="Export as PNG / SVG"
          aria-label="Export as PNG / SVG"
          onClick={() => setShowPNGExport(true)}
        >
          📷 Export Image
        </button>
      </div>

      {/* Alignment toolbar — shown when 2+ components selected */}
      <AlignmentToolbar />

      {/* Quick actions toolbar — shown when a component is selected */}
      {selectedId && <QuickActionsToolbar />}

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex">
          {/* Left sidebar */}
          <aside className="w-64 shrink-0 border-r border-ink-600 flex flex-col gap-2 p-2 bg-ink-900 overflow-y-auto min-h-0">
            <ComponentLibrary />
            <LayersPanel />
          </aside>

          {/* Workspace */}
          <main
            className="flex-1 min-w-0 flex relative"
            onContextMenu={handleCanvasRightClick}
          >
            {view === 'preview' && (
              <>
                <TerminalPreview
                  zoom={zoom}
                  animPaused={animPaused}
                  showFocusOrder={showFocusOrder}
                />
                {showGridOrRulers && (
                  <GridRulerOverlay
                    cols={100}
                    rows={30}
                    cellWidth={8}
                    cellHeight={16}
                    zoom={zoom}
                  />
                )}
              </>
            )}
            {view === 'code' && <CodeView />}
            {view === 'live' && <TextualLivePreview />}
          </main>

          {/* Right sidebar */}
          <aside className="w-72 shrink-0 border-l border-ink-600 flex flex-col gap-2 p-2 bg-ink-900 overflow-y-auto min-h-0">
            <div id="properties-panel" className="flex-1 min-h-0 flex flex-col">
              <PropertiesPanel />
            </div>
            {historyPanelOpen && <UndoHistoryPanel onClose={() => setHistoryPanelOpen(false)} />}
          </aside>
        </div>

        {/* Timeline panel at the bottom */}
        <TimelinePanel />
      </div>

      {/* Modals */}
      {cmdPaletteOpen && <CommandPalette onClose={() => setCmdPaletteOpen(false)} />}
      {templateGalleryOpen && <TemplateGallery onClose={() => setTemplateGalleryOpen(false)} />}
      {showPreferences && <PreferencesPanel onClose={() => setShowPreferences(false)} />}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsScreen onClose={() => setShowKeyboardShortcuts(false)} />
      )}
      {showVisualDiff && <VisualDiffView onClose={() => setShowVisualDiff(false)} />}
      {showPlayMode && <PlayModePanel onClose={() => setShowPlayMode(false)} />}
      {showKnownLimitations && (
        <KnownLimitationsPanel onClose={() => setShowKnownLimitations(false)} />
      )}
      {showDemoGallery && (
        <DemoGallery
          onClose={() => setShowDemoGallery(false)}
          onLoad={(project) => loadFromJson(JSON.stringify(project))}
        />
      )}
      {showPNGExport && <PNGSVGExport onClose={() => setShowPNGExport(false)} />}
      {showAsciiMotionImport && (
        <AsciiMotionImportDialog onClose={() => setShowAsciiMotionImport(false)} />
      )}

      {/* Right-click context menu */}
      {rightClickMenu && (
        <RightClickMenu
          x={rightClickMenu.x}
          y={rightClickMenu.y}
          nodeId={rightClickMenu.nodeId}
          onClose={() => setRightClickMenu(null)}
        />
      )}

      {/* Always-rendered components */}
      <OnboardingTour />
      <PerformanceProfilerOverlay visible={showPerformanceProfiler} />
    </div>
  );
}
