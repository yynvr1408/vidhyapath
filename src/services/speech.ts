export interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

export type SupportedSpeechLang = 'te' | 'hi' | 'en';

export function getSpeechLocale(lang?: string): string {
  if (!lang) return 'te-IN';
  if (lang.startsWith('hi') || lang === 'hi') return 'hi-IN';
  if (lang.startsWith('en') || lang === 'en') return 'en-IN';
  if (lang.startsWith('te') || lang === 'te') return 'te-IN';
  return 'te-IN';
}

export function getSpeechLangFromLocale(locale?: string): SupportedSpeechLang {
  if (!locale) return 'te';
  if (locale.startsWith('hi')) return 'hi';
  if (locale.startsWith('en')) return 'en';
  return 'te';
}

export const SPEECH_ERROR_MESSAGES: Record<SupportedSpeechLang, {
  unsupported: string;
  notAllowed: string;
  network: string;
  unknown: string;
  initError: string;
  ttsUnsupported: string;
}> = {
  te: {
    unsupported: 'వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి టైప్ చేయండి లేదా ఆప్షన్ ఎంచుకోండి.',
    notAllowed: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బటన్ల ద్వారా ఎంచుకోండి.',
    network: 'నెట్‌వర్క్ అందుబాటులో లేదు. ఆఫ్‌లైన్‌లో వాయిస్ పనిచేయదు.',
    unknown: 'వాయిస్ గుర్తించలేకపోయాము. దయచేసి మళ్ళీ చెప్పండి లేదా ట్యాప్ చేయండి.',
    initError: 'వాయిస్ ప్రారంభించడంలో సమస్య',
    ttsUnsupported: 'ఆడియో అందుబాటులో లేదు',
  },
  hi: {
    unsupported: 'वॉइस पहचान उपलब्ध नहीं है। कृपया टाइप करें या विकल्प चुनें।',
    notAllowed: 'माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया बटन से चुनें।',
    network: 'नेटवर्क उपलब्ध नहीं है। ऑफलाइन में वॉइस काम नहीं करता।',
    unknown: 'आवाज़ पहचानी नहीं जा सकी। कृपया पुनः बोलें या टैप करें।',
    initError: 'वॉइस शुरू करने में समस्या',
    ttsUnsupported: 'ऑडियो उपलब्ध नहीं है',
  },
  en: {
    unsupported: 'Voice recognition is not supported. Please type or select an option.',
    notAllowed: 'Microphone permission denied. Please select with buttons.',
    network: 'Network unavailable. Voice recognition requires internet.',
    unknown: 'Could not recognize voice. Please speak again or tap.',
    initError: 'Error starting voice recognition',
    ttsUnsupported: 'Audio unavailable',
  },
};

export interface SpeechState {
  isLoading: boolean;
  isSpeaking: boolean;
}

export type SpeechStateListener = (s: SpeechState) => void;

const TTS_CHUNK_MAX_CHARS = 180;
const TTS_VOICE_WAIT_MS = 2000;

// Math symbol readouts per language (applied before speaking)
const MATH_SPEECH: Record<SupportedSpeechLang, Array<[string, string]>> = {
  te: [
    ['∪', ' సమ్మేళనం '],
    ['∩', ' ఛేదనం '],
    ['∅', ' శూన్య సమితి '],
    ['≤', ' తక్కువ లేదా సమానం '],
    ['≥', ' ఎక్కువ లేదా సమానం '],
    ['≠', ' సమానం కాదు '],
    ['⊂', ' ఉపసమితి '],
  ],
  hi: [
    ['∪', ' संघ '],
    ['∩', ' सर्वनिष्ठ '],
    ['∅', ' रिक्त समुच्चय '],
    ['≤', ' छोटा या बराबर '],
    ['≥', ' बड़ा या बराबर '],
    ['≠', ' बराबर नहीं '],
    ['⊂', ' उपसमुच्चय '],
  ],
  en: [
    ['∪', ' union '],
    ['∩', ' intersection '],
    ['∅', ' empty set '],
    ['≤', ' less than or equal to '],
    ['≥', ' greater than or equal to '],
    ['≠', ' not equal to '],
    ['⊂', ' subset of '],
  ],
};

/**
 * Strips markdown and converts operators to words before speech.
 * Mirrors the backend helper in server/tts.ts (not imported from server/).
 */
