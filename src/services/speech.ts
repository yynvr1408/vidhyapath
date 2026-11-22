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

export class SpeechService {
  private static recognitionInstance: any = null;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

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

  /**
   * Reads text aloud using on-device SpeechSynthesis
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

    if (!this.synth) {
      if (onError) onError(msgs.ttsUnsupported);
      return;
    }

    try {
      this.stopSpeaking();

      // Clean markdown or bracket symbols before speech
      let cleanText = text
        .replace(/[*_#`[\]()]/g, '')
        .replace(/\$/g, '');

      if (locale.startsWith('te')) {
        cleanText = cleanText
          .replace(/∪/g, ' సమ్మేళనం ')
          .replace(/∩/g, ' ఛేదనం ')
          .replace(/∅/g, ' శూన్య సమితి ')
          .replace(/≤/g, ' తక్కువ లేదా సమానం ')
          .replace(/≥/g, ' ఎక్కువ లేదా సమానం ')
          .replace(/≠/g, ' సమానం కాదు ')
          .replace(/⊂/g, ' ఉపసమితి ');
      } else if (locale.startsWith('hi')) {
        cleanText = cleanText
          .replace(/∪/g, ' संघ ')
          .replace(/∩/g, ' सर्वनिष्ठ ')
          .replace(/∅/g, ' रिक्त समुच्चय ')
          .replace(/≤/g, ' छोटा या बराबर ')
          .replace(/≥/g, ' बड़ा या बराबर ')
          .replace(/≠/g, ' बराबर नहीं ')
          .replace(/⊂/g, ' उपसमुच्चय ');
      } else {
        cleanText = cleanText
          .replace(/∪/g, ' union ')
          .replace(/∩/g, ' intersection ')
          .replace(/∅/g, ' empty set ')
          .replace(/≤/g, ' less than or equal to ')
          .replace(/≥/g, ' greater than or equal to ')
          .replace(/≠/g, ' not equal to ')
          .replace(/⊂/g, ' subset of ');
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = locale;
      utterance.rate = 0.95; // slightly slower for clear comprehension
      utterance.pitch = 1.0;

      // Try to find a matching voice for the locale
      const voices = this.synth.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.toLowerCase() === locale.toLowerCase() || v.lang.toLowerCase().startsWith(locale.split('-')[0])
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        if (onError) onError(e);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (onError) onError(e);
    }
  }

  /**
   * Stops any ongoing speech output
   */
  public static stopSpeaking(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.currentUtterance = null;
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
