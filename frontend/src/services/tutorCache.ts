// Local Client-Side Semantic Cache for Socratic AI Tutor
export interface CachedAiResponse {
  answer: string;
  flagged?: boolean;
  isSocraticNudge?: boolean;
  cachedAt: number;
}

const memoryCache = new Map<string, CachedAiResponse>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class TutorLocalCache {
  private static normalizeKey(query: string, subjectId?: string): string {
    const cleanQuery = query
      .toLowerCase()
      .trim()
      .replace(/[?!.,;:]/g, '')
      .replace(/\s+/g, ' ');
    return `${subjectId || 'general'}_${cleanQuery}`;
  }

  static get(query: string, subjectId?: string): CachedAiResponse | null {
    const key = this.normalizeKey(query, subjectId);

    // 1. Check memory cache
    const mem = memoryCache.get(key);
    if (mem && Date.now() - mem.cachedAt < CACHE_TTL_MS) {
      return mem;
    }

    // 2. Check localStorage
    try {
      const raw = localStorage.getItem(`ai_cache_${key}`);
      if (raw) {
        const parsed: CachedAiResponse = JSON.parse(raw);
        if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
          memoryCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    return null;
  }

  static set(query: string, response: Omit<CachedAiResponse, 'cachedAt'>, subjectId?: string) {
    const key = this.normalizeKey(query, subjectId);
    const entry: CachedAiResponse = {
      ...response,
      cachedAt: Date.now(),
    };

    memoryCache.set(key, entry);

    try {
      localStorage.setItem(`ai_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Storage quota safety
    }
  }

  static clear() {
    memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith('ai_cache_')) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // Ignore
    }
  }
}
