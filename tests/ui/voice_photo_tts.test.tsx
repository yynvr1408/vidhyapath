// Test 6: voice, photo and Listen controls must show a visible fallback (or at least not crash)
// when browser support is missing. jsdom has no SpeechRecognition and no speechSynthesis.
// Real: VoiceInputButton, AudioButton, AiTutorScreen (photo input).
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceInputButton } from '../../frontend/src/components/VoiceInputButton';
import { AudioButton } from '../../frontend/src/components/AudioButton';
import { AiTutorScreen } from '../../frontend/src/screens/AiTutorScreen';
import { SpeechService } from '../../frontend/src/services/speech';
import { getTranslations } from '../../frontend/src/utils/translations';
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
});

