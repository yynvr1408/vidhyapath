export interface AppLanguage {
  code: 'te' | 'hi' | 'en';
  name: string;
  nativeName: string;
  hasCuratedPack: boolean;
  packId: string;
  locale: string;
}

export type ScheduledLanguage = AppLanguage;

/**
 * Vidyapath Core Supported Languages:
 * Focused trilingual curriculum and interface architecture:
 * 1. Telugu (తెలుగు) - Class 10 AP State Board (`te-10-maths-ap`)
 * 2. Hindi (हिन्दी) - Class 10 CBSE / State Board (`hi-10-maths-cbse`)
 * 3. English - Class 10 CBSE / Pan-India (`en-10-maths-cbse`)
 */
export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', hasCuratedPack: true, packId: 'te-10-maths-ap', locale: 'te-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', hasCuratedPack: true, packId: 'hi-10-maths-cbse', locale: 'hi-IN' },
  { code: 'en', name: 'English', nativeName: 'English', hasCuratedPack: true, packId: 'en-10-maths-cbse', locale: 'en-IN' },
];

export const SCHEDULED_LANGUAGES = SUPPORTED_LANGUAGES;

export function getLanguageByCode(code: string): AppLanguage {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}
