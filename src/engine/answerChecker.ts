import { Question, ContentPack } from '../types';

export interface AnswerCheckResult {
  isCorrect: boolean;
  chosenOptionKey: 'A' | 'B' | 'C' | 'D' | null;
  mistakeTag: string | null;
  remedyText: string | null;
  correctAnswerKey: 'A' | 'B' | 'C' | 'D';
  correctAnswerText: string;
}

export class DeterministicAnswerChecker {
  /**
   * Normalizes a string for lenient matching:
   * trims, removes extra whitespace, lowers case, removes Telugu zero-width chars
   */
  private static normalize(str: string): string {
    return str
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width chars
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  /**
   * Evaluates a user answer (either an option letter 'A'|'B'|'C'|'D', or speech text)
   * Deterministic, zero AI hallucination.
   */
  public static checkAnswer(
    question: Question,
    input: string,
    pack: ContentPack
  ): AnswerCheckResult {
    const rawInput = input.trim();
    const upperInput = rawInput.toUpperCase();
    const normalizedInput = this.normalize(rawInput);

    let chosenOptionKey: 'A' | 'B' | 'C' | 'D' | null = null;

    // Check if input directly matches one of the option keys
    if (['A', 'B', 'C', 'D'].includes(upperInput)) {
      chosenOptionKey = upperInput as 'A' | 'B' | 'C' | 'D';
    } else {
      // Check if input matches one of the 4 options text or acceptedForms
      const optionIndex = question.options.findIndex((opt) => {
        const normOpt = this.normalize(opt);
        return normOpt === normalizedInput || normalizedInput.includes(normOpt) || normOpt.includes(normalizedInput);
      });

      if (optionIndex !== -1) {
        chosenOptionKey = ['A', 'B', 'C', 'D'][optionIndex] as 'A' | 'B' | 'C' | 'D';
      } else {
        // Check accepted forms
        const matchedAccepted = question.acceptedForms.some((form) => {
          const normForm = this.normalize(form);
          return normForm === normalizedInput || normalizedInput.includes(normForm);
        });

        if (matchedAccepted) {
          chosenOptionKey = question.answer;
        }
      }
    }

    const isCorrect = chosenOptionKey === question.answer;
    let mistakeTag: string | null = null;
    let remedyText: string | null = null;

    if (!isCorrect && chosenOptionKey) {
      mistakeTag = question.distractorMistakes[chosenOptionKey] || 'general_calculation_error';
      remedyText = pack.mistakeRemedies[mistakeTag] || 'జవాబును మరియు సూత్రాన్ని ఒకసారి నిశితంగా పరిశీలించండి.';
    }

    const correctIdx = ['A', 'B', 'C', 'D'].indexOf(question.answer);
    const correctAnswerText = correctIdx !== -1 ? question.options[correctIdx] : '';

    return {
      isCorrect,
      chosenOptionKey,
      mistakeTag,
      remedyText,
      correctAnswerKey: question.answer,
      correctAnswerText,
    };
  }
}
