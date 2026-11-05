// Small storage helper for visit recordings, keyed by patient id.
// Kept isolated so it can later be swapped for cloud storage without
// touching the player or upload flow.

const DB_NAME = "medinote-recordings";
const STORE_NAME = "recordings";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open recording store"));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const request = run(tx.objectStore(STORE_NAME));
        request.onsuccess = () => {
          resolve(request.result);
          db.close();
        };
        request.onerror = () => {
          reject(request.error ?? new Error("Recording store error"));
          db.close();
        };
      }),
  );
}

export function saveRecording(patientId: string, file: Blob): Promise<void> {
  return withStore("readwrite", (store) => store.put(file, patientId)).then(() => undefined);
}

export function hasRecording(patientId: string): Promise<boolean> {
  return withStore("readonly", (store) => store.getKey(patientId)).then((key) => key !== undefined);
}

export function getRecording(patientId: string): Promise<Blob | null> {
  return withStore<Blob | undefined>(
    "readonly",
    (store) => store.get(patientId) as IDBRequest<Blob | undefined>,
  )
    .then((blob) => blob ?? null)
    .catch((error) => {
      console.error("Could not read recording from IndexedDB", error);
      return null;
    });
}

export function deleteRecording(patientId: string): Promise<void> {
  return withStore("readwrite", (store) => store.delete(patientId)).then(() => undefined);
}

export function createRecordingUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeRecordingUrl(url: string | null | undefined): void {
  if (url) URL.revokeObjectURL(url);
}
