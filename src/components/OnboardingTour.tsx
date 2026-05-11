import { useState, useEffect } from 'react';

const STORAGE_DONE_KEY = 'projectui.onboarding.done';
const STORAGE_STEP_KEY = 'projectui.onboarding.v1';

const STEPS = [
  {
    title: 'Welcome to ProjecTUI!',
    body: 'Drag components from the left panel onto the canvas to start building your TUI layout.',
    icon: '👋',
  },
  {
    title: 'Edit Properties',
    body: 'Click any component to select it and edit its properties in the right panel.',
    icon: '✏️',
  },
  {
    title: 'Multiple Screens',
    body: 'Use the Screens tabs in the Layers panel to manage multiple screens in your project.',
    icon: '🖥',
  },
  {
    title: 'Command Palette',
    body: 'Press ⌘K (or Ctrl+K) to open the command palette for quick actions and component insertion.',
    icon: '⌘',
  },
  {
    title: 'Export Your Design',
    body: 'Switch to the Code tab to export your design as Python (Textual), Go (Bubble Tea), Rust (Ratatui), and more.',
    icon: '📦',
  },
  {
    title: "You're all set!",
    body: "Start building your terminal UI. Use the toolbar icons to access preferences, shortcuts, and more tools.",
    icon: '🚀',
  },
];

export function OnboardingTour() {
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_DONE_KEY) === 'true') {
      setDone(true);
      return;
    }
    const saved = localStorage.getItem(STORAGE_STEP_KEY);
    if (saved !== null) {
      const s = parseInt(saved, 10);
      if (!isNaN(s) && s >= 0 && s < STEPS.length) {
        setStep(s);
      }
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_DONE_KEY, 'true');
    setDone(true);
  };

  const goNext = () => {
    const next = step + 1;
    if (next >= STEPS.length) {
      dismiss();
    } else {
      setStep(next);
      localStorage.setItem(STORAGE_STEP_KEY, String(next));
    }
  };

  if (done) return null;

  const current = STEPS[step];

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 bg-ink-800 border border-accent/40 rounded-lg shadow-2xl p-4 flex flex-col gap-3">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={[
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-4 bg-accent' : i < step ? 'w-1.5 bg-accent/50' : 'w-1.5 bg-ink-600',
              ].join(' ')}
            />
          ))}
        </div>
        <span className="text-[10px] text-ink-400">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex gap-3 items-start">
        <span className="text-2xl shrink-0" aria-hidden="true">
          {current.icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink-100 mb-1">{current.title}</h3>
          <p className="text-xs text-ink-300 leading-relaxed">{current.body}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          className="btn text-xs text-ink-400 hover:text-ink-200"
          onClick={dismiss}
        >
          Skip tour
        </button>
        <button className="btn text-xs bg-accent text-ink-900 hover:opacity-90" onClick={goNext}>
          {step === STEPS.length - 1 ? 'Done' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
