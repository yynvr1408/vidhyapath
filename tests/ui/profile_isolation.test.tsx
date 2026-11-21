// Test 1: learner A's progress must not leak into learner B.
// Real: PinPadModal (unlock), AppProvider.selectLearner/switchLearner, PracticeEngine, localDb.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinPadModal } from '../../src/components/PinPadModal';
import { useApp } from '../../src/context/AppContext';
import { PracticeEngine } from '../../src/engine/practiceEngine';
import { localDb } from '../../src/db/indexedDb';
import type { LearnerProfile } from '../../src/types';
import { AppTestRoot, Captured, installFetchMock, loadPack, makeLearner, resetAppState } from '../helpers/harness';

function UnlockGate({ learner }: { learner: LearnerProfile }) {
  const { selectLearner } = useApp();
  return (
    <PinPadModal
      learner={learner}
      isOpen
      onClose={() => {}}
      onSuccess={() => selectLearner(learner)}
    />
  );
}

describe('profile isolation', () => {
  it('learner B sees empty progress after A recorded an attempt', async () => {
    await resetAppState();
    installFetchMock();
    const pack = loadPack('en-10-maths-cbse');
    const A = makeLearner({ id: 'learner_a', nickname: 'Asha', loginCode: 'ASHA-10', pin: '2468' });
    const B = makeLearner({ id: 'learner_b', nickname: 'Bala', loginCode: 'BALA-10', pin: '1357' });
    await localDb.saveLearner(A);
    await localDb.saveLearner(B);

    const captured: Captured = { ctx: null };
    const user = userEvent.setup();
    const { rerender } = render(
      <AppTestRoot captured={captured}>
        <UnlockGate learner={A} />
      </AppTestRoot>
    );

    // Unlock A with A's PIN through the real keypad.
    for (const d of '2468') await user.click(screen.getByRole('button', { name: d }));
    await waitFor(() => expect(captured.ctx?.activeLearner?.id).toBe('learner_a'));

    // A records one wrong attempt via the real engine.
    const q = pack.questions[0];
    await PracticeEngine.recordAttemptAndUpdateSkill({
      eventId: 'evt_a_1',
      learnerId: 'learner_a',
      questionId: q.id,
      skillId: q.skillId,
      chosenAnswer: 'A',
      correct: false,
      mistakeTag: null,
      hintsUsed: 0,
      timeMs: 1000,
      inputMode: 'tap',
      ts: Date.now(),
    });
    await act(async () => {
      await captured.ctx!.refreshLearnerData();
    });
    expect(captured.ctx!.skillStates.size).toBe(1);

    // Switch to B and unlock B with B's own PIN.
    await act(async () => {
      captured.ctx!.switchLearner();
    });
    rerender(
      <AppTestRoot captured={captured}>
        <UnlockGate learner={B} />
      </AppTestRoot>
    );
    for (const d of '1357') await user.click(screen.getByRole('button', { name: d }));
    await waitFor(() => expect(captured.ctx?.activeLearner?.id).toBe('learner_b'));
    await waitFor(() => expect(captured.ctx!.skillStates.size).toBe(0));

    // B's stored data is empty; A's is untouched.
    expect(await localDb.getAttemptsByLearner('learner_b')).toHaveLength(0);
    expect(await localDb.getAllSkillStates('learner_b')).toHaveLength(0);
    expect(await localDb.getAttemptsByLearner('learner_a')).toHaveLength(1);
  });
});
