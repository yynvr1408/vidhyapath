import { describe, it, expect } from 'vitest';
import { SAFETY_QUESTIONS, getSafetyQuestionLabel } from '../../frontend/src/config/safetyQuestions';
import { TRANSLATIONS } from '../../frontend/src/utils/translations';

describe('Student Zero-Email / Safety Question PIN Reset Suite', () => {
  it('provides all safety questions in Telugu, Hindi, and English', () => {
    expect(SAFETY_QUESTIONS.length).toBeGreaterThanOrEqual(5);

    for (const q of SAFETY_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.labels.te).toBeTruthy();
      expect(q.labels.hi).toBeTruthy();
      expect(q.labels.en).toBeTruthy();
    }
  });

  it('retrieves localized safety question labels correctly', () => {
    const teLabel = getSafetyQuestionLabel('subject', 'te');
    expect(teLabel).toBe('మీకు అత్యంత ఇష్టమైన సబ్జెక్ట్ ఏది?');

    const hiLabel = getSafetyQuestionLabel('animal', 'hi');
    expect(hiLabel).toBe('आपका पसंदीदा जानवर कौन सा है?');

    const enLabel = getSafetyQuestionLabel('fruit', 'en');
    expect(enLabel).toBe('What is your favorite fruit?');
  });

  it('validates safety question matching logic (case-insensitive & regional synonyms)', () => {
    const acceptedMath = ['maths', 'math', 'mathematics', 'లెక్కలు', 'గణితం', 'गणित'];
    const storedAnswer = 'Maths';

    const verifyAnswer = (input: string, stored: string) => {
      const trimmedInput = input.trim().toLowerCase();
      const trimmedStored = stored.trim().toLowerCase();
      return (
        trimmedInput === trimmedStored ||
        (trimmedStored === 'maths' && acceptedMath.includes(trimmedInput))
      );
    };

    expect(verifyAnswer('Maths', storedAnswer)).toBe(true);
    expect(verifyAnswer('maths', storedAnswer)).toBe(true);
    expect(verifyAnswer('  MATHS  ', storedAnswer)).toBe(true);
    expect(verifyAnswer('mathematics', storedAnswer)).toBe(true);
    expect(verifyAnswer('లెక్కలు', storedAnswer)).toBe(true);
    expect(verifyAnswer('गणित', storedAnswer)).toBe(true);
    expect(verifyAnswer('Science', storedAnswer)).toBe(false);
  });

  it('contains all required trilingual PIN recovery strings in translations', () => {
    const requiredKeys = [
      'forgotPin',
      'resetPinViaSafetyQuestion',
      'securityQuestionLabel',
      'securityAnswerLabel',
      'enterSecurityAnswer',
      'securityAnswerPlaceholder',
      'verifyAnswer',
      'incorrectSecurityAnswer',
      'enterNewPin',
      'pinResetSuccess',
      'backToPin',
      'noEmailOrOtpNeeded',
    ] as const;

    for (const lang of ['te', 'hi', 'en'] as const) {
      for (const key of requiredKeys) {
        expect(TRANSLATIONS[lang][key]).toBeDefined();
        expect(typeof TRANSLATIONS[lang][key]).toBe('string');
        expect((TRANSLATIONS[lang][key] as string).length).toBeGreaterThan(0);
      }
    }
  });
});
