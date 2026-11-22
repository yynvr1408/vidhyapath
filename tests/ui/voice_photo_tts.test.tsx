// Test 6: voice, photo and Listen controls must show a visible fallback (or at least not crash)
// when browser support is missing. jsdom has no SpeechRecognition and no speechSynthesis.
// Real: VoiceInputButton, AudioButton, AiTutorScreen (photo input).
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceInputButton } from '../../src/components/VoiceInputButton';
import { AudioButton } from '../../src/components/AudioButton';
import { AiTutorScreen } from '../../src/screens/AiTutorScreen';
import { SpeechService, SPEECH_ERROR_MESSAGES } from '../../src/services/speech';
import { getTranslations } from '../../src/utils/translations';
import { AppTestRoot, installFetchMock, makeLearner, resetAppState } from '../helpers/harness';

const en = getTranslations('en');

const learner = makeLearner({ id: 'learner_voice', nickname: 'Ira', loginCode: 'IRA-10', pin: '4444' });

describe('voice, photo and TTS fallbacks', () => {
  it('mic shows a visible fallback when speech recognition is unsupported', async () => {
    await resetAppState();
    installFetchMock();
    expect(SpeechService.isSttSupported()).toBe(false); // jsdom precondition

    render(
      <AppTestRoot>
        <VoiceInputButton onTranscript={vi.fn()} size="md" label="Voice Answer" />
      </AppTestRoot>
    );
    expect(await screen.findByText(/not supported|అందుబాటులో లేదు|उपलब्ध नहीं/i)).toBeInTheDocument();
  });

  it('Listen control shows a visible fallback when speech synthesis is unsupported', async () => {
    expect(SpeechService.isTtsSupported()).toBe(false); // jsdom precondition
    const user = userEvent.setup();
    render(<AudioButton text="Sample question" label="Listen" />);

    await user.click(screen.getByRole('button', { name: /Listen/ }));

    // Expected to FAIL today: AudioButton -> SpeechService.speak calls onError silently.
    expect(await screen.findByText(/not supported|unavailable|అందుబాటులో లేదు/i)).toBeInTheDocument();
  });

  it('photo control renders and accepts an upload without crashing', async () => {
    await resetAppState();
    installFetchMock();
    const user = userEvent.setup();
    const { container } = render(
      <AppTestRoot learner={learner}>
        <AiTutorScreen />
      </AppTestRoot>
    );

    const photoInput = await waitFor(() => {
      const el = container.querySelector<HTMLInputElement>('input[type="file"]');
      if (!el) throw new Error('photo input not rendered yet');
      return el;
    });
    expect(screen.getByTitle('Notebook / Blackboard Photo')).toBeInTheDocument();
    await user.upload(photoInput, new File(['img'], 'page.png', { type: 'image/png' }));
    // Still on the tutor screen after the upload attempt.
    expect(screen.getByPlaceholderText(en.typeDoubtPlaceholder)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Cloud TTS via POST /api/tts (SpeechService.speak). Fetch and Audio are mocked.
  // --------------------------------------------------------------------------
  describe('cloud TTS via /api/tts', () => {
    const originalSynth = (SpeechService as any).synth;
    let audioInstances: any[] = [];

    beforeEach(() => {
      audioInstances = [];
      class MockAudio {
        src = '';
        onplaying: any = null;
        onended: any = null;
        onerror: any = null;
        play = vi.fn(() => Promise.resolve());
        pause = vi.fn();
        load = vi.fn();
        removeAttribute = vi.fn();
        constructor() {
          audioInstances.push(this);
        }
      }
      vi.stubGlobal('Audio', MockAudio);
    });

    afterEach(() => {
      SpeechService.stop();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      delete (window as any).speechSynthesis;
      delete (window as any).SpeechSynthesisUtterance;
      (SpeechService as any).synth = originalSynth;
    });

    function mockTtsFetch() {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => ({ chunks: ['AAAA'], mimeType: 'audio/mpeg' }),
      }));
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    }

    it.each([
      ['hi-IN', 'hi', '**नमस्ते**'],
      ['te-IN', 'te', '**నమస్కారం**'],
      ['en-IN', 'en', '**Hello**'],
    ])('speak with locale %s posts language "%s" to /api/tts and plays a data:audio/mpeg URL', async (locale, lang, text) => {
      const fetchMock = mockTtsFetch();

      SpeechService.speak(text, locale);

      await waitFor(() => expect(audioInstances.length).toBe(1));
      await waitFor(() => expect(audioInstances[0].src).toMatch(/^data:audio\/mpeg;base64,/));
      expect(audioInstances[0].play).toHaveBeenCalled();

      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(String(url)).toContain('/api/tts');
      expect(JSON.parse(String(init.body)).language).toBe(lang);
    });

    it('a second speak pauses the first Audio element and calls speechSynthesis.cancel()', async () => {
      mockTtsFetch();
      const synth = {
        speak: vi.fn(),
        cancel: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
      };
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
      (SpeechService as any).synth = synth;

      SpeechService.speak('First sentence', 'en-IN');
      await waitFor(() => expect(audioInstances.length).toBe(1));
      const first = audioInstances[0];
      synth.cancel.mockClear();

      SpeechService.speak('Second sentence', 'en-IN');

      expect(first.pause).toHaveBeenCalled();
      expect(synth.cancel).toHaveBeenCalled();
    });

    it('speak calls onError with a localized message and does not throw when fetch rejects and speechSynthesis is missing', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
      delete (window as any).speechSynthesis;
      delete (window as any).SpeechSynthesisUtterance;
      (SpeechService as any).synth = undefined;
      const onError = vi.fn();

      expect(() => SpeechService.speak('नमस्ते', 'hi-IN', undefined, undefined, onError)).not.toThrow();

      await waitFor(() => expect(onError).toHaveBeenCalled());
      const msg = onError.mock.calls[0][0];
      expect(typeof msg).toBe('string');
      expect(msg.trim().length).toBeGreaterThan(0);
      expect(msg).toBe(SPEECH_ERROR_MESSAGES.hi.ttsUnsupported);
    });

    it('strips markdown from the text sent to /api/tts', async () => {
      const fetchMock = mockTtsFetch();

      SpeechService.speak('**Bold** answer: 2 + 2 = 4', 'en-IN');

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const body = String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body);
      expect(body).not.toContain('**');
      expect(JSON.parse(body).text).toContain('Bold');
    });
  });

});

