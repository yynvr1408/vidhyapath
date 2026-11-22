// Backend Text-to-Speech helpers for Telugu (te), Hindi (hi) and English (en).
// Audio is fetched as MP3 via the global fetch (Node 18+). No npm package is used.

export const SUPPORTED_TTS_LANGS = ['te', 'hi', 'en'] as const;
export type SupportedTtsLang = (typeof SUPPORTED_TTS_LANGS)[number];

export function isSupportedTtsLang(v: unknown): v is SupportedTtsLang {
  return typeof v === 'string' && (SUPPORTED_TTS_LANGS as readonly string[]).includes(v);
}

const TTS_TIMEOUT_MS = 15000;
const TTS_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * Removes markdown symbols, speaks basic math operators as words, and collapses
 * whitespace. Newlines are preserved (collapsed to single newlines) so that
 * chunkForSpeech can still use them as sentence boundaries.
 */
export function stripMarkdownForSpeech(text: string): string {
  let t = String(text ?? '').replace(/\r\n?/g, '\n');

  // Heading markers and quote markers at line start
  t = t.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');
  t = t.replace(/^[ \t]*>[ \t]?/gm, '');

  // Bold / emphasis markers, backticks, leftover asterisks
  t = t.replace(/\*\*(.+?)\*\*/g, '$1');
  t = t.replace(/__(.+?)__/g, '$1');
  t = t.replace(/`+/g, '');
  t = t.replace(/\*/g, '');

  // Math symbols spoken as words
  t = t.replace(/(\d)\s*[×x]\s*(?=\d)/g, '$1 times ');
  t = t.replace(/\s*÷\s*/g, ' divided by ');
  t = t.replace(/(\d)\s*−\s*(?=\d)/g, '$1 minus ');
  t = t.replace(/(\d)\s+-\s+(?=\d)/g, '$1 minus ');
  t = t.replace(/\+/g, ' plus ');
  t = t.replace(/=/g, ' equals ');

  // Collapse whitespace but keep line breaks
  t = t
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');
  t = t.replace(/\n{2,}/g, '\n').trim();

  return t;
}

/** Splits text into sentence-like units at . ! ? । ॥ and newlines. */
function splitSentences(text: string): string[] {
  const matches = text.match(/[^\n.!?।॥]+[.!?।॥]*|[.!?।॥]+/g) ?? [];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Splits an over-long sentence at word boundaries; hard-splits words longer than maxLen. */
function splitAtWords(sentence: string, maxLen: number): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const word of sentence.split(/\s+/).filter(Boolean)) {
    if (word.length > maxLen) {
      if (current) {
        pieces.push(current);
        current = '';
      }
      for (let i = 0; i < word.length; i += maxLen) {
        pieces.push(word.slice(i, i + maxLen));
      }
      continue;
    }
    if (current && current.length + 1 + word.length > maxLen) {
      pieces.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

/**
 * Splits text into chunks of at most maxLen characters, breaking at sentence
 * boundaries where possible and packing sentences together. Never returns empty chunks.
 */
export function chunkForSpeech(text: string, maxLen = 180): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const sentence of splitSentences(String(text ?? ''))) {
    const pieces = sentence.length <= maxLen ? [sentence] : splitAtWords(sentence, maxLen);
    for (const piece of pieces) {
      if (current && current.length + 1 + piece.length <= maxLen) {
        current = `${current} ${piece}`;
      } else {
        if (current) chunks.push(current);
        current = piece;
      }
    }
  }
  if (current) chunks.push(current);

  return chunks.filter((c) => c.trim().length > 0);
}

/** Small Map-based LRU cache. Map preserves insertion order; re-inserting marks an entry as recent. */
class LruCache<V> {
  private readonly map = new Map<string, V>();

  constructor(private readonly maxEntries: number) {}

  get(key: string): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key) as V;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }
}

const ttsCache = new LruCache<string[]>(200);

/** Fetches MP3 audio for a single chunk (<= ~200 chars) from Google Translate's TTS endpoint. */
export async function synthesizeChunkMp3(text: string, lang: 'te' | 'hi' | 'en'): Promise<Buffer> {
  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}` +
    `&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': TTS_USER_AGENT,
      Referer: 'https://translate.google.com/',
    },
    signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`TTS provider responded with HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Cleans, chunks and synthesizes text sequentially (to keep chunk order),
 * returning base64 MP3 strings. Full results are cached per language + text.
 */
export async function synthesizeToBase64Chunks(text: string, lang: 'te' | 'hi' | 'en'): Promise<string[]> {
  const cleaned = stripMarkdownForSpeech(text);
  const cacheKey = `${lang}|${cleaned}`;

  const cached = ttsCache.get(cacheKey);
  if (cached) return [...cached];

  const results: string[] = [];
  for (const chunk of chunkForSpeech(cleaned)) {
    const audio = await synthesizeChunkMp3(chunk, lang);
    results.push(audio.toString('base64'));
  }

  ttsCache.set(cacheKey, results);
  return [...results];
}
