// Test 4: offline practice persists across unmount/remount and the offline indicator shows.
// Real: AppShell (header "offline" pill), PracticeWeakTopicsScreen, PracticeEngine, localDb.
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '../../src/components/AppShell';
import { PracticeWeakTopicsScreen } from '../../src/screens/PracticeWeakTopicsScreen';
import { localDb } from '../../src/db/indexedDb';
import { getTranslations } from '../../src/utils/translations';
import { AppTestRoot, Captured, installFetchMock, loadPack, makeLearner, resetAppState } from '../helpers/harness';
import { answerCurrentQuestion } from '../helpers/practice';

const en = getTranslations('en');
const originalOnLine = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });
}

afterEach(() => {
  if (originalOnLine) Object.defineProperty(window.navigator, 'onLine', originalOnLine);
});

describe('offline persistence', () => {
  it('answers submitted offline survive remount and the Saved Offline indicator shows', async () => {
    await resetAppState();
    installFetchMock();
    setOnline(false);
    const pack = loadPack('en-10-maths-cbse');
    const learner = makeLearner({ id: 'learner_offline', nickname: 'Meera', loginCode: 'MEER-10', pin: '1111' });
    const user = userEvent.setup();

    const first: Captured = { ctx: null };
    const r1 = render(
      <AppTestRoot captured={first} learner={learner}>
        <AppShell>
          <PracticeWeakTopicsScreen />
        </AppShell>
      </AppTestRoot>
    );
    expect(await screen.findByText(en.offlineSaved)).toBeInTheDocument();
    expect(first.ctx!.isOffline).toBe(true);

    await answerCurrentQuestion(user, r1.container, pack, 'correct');
    await answerCurrentQuestion(user, r1.container, pack, 'wrong');
    r1.unmount();

    // Remount with a fresh provider: state must come back from IndexedDB, not memory.
    const second: Captured = { ctx: null };
    render(
      <AppTestRoot captured={second} learner={learner}>
        <AppShell>
          <PracticeWeakTopicsScreen />
        </AppShell>
      </AppTestRoot>
    );

    expect(await screen.findByText(en.offlineSaved)).toBeInTheDocument();
    await waitFor(async () => {
      expect(await localDb.getAttemptsByLearner('learner_offline')).toHaveLength(2);
    });
    await waitFor(() => expect(second.ctx!.skillStates.size).toBeGreaterThan(0));
    await act(async () => {});
  });
});
