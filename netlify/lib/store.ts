// Хранилище истории снимков.
// На Netlify — Netlify Blobs (zero-config). Локально/в GitHub Action — файл data/history.json.

import type { Snapshot } from './types.ts';

const STORE_NAME = 'savings-battle';
const HISTORY_KEY = 'history';
const ERROR_KEY = 'last-error';

const LOCAL_DIR = 'data';
const LOCAL_FILE = `${LOCAL_DIR}/history.json`;
const LOCAL_ERR = `${LOCAL_DIR}/last-error.txt`;

/** Пытается получить Netlify Blobs store; при неудаче — null (значит, локальный режим). */
async function getBlobStore(): Promise<{
  get: (k: string, o?: { type: 'json' | 'text' }) => Promise<unknown>;
  set: (k: string, v: string) => Promise<void>;
} | null> {
  try {
    const mod = await import('@netlify/blobs');
    const store = mod.getStore(STORE_NAME);
    // Лёгкая проверка, что контекст доступен.
    return store as unknown as {
      get: (k: string, o?: { type: 'json' | 'text' }) => Promise<unknown>;
      set: (k: string, v: string) => Promise<void>;
    };
  } catch {
    return null;
  }
}

async function readLocal<T>(file: string, fallback: T): Promise<T> {
  try {
    const fs = await import('node:fs/promises');
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readLocalText(file: string): Promise<string | null> {
  try {
    const fs = await import('node:fs/promises');
    return await fs.readFile(file, 'utf8');
  } catch {
    return null;
  }
}

async function writeLocal(file: string, content: string): Promise<void> {
  const fs = await import('node:fs/promises');
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

export async function loadHistory(): Promise<Snapshot[]> {
  const store = await getBlobStore();
  if (store) {
    try {
      const data = (await store.get(HISTORY_KEY, { type: 'json' })) as Snapshot[] | null;
      if (Array.isArray(data)) return data;
    } catch {
      /* падаем на локальный режим */
    }
  }
  return readLocal<Snapshot[]>(LOCAL_FILE, []);
}

export async function saveHistory(history: Snapshot[]): Promise<void> {
  const payload = JSON.stringify(history);
  const store = await getBlobStore();
  if (store) {
    try {
      await store.set(HISTORY_KEY, payload);
      return;
    } catch {
      /* падаем на локальный режим */
    }
  }
  await writeLocal(LOCAL_FILE, payload);
}

export async function loadLastError(): Promise<string | undefined> {
  const store = await getBlobStore();
  if (store) {
    try {
      const txt = (await store.get(ERROR_KEY, { type: 'text' })) as string | null;
      return txt || undefined;
    } catch {
      /* ignore */
    }
  }
  const local = await readLocalText(LOCAL_ERR);
  return local || undefined;
}

export async function saveLastError(message: string): Promise<void> {
  const store = await getBlobStore();
  if (store) {
    try {
      await store.set(ERROR_KEY, message);
      return;
    } catch {
      /* ignore */
    }
  }
  await writeLocal(LOCAL_ERR, message);
}
