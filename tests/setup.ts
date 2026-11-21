// Global test setup for Vitest (jsdom).
// jest-dom is imported from its vitest entry so its matchers extend Vitest's expect
// (the bare entry expects a global `expect`, which this config does not provide).
import '@testing-library/jest-dom/vitest';
// In-memory IndexedDB so LocalDatabase (src/db/indexedDb.ts) works under jsdom.
import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
