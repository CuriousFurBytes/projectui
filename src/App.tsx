import { useState } from 'react';
import { TopBar } from './components/Layout/TopBar';
import { ComponentLibrary } from './components/ComponentLibrary';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { TerminalPreview } from './components/TerminalPreview';
import { CodeView } from './components/CodeView';

export default function App() {
  const [view, setView] = useState<'preview' | 'code'>('preview');

  return (
    <div className="h-full flex flex-col">
      <TopBar view={view} setView={setView} />
      <div className="flex-1 min-h-0 flex">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 border-r border-ink-600 flex flex-col gap-2 p-2 bg-ink-900">
          <ComponentLibrary />
          <LayersPanel />
        </aside>

        {/* Workspace */}
        <main className="flex-1 min-w-0 flex">
          {view === 'preview' ? <TerminalPreview /> : <CodeView />}
        </main>

        {/* Right sidebar */}
        <aside className="w-72 shrink-0 border-l border-ink-600 flex flex-col gap-2 p-2 bg-ink-900">
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}
