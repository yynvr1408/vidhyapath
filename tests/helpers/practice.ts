// Drives the REAL PracticeWeakTopicsScreen by clicking its option buttons.
import { screen, waitFor, within } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import type { ContentPack, Question } from '../../frontend/src/types';
import { getTranslations } from '../../frontend/src/utils/translations';

type User = ReturnType<typeof userEvent.setup>;

/** Answers the question currently on screen (correctly or not) and clicks "Next Question". */
export async function answerCurrentQuestion(
  user: User,
  container: HTMLElement,
  pack: ContentPack,
  choice: 'correct' | 'wrong'
): Promise<Question> {
  const en = getTranslations('en');
  let question!: Question;
  await waitFor(() => {
    const h2s = Array.from(container.querySelectorAll('h2'));
    const match = h2s.map((h) => pack.questions.find((q) => q.text === h.textContent)).find(Boolean);
    if (!match) throw new Error('current question not found in pack');
    question = match;
  });

  const letter =
    choice === 'correct'
      ? question.answer
      : (['A', 'B', 'C', 'D'] as const).find((k) => k !== question.answer)!;

  // The option letter lives in its own <span>; clicking it bubbles to the option button.
  const spans = within(container).getAllByText(letter, { selector: 'span' });
  await user.click(spans[0]);
  await screen.findByRole('button', { name: en.nextQuestion });
  await user.click(screen.getByRole('button', { name: en.nextQuestion }));
  return question;
}
