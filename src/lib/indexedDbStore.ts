import type { ProjectState } from '@/types/component';

const DB_NAME = 'projectui';
const STORE_NAME = 'autosaves';
const DB_VERSION = 1;
const MAX_ENTRIES = 20;

export async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToIndexedDb(project: ProjectState): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const addReq = store.add({ timestamp: Date.now(), project });
    addReq.onsuccess = () => {
      const allReq = store.getAllKeys();
      allReq.onsuccess = () => {
        const keys = allReq.result as number[];
        if (keys.length > MAX_ENTRIES) {
          const toDelete = keys.slice(0, keys.length - MAX_ENTRIES);
          for (const key of toDelete) store.delete(key);
        }
      };
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadFromIndexedDb(): Promise<ProjectState | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor(null, 'prev');
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        resolve((cursor.value as { project: ProjectState }).project);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listIndexedDbSaves(): Promise<Array<{ timestamp: number; id: number }>> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const entries = req.result as Array<{ id: number; timestamp: number; project: ProjectState }>;
      resolve(entries.map(({ id, timestamp }) => ({ id, timestamp })));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getIndexedDbSave(id: number): Promise<ProjectState | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const entry = req.result as { project: ProjectState } | undefined;
      resolve(entry?.project ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearIndexedDb(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
