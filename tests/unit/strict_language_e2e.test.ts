// Strict Unit & Backend End-to-End Language Enforcement Test Suite
// Verifies ONLY and STRICTLY three languages: Telugu (te), Hindi (hi), and English (en)
import { describe, it, expect, vi } from 'vitest';
import { TRANSLATIONS } from '../../src/utils/translations';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../../src/config/languages';
import {
  SpeechService,
  getSpeechLocale,
  getSpeechLangFromLocale,
  SPEECH_ERROR_MESSAGES,
} from '../../src/services/speech';
import { TutorService } from '../../src/services/tutor';
import { installFetchMock, loadPack, resetAppState } from '../helpers/harness';

describe('Strict Language Suite - Unit & Backend E2E', () => {
  // --------------------------------------------------------------------------
  // Test 1: Locale Key Parity & Strict Language Allowlist
  // --------------------------------------------------------------------------
  describe('Test 1: Locale Key Parity & Allowlist', () => {
    it('TRANSLATIONS strictly supports only te, hi, and en', () => {
      const keys = Object.keys(TRANSLATIONS).sort();
      expect(keys).toEqual(['en', 'hi', 'te']);
      expect(keys).not.toContain('ta');
      expect(keys).not.toContain('kn');
      expect(keys).not.toContain('fr');
      expect(keys).toHaveLength(3);
    });

    it('SUPPORTED_LANGUAGES contains exactly te, hi, and en', () => {
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code).sort();
      expect(codes).toEqual(['en', 'hi', 'te']);
      expect(codes).toHaveLength(3);
      expect(getLanguageByCode('te').code).toBe('te');
      expect(getLanguageByCode('hi').code).toBe('hi');
      expect(getLanguageByCode('en').code).toBe('en');
    });

    it('every key exists in all three dictionaries (te, hi, en) with 100% parity', () => {
      const teKeys = Object.keys(TRANSLATIONS.te).sort();
      const hiKeys = Object.keys(TRANSLATIONS.hi).sort();
      const enKeys = Object.keys(TRANSLATIONS.en).sort();

      expect(teKeys).toEqual(hiKeys);
      expect(teKeys).toEqual(enKeys);
      expect(hiKeys).toEqual(enKeys);
    });

    it('zero empty strings, empty arrays, or null/undefined values across te, hi, and en', () => {
      for (const lang of ['te', 'hi', 'en'] as const) {
        for (const [key, value] of Object.entries(TRANSLATIONS[lang])) {
          if (Array.isArray(value)) {
            expect(value.length).toBeGreaterThan(0);
            for (const item of value) {
              expect(typeof item).toBe('string');
              expect(item.trim().length).toBeGreaterThan(0);
            }
          } else {
            expect(typeof value).toBe('string');
            expect((value as string).trim().length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // Test 2: Speech Locale Mapping (TTS & STT)
  // --------------------------------------------------------------------------
  describe('Test 2: Speech Locale Mapping', () => {
    it('maps languages strictly to BCP-47 speech locales: te -> te-IN, hi -> hi-IN, en -> en-IN', () => {
      expect(getSpeechLocale('te')).toBe('te-IN');
      expect(getSpeechLocale('hi')).toBe('hi-IN');
      expect(getSpeechLocale('en')).toBe('en-IN');
      expect(getSpeechLocale('te-IN')).toBe('te-IN');
      expect(getSpeechLocale('hi-IN')).toBe('hi-IN');
      expect(getSpeechLocale('en-IN')).toBe('en-IN');
    });

    it('extracts language code accurately from speech locale', () => {
      expect(getSpeechLangFromLocale('te-IN')).toBe('te');
      expect(getSpeechLangFromLocale('hi-IN')).toBe('hi');
      expect(getSpeechLangFromLocale('en-IN')).toBe('en');
    });

    it('SpeechService.speak sets utterance.lang to the active locale', () => {
      class MockSpeechSynthesisUtterance {
        lang = '';
        text = '';
        rate = 1;
        pitch = 1;
        voice = null;
        onstart: any = null;
        onend: any = null;
        onerror: any = null;
        constructor(text: string) {
          this.text = text;
        }
      }
      (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

      const mockSynth = {
        speak: vi.fn(),
        cancel: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
      };
      (SpeechService as any).synth = mockSynth;

      for (const [lang, locale] of [['te', 'te-IN'], ['hi', 'hi-IN'], ['en', 'en-IN']] as const) {
        SpeechService.speak('Test math problem 123', locale);
        expect(mockSynth.speak).toHaveBeenCalled();
        const lastCallUtterance = mockSynth.speak.mock.calls[mockSynth.speak.mock.calls.length - 1][0];
        expect(lastCallUtterance.lang).toBe(locale);
      }

      delete (window as any).SpeechSynthesisUtterance;
    });

    it('SpeechService.startListening sets recognition.lang to the active locale', () => {
      let createdRecognition: any = null;
      class MockSpeechRecognition {
        lang = '';
        continuous = false;
        interimResults = false;
        maxAlternatives = 1;
        start = vi.fn();
        abort = vi.fn();
        constructor() {
          createdRecognition = this;
        }
      }

      (window as any).SpeechRecognition = MockSpeechRecognition;

      for (const [lang, locale] of [['te', 'te-IN'], ['hi', 'hi-IN'], ['en', 'en-IN']] as const) {
        SpeechService.startListening(locale, vi.fn(), vi.fn(), vi.fn());
        expect(createdRecognition).toBeDefined();
        expect(createdRecognition.lang).toBe(locale);
      }

      delete (window as any).SpeechRecognition;
    });

    it('SPEECH_ERROR_MESSAGES has complete localized error fallbacks for te, hi, en', () => {
      for (const lang of ['te', 'hi', 'en'] as const) {
        const msgs = SPEECH_ERROR_MESSAGES[lang];
        expect(msgs.unsupported.trim().length).toBeGreaterThan(0);
        expect(msgs.notAllowed.trim().length).toBeGreaterThan(0);
        expect(msgs.network.trim().length).toBeGreaterThan(0);
        expect(msgs.unknown.trim().length).toBeGreaterThan(0);
        expect(msgs.ttsUnsupported.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Test 3: AI Tutor Backend & Prompt Binding
  // --------------------------------------------------------------------------
  describe('Test 3: AI Tutor Backend & Prompt Binding', () => {
    it('TutorService.buildPrompt strictly enforces the pack language in system prompt', () => {
      const tePack = loadPack('te-10-maths-ap');
      const hiPack = loadPack('hi-10-maths-cbse');
      const enPack = loadPack('en-10-maths-cbse');

      // Telugu
      const tePrompt = TutorService.buildPrompt(tePack, 'యూక్లిడ్ న్యాయం ఏమిటి?');
      expect(tePrompt).toContain('Telugu (te)');
      expect(tePrompt).not.toContain('Hindi');
      expect(tePrompt).not.toContain('English');

      // Hindi
      const hiPrompt = TutorService.buildPrompt(hiPack, 'यूक्लिड प्रमेय क्या है?');
      expect(hiPrompt).toContain('Hindi (hi)');
      expect(hiPrompt).not.toContain('Telugu');
      expect(hiPrompt).not.toContain('English');

      // English
      const enPrompt = TutorService.buildPrompt(enPack, 'What is Euclid lemma?');
      expect(enPrompt).toContain('English (en)');
      expect(enPrompt).not.toContain('Telugu');
      expect(enPrompt).not.toContain('Hindi');
    });

    it('TutorService.askDoubt dispatches language code matching the pack to /api/tutor/ask', async () => {
      await resetAppState();
      const spy = installFetchMock();

      // Telugu doubt (unmatched string to trigger remote API call)
      const tePack = loadPack('te-10-maths-ap');
      await TutorService.askDoubt(tePack, 'learner_te', 'qwerty unique doubt query for telugu 9731', undefined, undefined, false, false, 'auto');
      const teCall = spy.mock.calls.find(([url]) => String(url).includes('/api/tutor/ask'));
      expect(teCall).toBeDefined();
      expect(JSON.parse(String(teCall![1]?.body)).language).toBe('te');

      // Hindi doubt (unmatched string to trigger remote API call)
      const hiPack = loadPack('hi-10-maths-cbse');
      await TutorService.askDoubt(hiPack, 'learner_hi', 'qwerty unique doubt query for hindi 9731', undefined, undefined, false, false, 'auto');
      const hiCalls = spy.mock.calls.filter(([url]) => String(url).includes('/api/tutor/ask'));
      const hiCall = hiCalls[hiCalls.length - 1];
      expect(JSON.parse(String(hiCall![1]?.body)).language).toBe('hi');

      // English doubt (unmatched string to trigger remote API call)
      const enPack = loadPack('en-10-maths-cbse');
      await TutorService.askDoubt(enPack, 'learner_en', 'qwerty unique doubt query for english 9731', undefined, undefined, false, false, 'auto');
      const enCalls = spy.mock.calls.filter(([url]) => String(url).includes('/api/tutor/ask'));
      const enCall = enCalls[enCalls.length - 1];
      expect(JSON.parse(String(enCall![1]?.body)).language).toBe('en');
    });

    it('offline pedagogical hints strictly match the requested pack language', async () => {
      const tePack = loadPack('te-10-maths-ap');
      const hiPack = loadPack('hi-10-maths-cbse');
      const enPack = loadPack('en-10-maths-cbse');

      // Unmatched to common doubts, forcing offline pedagogical hint generator
      const teRes = await TutorService.askDoubt(tePack, 'l_te', 'వర్గ సమీకరణం మూలాలు ఎలా కనుగొనాలి', undefined, undefined, true, false, 'manual_offline');
      expect(teRes.source).toBe('offline_pedagogy');
      expect(teRes.answer).toContain('ఈ ప్రశ్నకు సంబంధించి:');

      const hiRes = await TutorService.askDoubt(hiPack, 'l_hi', 'चर की उच्चतम घात क्या कहलाती है', undefined, undefined, true, false, 'manual_offline');
      expect(hiRes.source).toBe('offline_pedagogy');
      expect(hiRes.answer).toContain('संकेत 1:');

      const enRes = await TutorService.askDoubt(enPack, 'l_en', 'degree of polynomial quadratic zeroes', undefined, undefined, true, false, 'manual_offline');
      expect(enRes.source).toBe('offline_pedagogy');
      expect(enRes.answer).toContain('Hint 1:');
    });
  });
});
