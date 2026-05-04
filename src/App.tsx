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

export default function App() {
  const [view, setView] = useState<AppView>('preview');
  const [zoom, setZoom] = useState(1);
  const [animPaused, setAnimPaused] = useState(false);
  const [showFocusOrder, setShowFocusOrder] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);

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
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex">
          {/* Left sidebar */}
          <aside className="w-64 shrink-0 border-r border-ink-600 flex flex-col gap-2 p-2 bg-ink-900">
            <ComponentLibrary />
            <LayersPanel />
          </aside>

          {/* Workspace */}
          <main className="flex-1 min-w-0 flex">
            {view === 'preview' && (
              <TerminalPreview
                zoom={zoom}
                animPaused={animPaused}
                showFocusOrder={showFocusOrder}
              />
            )}
            {view === 'code' && <CodeView />}
            {view === 'live' && <TextualLivePreview />}
          </main>

          {/* Right sidebar */}
          <aside className="w-72 shrink-0 border-l border-ink-600 flex flex-col gap-2 p-2 bg-ink-900">
            <PropertiesPanel />
            {historyPanelOpen && <UndoHistoryPanel onClose={() => setHistoryPanelOpen(false)} />}
          </aside>
        </div>

        {/* Timeline panel at the bottom */}
        <TimelinePanel />
      </div>

      {/* Modals */}
      {cmdPaletteOpen && <CommandPalette onClose={() => setCmdPaletteOpen(false)} />}
      {templateGalleryOpen && <TemplateGallery onClose={() => setTemplateGalleryOpen(false)} />}
    </div>
  );
}
