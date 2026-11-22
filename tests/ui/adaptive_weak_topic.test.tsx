// Test 5: a wrong answer records a weak topic that appears in My Progress and Parent/Teacher View.
// Real: PracticeWeakTopicsScreen (UI answer), PracticeEngine + localDb (skill state),
// MyProgressScreen and ParentTeacherViewScreen.
// Expected to FAIL today: MyProgressScreen and ParentTeacherViewScreen render hardcoded
// topic lists and never read skill state.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PracticeWeakTopicsScreen } from '../../src/screens/PracticeWeakTopicsScreen';
import { MyProgressScreen } from '../../src/screens/MyProgressScreen';
import { ParentTeacherViewScreen } from '../../src/screens/ParentTeacherViewScreen';
import { PracticeEngine } from '../../src/engine/practiceEngine';
import type { ContentPack, Question } from '../../src/types';
import { AppTestRoot, Captured, installFetchMock, loadPack, makeLearner, resetAppState } from '../helpers/harness';
import { answerCurrentQuestion } from '../helpers/practice';

const learner = makeLearner({ id: 'learner_weak', nickname: 'Dev', loginCode: 'DEV-10', pin: '3333' });

function topicTitleFor(pack: ContentPack, q: Question): string {
  const topic = pack.topics.find((t) => t.skills.includes(q.skillId));
  if (!topic) throw new Error(`no topic contains skill ${q.skillId}`);
  return topic.title;
}

async function seedWrongAttempt(pack: ContentPack): Promise<Question> {
  const q = pack.questions[0];
  await PracticeEngine.recordAttemptAndUpdateSkill({
    eventId: 'evt_weak_1',
    learnerId: learner.id,
    questionId: q.id,
    skillId: q.skillId,
    chosenAnswer: 'A',
    correct: false,
    mistakeTag: q.distractorMistakes['A'] ?? null,
    hintsUsed: 0,
    timeMs: 900,
    inputMode: 'tap',
    ts: Date.now(),
  });
  return q;
}

describe('adaptive weak topic', () => {
  it('a wrong practice answer lowers the skill below the weak threshold', async () => {
    await resetAppState();
    installFetchMock();
    const pack = loadPack('en-10-maths-cbse');
    const user = userEvent.setup();
    const captured: Captured = { ctx: null };
    const { container } = render(
      <AppTestRoot captured={captured} learner={learner}>
        <PracticeWeakTopicsScreen />
      </AppTestRoot>
    );

    // Answer one question wrongly through the real screen.
    await waitFor(() => expect(container.querySelector('h2')).not.toBeNull());
    const q = await answerCurrentQuestion(user, container, pack, 'wrong');

    await waitFor(() => expect(captured.ctx!.skillStates.get(q.skillId)).toBeDefined());
    expect(captured.ctx!.skillStates.get(q.skillId)!.mastery).toBeLessThan(0.6);
  });

  it('the weak topic appears in My Progress', async () => {
    await resetAppState();
    installFetchMock();
    const pack = loadPack('en-10-maths-cbse');
    const q = await seedWrongAttempt(pack);

    render(
      <AppTestRoot learner={learner}>
        <MyProgressScreen />
      </AppTestRoot>
    );
    expect(await screen.findByText(topicTitleFor(pack, q))).toBeInTheDocument();
  });

  it('the weak topic appears in Parent/Teacher View after the parent PIN', async () => {
    await resetAppState();
    installFetchMock();
    const pack = loadPack('en-10-maths-cbse');
    const q = await seedWrongAttempt(pack);
    const user = userEvent.setup();

    render(
      <AppTestRoot learner={learner}>
        <ParentTeacherViewScreen />
      </AppTestRoot>
    );
    const pinInput = screen.getByPlaceholderText(/1234|••••/);
    await user.type(pinInput, '3333');
    await user.click(screen.getByRole('button', { name: /Unlock/ }));
    expect(await screen.findByText(topicTitleFor(pack, q))).toBeInTheDocument();
  });
});
