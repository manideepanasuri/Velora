import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VeloraDB extends DBSchema {
  documents: {
    key: string;
    value: {
      id: string; // usually the filePath, as it's a unique local path
      path: string;
      name: string;
      pageNumber: number;
      totalPages: number;
      lastOpened: number; // timestamp
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VeloraDB>> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<VeloraDB>('VeloraDatabase', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'path' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveDocumentState(path: string, name: string, pageNumber: number, totalPages: number) {
  const db = await getDb();
  await db.put('documents', {
    id: path,
    path,
    name,
    pageNumber,
    totalPages,
    lastOpened: Date.now(),
  });
}

export async function getRecentDocuments() {
  const db = await getDb();
  const docs = await db.getAll('documents');
  
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  // Filter for last 1 month, and sort by lastOpened descending
  return docs
    .filter(doc => doc.lastOpened >= oneMonthAgo)
    .sort((a, b) => b.lastOpened - a.lastOpened);
}

export async function removeDocument(path: string) {
  const db = await getDb();
  await db.delete('documents', path);
}
