export interface AppLanguage {
  code: string;
  name: string;
  nativeName: string;
  hasCuratedPack: boolean;
  packId: string;
  locale: string;
  isTeachingSupported: boolean;
}

export type ScheduledLanguage = AppLanguage;

/**
 * Supported app languages: Telugu, Hindi, English only
 * - Strictly displays PURE native script (NO brackets, NO English subtitles).
 * - Portal navigation & platform discovery available for all scheduled languages.
 * - Core teaching curriculum & Socratic AI Tutor focused on:
 *   1. Telugu (తెలుగు)
 *   2. Hindi (हिन्दी)
 *   3. English (English)
 */
export const SCHEDULED_LANGUAGES: AppLanguage[] = [
  // Strictly supported languages: Telugu, Hindi, English
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', hasCuratedPack: true, packId: 'te-10-maths-ap', locale: 'te-IN', isTeachingSupported: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', hasCuratedPack: true, packId: 'hi-10-maths-cbse', locale: 'hi-IN', isTeachingSupported: true },
  { code: 'en', name: 'English', nativeName: 'English', hasCuratedPack: true, packId: 'en-10-maths-cbse', locale: 'en-IN', isTeachingSupported: true },
];


/**
 * Core Curated Teaching Languages (strictly Telugu, Hindi, English)
 */
export const SUPPORTED_LANGUAGES: AppLanguage[] = SCHEDULED_LANGUAGES.slice(0, 3);

export function getLanguageByCode(code: string): AppLanguage {
  return SCHEDULED_LANGUAGES.find((l) => l.code === code) || SCHEDULED_LANGUAGES[0];
}
