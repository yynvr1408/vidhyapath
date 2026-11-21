export interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

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
    if (!this.synth) {
      if (onError) onError('Speech synthesis not supported');
      return;
    }

    try {
      this.stopSpeaking();

      // Clean markdown or bracket symbols before speech
      let cleanText = text
        .replace(/[*_#`[\]()]/g, '')
        .replace(/\$/g, '');

      if (locale.startsWith('en')) {
        cleanText = cleanText
          .replace(/∪/g, ' union ')
          .replace(/∩/g, ' intersection ')
          .replace(/∅/g, ' null set ')
          .replace(/≤/g, ' less than or equal to ')
          .replace(/≥/g, ' greater than or equal to ')
          .replace(/≠/g, ' not equal to ')
          .replace(/⊂/g, ' subset of ');
      } else if (locale.startsWith('hi')) {
        cleanText = cleanText
          .replace(/∪/g, ' सम्मिलन ')
          .replace(/∩/g, ' सर्वनिष्ठ ')
          .replace(/∅/g, ' रिक्त समुच्चय ')
          .replace(/≤/g, ' से छोटा या बराबर ')
          .replace(/≥/g, ' से बड़ा या बराबर ')
          .replace(/≠/g, ' बराबर नहीं ')
          .replace(/⊂/g, ' उपसमुच्चय ');
      } else {
        // Telugu
        cleanText = cleanText
          .replace(/∪/g, ' సమ్మేళనం ')
          .replace(/∩/g, ' ఛేదనం ')
          .replace(/∅/g, ' శూన్య సమితి ')
          .replace(/≤/g, ' తక్కువ లేదా సమానం ')
          .replace(/≥/g, ' ఎక్కువ లేదా సమానం ')
          .replace(/≠/g, ' సమానం కాదు ')
          .replace(/⊂/g, ' ఉపసమితి ');
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
    onEnd: () => void
  ): () => void {
    if (!this.isSttSupported()) {
      onError('వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి టైప్ చేయండి లేదా ఆప్షన్ ఎంచుకోండి.');
      onEnd();
      return () => {};
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      this.recognitionInstance = recognition;

      recognition.lang = locale;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const topResult = event.results[0][0].transcript;
          onResult(topResult);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          onError('మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బటన్ల ద్వారా ఎంచుకోండి.');
        } else if (event.error === 'network') {
          onError('నెట్‌వర్క్ అందుబాటులో లేదు. ఆఫ్‌లైన్‌లో వాయిస్ పనిచేయదు.');
        } else {
          onError('వాయిస్ గుర్తించలేకపోయాము. దయచేసి మళ్ళీ చెప్పండి లేదా ట్యాప్ చేయండి.');
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
      onError(err?.message || 'వాయిస్ ప్రారంభించడంలో సమస్య');
      onEnd();
      return () => {};
    }
  }
}
