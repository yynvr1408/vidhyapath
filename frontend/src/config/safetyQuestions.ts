import { SupportedLang } from '../utils/translations';

export interface SafetyQuestion {
  id: string;
  labels: Record<SupportedLang, string>;
}

export const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    id: 'subject',
    labels: {
      en: 'What is your favorite school subject?',
      te: 'మీకు అత్యంత ఇష్టమైన సబ్జెక్ట్ ఏది?',
      hi: 'आपका सबसे पसंदीदा विषय कौन सा है?',
    },
  },
  {
    id: 'animal',
    labels: {
      en: 'What is your favorite animal?',
      te: 'మీకు ఇష్టమైన జంతువు ఏది?',
      hi: 'आपका पसंदीदा जानवर कौन सा है?',
    },
  },
  {
    id: 'fruit',
    labels: {
      en: 'What is your favorite fruit?',
      te: 'మీకు ఇష్టమైన పండు ఏది?',
      hi: 'आपका पसंदीदा फल कौन सा है?',
    },
  },
  {
    id: 'sport',
    labels: {
      en: 'What is your favorite game or sport?',
      te: 'మీకు ఇష్టమైన ఆట ఏది?',
      hi: 'आपका पसंदीदा खेल कौन सा है?',
    },
  },
  {
    id: 'friend',
    labels: {
      en: 'What is the name of your best friend?',
      te: 'మీ ప్రాణస్నేహితుడి పేరు ఏమిటి?',
      hi: 'आपके सबसे अच्छे दोस्त का नाम क्या है?',
    },
  },
];

export const getSafetyQuestionLabel = (id: string, lang: SupportedLang): string => {
  const found = SAFETY_QUESTIONS.find((q) => q.id === id);
  if (found && found.labels[lang]) {
    return found.labels[lang];
  }
  // Default to subject question if not found
  return SAFETY_QUESTIONS[0].labels[lang] || SAFETY_QUESTIONS[0].labels.en;
};
