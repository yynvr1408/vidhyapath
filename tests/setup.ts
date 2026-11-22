// Test-only network boundary for backend unit tests. Never contact external services.
import { afterEach, beforeEach, vi } from 'vitest';
const nativeFetch = globalThis.fetch;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith('https://api.emailjs.com/')) {
      return new Response(JSON.stringify({ status: 200, text: 'test-only delivery stub' }), { status: 200 });
    }
    if (url.startsWith('http://127.0.0.1:') || url.startsWith('http://localhost:')) {
      try {
        return await nativeFetch(input, init);
      } catch (error) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'connection failed' }), { status: 502 });
      }
    }
    return new Response(JSON.stringify({ error: 'not mocked' }), { status: 404 });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
