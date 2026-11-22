// Shared test harness. Renders the REAL AppProvider (src/context/AppContext.tsx)
// and the REAL IndexedDB layer (src/db/indexedDb.ts, backed by fake-indexeddb).
// Only the network boundary is replaced: fetch('/packs/*.json') is served from
// public/packs on disk, and other URLs return 404.
import React, { useEffect, useState } from 'react';
import { vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { AppProvider, useApp } from '../../src/context/AppContext';
import { localDb } from '../../src/db/indexedDb';
import type { ContentPack, LearnerProfile } from '../../src/types';

export const PACK_DIR = path.resolve(process.cwd(), 'public', 'packs');

export type AppCtx = ReturnType<typeof useApp>;
export interface Captured {
  ctx: AppCtx | null;
}

function Bridge({
  captured,
  learner,
  children,
}: {
  captured?: Captured;
  learner?: LearnerProfile;
  children: React.ReactNode;
}) {
  const ctx = useApp();
  if (captured) captured.ctx = ctx;
  const [ready, setReady] = useState(!learner);

  useEffect(() => {
    if (learner) {
      ctx.selectLearner(learner);
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learner?.id]);

  return ready ? <>{children}</> : null;
}

/** Real AppProvider + optional pre-selected learner (via the real selectLearner action). */
export function AppTestRoot({
  children,
  captured,
  learner,
}: {
  children: React.ReactNode;
  captured?: Captured;
  learner?: LearnerProfile;
}) {
  return (
    <AppProvider>
      <Bridge captured={captured} learner={learner}>
        {children}
      </Bridge>
    </AppProvider>
  );
}

export function loadPack(packId: string): ContentPack {
  return JSON.parse(fs.readFileSync(`${PACK_DIR}/${packId}.json`, 'utf8')) as ContentPack;
}

const nativeFetch = globalThis.fetch;

/** Serves /packs/<id>.json from disk; forwards local test servers; any other URL gets a 404. */
export function installFetchMock() {
  const spy = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith('http://127.0.0.1:') || url.startsWith('http://localhost:')) {
      try {
        return await nativeFetch(input, _init);
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'connection failed' }), { status: 502 });
      }
    }
    const m = url.match(/\/packs\/([^/?]+)\.json$/);
    if (m) {
      const body = fs.readFileSync(`${PACK_DIR}/${m[1]}.json`, 'utf8');
      return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'not mocked' }), { status: 404 });
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

/** Clears localStorage and every IndexedDB object store (db connection is reused). */
export async function resetAppState() {
  localStorage.clear();
  localStorage.setItem('vidyapath_language_pack', 'en-10-maths-cbse');
  const db = await localDb.getDb();
  const names = Array.from(db.objectStoreNames);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(names, 'readwrite');
    for (const n of names) tx.objectStore(n).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Reads every record from every IndexedDB store. */
export async function dumpAllStores(): Promise<Record<string, unknown[]>> {
  const db = await localDb.getDb();
  const out: Record<string, unknown[]> = {};
  for (const name of Array.from(db.objectStoreNames)) {
    out[name] = await new Promise<unknown[]>((resolve, reject) => {
      const req = db.transaction(name, 'readonly').objectStore(name).getAll();
      req.onsuccess = () => resolve(req.result as unknown[]);
      req.onerror = () => reject(req.error);
    });
  }
  return out;
}

export function makeLearner(
  over: Partial<LearnerProfile> & { id: string; nickname: string; loginCode: string; pin: string }
): LearnerProfile {
  return {
    avatarType: 'icon',
    avatarColor: '#0F766E',
    avatarEmoji: '👦',
    classGrade: 10,
    packId: 'en-10-maths-cbse',
    pinHash: over.pin,
    createdAt: Date.now(),
    ...over,
  };
}
