import { useEditor } from '@/store/editorStore';
import clsx from 'clsx';

export function MotionAccessibilityToggle() {
  const reducedMotion = useEditor((s) => s.preferences.reducedMotion ?? false);
  const setPreference = useEditor((s) => s.setPreference);

  return (
    <button
      className={clsx(
        'btn px-2 py-1 text-xs shrink-0',
        reducedMotion ? 'bg-accent text-ink-900 font-semibold' : '',
      )}
      title={reducedMotion ? 'Reduced motion ON — click to disable' : 'Reduced motion OFF — click to enable'}
      onClick={() => setPreference('reducedMotion', !reducedMotion)}
      aria-pressed={reducedMotion}
      aria-label="Toggle reduced motion"
    >
      {reducedMotion ? '🐢 Motion: Reduced' : '⚡ Motion: Full'}
    </button>
  );
}
