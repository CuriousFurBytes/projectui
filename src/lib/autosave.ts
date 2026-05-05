import type { ProjectState } from '@/types/component';

const AUTOSAVE_KEY = 'projectui.autosaves';
const MAX_SNAPSHOTS = 10;

interface AutosaveEntry {
  timestamp: number;
  project: ProjectState;
}

function loadEntries(): AutosaveEntry[] {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AutosaveEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: AutosaveEntry[]): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(entries));
  } catch {
    /* quota */
  }
}

export function saveAutosave(project: ProjectState): void {
  const entries = loadEntries();
  entries.push({ timestamp: Date.now(), project });
  const trimmed = entries.slice(-MAX_SNAPSHOTS);
  writeEntries(trimmed);
}

export function listAutosaves(): AutosaveEntry[] {
  return loadEntries();
}

export function getAutosave(index: number): ProjectState | undefined {
  const entries = loadEntries();
  return entries[index]?.project;
}

export function clearAutosaves(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    /* ignore */
  }
}
