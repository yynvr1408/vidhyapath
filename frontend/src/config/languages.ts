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
 * All 22 Scheduled Languages of India (Eighth Schedule) + English
 * - Strictly displays PURE native script (NO brackets, NO English subtitles).
 * - Portal navigation & platform discovery available for all scheduled languages.
 * - Core teaching curriculum & Socratic AI Tutor focused on:
 *   1. Telugu (తెలుగు)
 *   2. Hindi (हिन्दी)
 *   3. English (English)
 */
export const SCHEDULED_LANGUAGES: AppLanguage[] = [
  // 1. Core Teaching Mediums (Deep Socratic AI + Curriculums)
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', hasCuratedPack: true, packId: 'te-10-maths-ap', locale: 'te-IN', isTeachingSupported: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', hasCuratedPack: true, packId: 'hi-10-maths-cbse', locale: 'hi-IN', isTeachingSupported: true },
  { code: 'en', name: 'English', nativeName: 'English', hasCuratedPack: true, packId: 'en-10-maths-cbse', locale: 'en-IN', isTeachingSupported: true },

  // 2. Scheduled Languages for Pan-India Portal Navigation & Awareness
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', hasCuratedPack: false, packId: 'en-10-maths-cbse', locale: 'bn-IN', isTeachingSupported: false },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'mr-IN', isTeachingSupported: false },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', hasCuratedPack: false, packId: 'en-10-maths-cbse', locale: 'ta-IN', isTeachingSupported: false },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'gu-IN', isTeachingSupported: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'ur-IN', isTeachingSupported: false },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', hasCuratedPack: false, packId: 'en-10-maths-cbse', locale: 'kn-IN', isTeachingSupported: false },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', hasCuratedPack: false, packId: 'en-10-maths-cbse', locale: 'or-IN', isTeachingSupported: false },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', hasCuratedPack: false, packId: 'en-10-maths-cbse', locale: 'ml-IN', isTeachingSupported: false },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'pa-IN', isTeachingSupported: false },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', hasCuratedPack: false, packId: 'en-10-maths-cbse', locale: 'as-IN', isTeachingSupported: false },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'mai-IN', isTeachingSupported: false },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'sat-IN', isTeachingSupported: false },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'ks-IN', isTeachingSupported: false },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'ne-IN', isTeachingSupported: false },
  { code: 'gom', name: 'Konkani', nativeName: 'कोंकणी', hasCuratedPack: false, packId: 'en-10-maths-cbse', locale: 'gom-IN', isTeachingSupported: false },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'sd-IN', isTeachingSupported: false },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'doi-IN', isTeachingSupported: false },
  { code: 'brx', name: 'Bodo', nativeName: 'बर\'', hasCuratedPack: false, packId: 'en-10-maths-cbse', locale: 'brx-IN', isTeachingSupported: false },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', hasCuratedPack: false, packId: 'en-10-maths-cbse', locale: 'mni-IN', isTeachingSupported: false },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', hasCuratedPack: false, packId: 'hi-10-maths-cbse', locale: 'sa-IN', isTeachingSupported: false },
];

/**
 * Core Curated Teaching Languages (strictly Telugu, Hindi, English)
 */
export const SUPPORTED_LANGUAGES: AppLanguage[] = SCHEDULED_LANGUAGES.slice(0, 3);

export function getLanguageByCode(code: string): AppLanguage {
  return SCHEDULED_LANGUAGES.find((l) => l.code === code) || SCHEDULED_LANGUAGES[0];
}
