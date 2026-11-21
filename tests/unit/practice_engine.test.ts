// Unit: mastery update formula and the deterministic answer checker.
import { describe, it, expect } from 'vitest';
import { PracticeEngine } from '../../src/engine/practiceEngine';
import { DeterministicAnswerChecker } from '../../src/engine/answerChecker';
import type { ContentPack, Question } from '../../src/types';

describe('PracticeEngine.calculateNewMastery', () => {
  const cases: [number, boolean, number, number][] = [
    // [current mastery, correct, hintsUsed, credit]
    [0.3, true, 0, 1.0],
    [0.3, true, 1, 0.75],
    [0.3, true, 2, 0.5],
    [0.3, true, 3, 0.25],
    [0.3, false, 0, 0],
    [0.8, true, 0, 1.0],
    [0.5, false, 2, 0],
  ];

  for (const [mastery, correct, hints, credit] of cases) {
    it(`mastery ${mastery}, correct=${correct}, hints=${hints} follows m + 0.25*(credit - m)`, () => {
      const expected = mastery + 0.25 * (credit - mastery);
      // Implementation rounds to 3 decimals, so allow a 0.0005 rounding error.
      expect(PracticeEngine.calculateNewMastery(mastery, correct, hints)).toBeCloseTo(expected, 2);
    });
  }
});

describe('DeterministicAnswerChecker.checkAnswer', () => {
  const question: Question = {
    id: 'q1',
    skillId: 's1',
    difficulty: 1,
    text: '2 + 2 = ?',
    options: ['3', '4', '5', '6'],
    answer: 'B',
    acceptedForms: ['four', '4 units'],
    hintLadder: ['nudge', 'method', 'step'],
    distractorMistakes: { A: 'off_by_one', C: 'sign_error', D: 'random_guess' },
  };
  const pack = { mistakeRemedies: { off_by_one: 'Count again.' } } as unknown as ContentPack;

  it('accepts the stored answer key', () => {
    const r = DeterministicAnswerChecker.checkAnswer(question, 'B', pack);
    expect(r.isCorrect).toBe(true);
    expect(r.chosenOptionKey).toBe('B');
  });

  it('rejects a different option key and returns its mistake tag and remedy', () => {
    const r = DeterministicAnswerChecker.checkAnswer(question, 'A', pack);
    expect(r.isCorrect).toBe(false);
    expect(r.mistakeTag).toBe('off_by_one');
    expect(r.remedyText).toBe('Count again.');
    expect(r.correctAnswerKey).toBe('B');
  });

  it('accepts an acceptedForms entry', () => {
    expect(DeterministicAnswerChecker.checkAnswer(question, 'four', pack).isCorrect).toBe(true);
    expect(DeterministicAnswerChecker.checkAnswer(question, '4 units', pack).isCorrect).toBe(true);
  });

  it('rejects text that is in neither the options nor acceptedForms', () => {
    const r = DeterministicAnswerChecker.checkAnswer(question, 'five', pack);
    expect(r.isCorrect).toBe(false);
    expect(r.chosenOptionKey).toBeNull();
  });

  it('a wrong option whose text matches is rejected even if it is a distractor', () => {
    expect(DeterministicAnswerChecker.checkAnswer(question, '3', pack).isCorrect).toBe(false);
  });
});