function cleanTextForSpeech(text: string, lang: SupportedSpeechLang): string {
  let out = text
    .replace(/\*\*|__/g, '')
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, '')
    .replace(/[*`]/g, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/\+/g, ' plus ')
    .replace(/=/g, ' equals ')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/[[\]()]/g, '')
    .replace(/\$/g, '');

  for (const [symbol, word] of MATH_SPEECH[lang]) {
    out = out.split(symbol).join(word);
  }

  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Splits text into sentence-based chunks of at most maxChars characters.
 * Sentences longer than maxChars are split on word boundaries.
 */
function splitIntoChunks(text: string, maxChars: number): string[] {
  const sentences = text.match(/[^.!?।\n]+[.!?।]*/g) ?? [];
  const chunks: string[] = [];
  let current = '';

  const append = (piece: string) => {
    if (!current) {
      current = piece;
      return;
    }
    if (current.length + 1 + piece.length <= maxChars) {
      current = `${current} ${piece}`;
      return;
    }
    chunks.push(current);
    current = piece;
  };

  for (const raw of sentences) {
    let rest = raw.trim();
    while (rest.length > maxChars) {
      let cut = rest.lastIndexOf(' ', maxChars);
      if (cut <= 0) cut = maxChars;
      append(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) append(rest);
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * Picks a device voice for the language. en prefers en-IN, then any en voice.
 */
function pickVoice(voices: SpeechSynthesisVoice[], lang: SupportedSpeechLang): SpeechSynthesisVoice | null {
  const langOf = (v: SpeechSynthesisVoice) => (v.lang || '').toLowerCase();
  if (lang === 'en') {
    return voices.find((v) => langOf(v) === 'en-in') ?? voices.find((v) => langOf(v).startsWith('en')) ?? null;
  }
  return voices.find((v) => langOf(v).startsWith(lang)) ?? null;
}

export class SpeechService {
  private static recognitionInstance: any = null;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static audio: HTMLAudioElement | null = null;
  private static requestId = 0;
  private static loadingState = false;
  private static speakingState = false;
  private static listeners = new Set<SpeechStateListener>();

  /**
   * Check if Speech Synthesis is supported
   */
  public static isTtsSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Check if Speech Recognition is supported
   */
  public static isSttSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /** True while audio is being fetched or prepared */
  public static get isLoading(): boolean {
    return this.loadingState;
  }

  /** True while audio is playing */
  public static get isSpeaking(): boolean {
    return this.speakingState;
  }

  /**
   * Subscribe to TTS state changes. Returns an unsubscribe function.
   */
  public static subscribe(listener: SpeechStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Reads text aloud: cloud audio from /api/tts when online, device voice otherwise or on failure
   */
  public static speak(
    text: string,
    locale: string = 'te-IN',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    const lang = getSpeechLangFromLocale(locale);
    const msgs = SPEECH_ERROR_MESSAGES[lang];
    const token = this.halt();

    const cleanText = cleanTextForSpeech(text, lang);
    if (!cleanText) {
      this.setState(false, false);
      if (onEnd) onEnd();
      return;
    }

    this.setState(true, false);

    const fallbackToDevice = () => {
      void this.speakWithDevice(cleanText, lang, locale, token, onStart, onEnd, onError);
    };

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      fallbackToDevice();
      return;
    }

    void this.fetchCloudAudio(cleanText, lang).then((result) => {
      if (token !== this.requestId) return;
      if (!result) {
        fallbackToDevice();
        return;
      }
      this.playCloudAudio(result.chunks, result.mimeType, token, {
        onStart,
        onEnd,
        onFallback: fallbackToDevice,
        onFailure: () => {
          if (onError) onError(msgs.ttsUnsupported);
        },
      });
    });
  }

  /**
   * Stops any ongoing speech output (cloud audio and device voice)
   */
  public static stopSpeaking(): void {
    this.halt();
    this.setState(false, false);
  }

  /**
   * Alias of stopSpeaking()
   */
  public static stop(): void {
    this.stopSpeaking();
  }

  /**
   * Invalidates in-flight requests and stops any playback. Returns the new request token.
   */
  private static halt(): number {
    this.requestId += 1;
    if (this.audio) {
      this.releaseAudio(this.audio);
      this.audio = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.currentUtterance = null;
    return this.requestId;
  }

  private static setState(isLoading: boolean, isSpeaking: boolean): void {
    if (this.loadingState === isLoading && this.speakingState === isSpeaking) return;
    this.loadingState = isLoading;
    this.speakingState = isSpeaking;
    const snapshot: SpeechState = { isLoading, isSpeaking };
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (e) {
        console.warn('Speech state listener error:', e);
      }
    });
  }

  private static releaseAudio(audio: HTMLAudioElement): void {
    audio.onended = null;
    audio.onerror = null;
    audio.onplaying = null;
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    } catch (e) {
      // ignore
    }
  }

  private static async fetchCloudAudio(
    text: string,
    lang: SupportedSpeechLang
  ): Promise<{ chunks: string[]; mimeType: string } | null> {
    if (typeof fetch !== 'function') return null;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const chunks: string[] = Array.isArray(data?.chunks)
        ? data.chunks.filter((c: unknown): c is string => typeof c === 'string' && c.length > 0)
        : [];
      if (chunks.length === 0) return null;
      return {
        chunks,
        mimeType: typeof data.mimeType === 'string' ? data.mimeType : 'audio/mpeg',
      };
    } catch (e) {
      console.warn('Cloud TTS unavailable, using device voice:', e);
      return null;
    }
  }

  private static playCloudAudio(
    chunks: string[],
    mimeType: string,
    token: number,
    handlers: {
      onStart?: () => void;
      onEnd?: () => void;
      onFallback: () => void;
      onFailure: () => void;
    }
  ): void {
    const audio = new Audio();
    this.audio = audio;
    let index = 0;
    let started = false;

    const handleError = () => {
      if (token !== this.requestId) return;
      this.releaseAudio(audio);
      this.audio = null;
      if (!started) {
        handlers.onFallback();
      } else {
        this.setState(false, false);
        handlers.onFailure();
      }
    };

    const playNext = () => {
      if (token !== this.requestId) return;
      if (index >= chunks.length) {
        this.releaseAudio(audio);
        this.audio = null;
        this.setState(false, false);
        if (handlers.onEnd) handlers.onEnd();
        return;
      }
      audio.src = `data:${mimeType};base64,${chunks[index]}`;
      index += 1;
      audio.play().catch(() => handleError());
    };

    audio.onplaying = () => {
      if (token !== this.requestId || started) return;
      started = true;
      this.setState(false, true);
      if (handlers.onStart) handlers.onStart();
    };
    audio.onended = () => playNext();
    audio.onerror = () => handleError();

    playNext();
  }

  private static waitForVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
    const current = synth.getVoices();
    if (current.length > 0) return Promise.resolve(current);
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const done = () => {
        if (timer !== undefined) clearTimeout(timer);
        synth.removeEventListener('voiceschanged', done);
        resolve(synth.getVoices());
      };
      timer = setTimeout(done, TTS_VOICE_WAIT_MS);
      synth.addEventListener('voiceschanged', done);
    });
  }

  private static async speakWithDevice(
    text: string,
    lang: SupportedSpeechLang,
    locale: string,
    token: number,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    const msgs = SPEECH_ERROR_MESSAGES[lang];
    const synth = this.synth;
    const fail = () => {
      if (token !== this.requestId) return;
      this.setState(false, false);
      if (onError) onError(msgs.ttsUnsupported);
    };

    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      fail();
      return;
    }

    this.setState(true, false);
    try {
      const voices = await this.waitForVoices(synth);
      if (token !== this.requestId) return;

      const voice = pickVoice(voices, lang);
      if (!voice) {
        fail();
        return;
      }

      const chunks = splitIntoChunks(text, TTS_CHUNK_MAX_CHARS);
      let index = 0;
      let started = false;

      const speakNext = () => {
        if (token !== this.requestId) return;
        if (index >= chunks.length) {
          this.currentUtterance = null;
          this.setState(false, false);
          if (onEnd) onEnd();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        index += 1;
        utterance.lang = voice.lang || locale;
        utterance.voice = voice;
        utterance.rate = 0.95; // slightly slower for clear comprehension
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          if (token !== this.requestId) return;
          this.setState(false, true);
          if (!started) {
            started = true;
            if (onStart) onStart();
          }
        };

        utterance.onend = () => {
          if (token !== this.requestId) return;
          speakNext();
        };

        utterance.onerror = () => {
          if (token !== this.requestId) return;
          this.currentUtterance = null;
          this.setState(false, false);
          if (onError) onError(msgs.ttsUnsupported);
        };

        this.currentUtterance = utterance;
        synth.speak(utterance);
      };

      speakNext();
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      fail();
    }
  }


  /**
   * Listens for user voice input using Web Speech API
   */
  public static startListening(
    locale: string = 'te-IN',
    onResult: (transcript: string) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void,
    onInterim?: (interimText: string) => void
  ): () => void {
    const lang = getSpeechLangFromLocale(locale);
    const msgs = SPEECH_ERROR_MESSAGES[lang];

    if (!this.isSttSupported()) {
      onError(msgs.unsupported);
      onEnd();
      return () => {};
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      this.recognitionInstance = recognition;

      recognition.lang = locale;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event: any) => {
        if (!event.results || event.results.length === 0) return;
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal === false) {
            interim += res[0]?.transcript || '';
          } else {
            final += res[0]?.transcript || '';
          }
        }
        if (interim && onInterim) {
          onInterim(interim);
        }
        if (final) {
          onResult(final);
        } else if (!interim && event.results[0] && event.results[0][0]) {
          onResult(event.results[0][0].transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          onError(msgs.notAllowed);
        } else if (event.error === 'network') {
          onError(msgs.network);
        } else {
          onError(msgs.unknown);
        }
      };

      recognition.onend = () => {
        this.recognitionInstance = null;
        onEnd();
      };

      recognition.start();

      return () => {
        try {
          recognition.abort();
        } catch (e) {}
      };
    } catch (err: any) {
      onError(err?.message || msgs.initError);
      onEnd();
      return () => {};
    }
  }
}
