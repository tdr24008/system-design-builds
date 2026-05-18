/**
 * IndexedDB outbox — offline-first queue for workout writes.
 *
 * When the user saves a workout on the Log screen:
 *   1. Call enqueue(item) → stored in IndexedDB immediately.
 *   2. Render the existing success UI (checkmark + "syncing…" toast).
 *   3. Call drainQueue() in the background → POSTs each item to the API.
 *   4. On success, call dequeue(id) to remove it.
 *
 * On app startup, drainQueue() should be called so that any items
 * that failed to sync last session are retried.
 */

export interface QueueItem {
  id: string;            // workout UUID (client-generated)
  type: string;
  title: string;
  started_at: string;
  ended_at?: string | null;
  distance_km?: number | null;
  notes?: string | null;
  privacy: string;
  client_updated_at: string;
  deleted?: boolean;
  queued_at: string;     // ISO timestamp when the item was enqueued
}

const DB_NAME = 'pulse-offline';
const STORE = 'outbox';
const VERSION = 1;

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(item: QueueItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dequeue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPending(): Promise<QueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Drain the outbox — call on app startup and after any network recovery.
 * Accepts a postFn so it can be tested without a real API.
 */
export async function drainQueue(
  postFn: (item: QueueItem) => Promise<unknown>,
  onSuccess?: (id: string) => void,
  onError?: (id: string, err: unknown) => void,
): Promise<void> {
  const pending = await getPending();
  for (const item of pending) {
    try {
      await postFn(item);
      await dequeue(item.id);
      onSuccess?.(item.id);
    } catch (err) {
      onError?.(item.id, err);
      // Keep item in queue for next retry
    }
  }
}
