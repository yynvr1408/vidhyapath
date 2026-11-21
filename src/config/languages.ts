export interface ScheduledLanguage {
  code: string;
  name: string;
  nativeName: string;
  hasCuratedPack: boolean;
  packId?: string;
  locale: string;
}

/**
 * All 22 Official Scheduled Languages of the Republic of India (8th Schedule) + English.
 * 
 * - Full Curated Offline Packs: English, Hindi, Telugu (Class 10 Real Numbers, Sets/Polynomials).
 * - Dynamic AI Tutoring: 100% enabled for all 22 languages via Groq 120B Multilingual LLM.
 */
export const SCHEDULED_LANGUAGES: ScheduledLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', hasCuratedPack: true, packId: 'en-10-maths-cbse', locale: 'en-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', hasCuratedPack: true, packId: 'te-10-maths-ap', locale: 'te-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', hasCuratedPack: true, packId: 'hi-10-maths-cbse', locale: 'hi-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', hasCuratedPack: false, locale: 'ta-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', hasCuratedPack: false, locale: 'kn-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', hasCuratedPack: false, locale: 'bn-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', hasCuratedPack: false, locale: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', hasCuratedPack: false, locale: 'gu-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', hasCuratedPack: false, locale: 'ml-IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', hasCuratedPack: false, locale: 'or-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', hasCuratedPack: false, locale: 'pa-IN' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', hasCuratedPack: false, locale: 'as-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', hasCuratedPack: false, locale: 'ur-IN' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', hasCuratedPack: false, locale: 'sa-IN' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', hasCuratedPack: false, locale: 'kok-IN' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', hasCuratedPack: false, locale: 'mai-IN' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', hasCuratedPack: false, locale: 'mni-IN' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', hasCuratedPack: false, locale: 'ne-NP' },
  { code: 'brx', name: 'Bodo', nativeName: 'बर\'', hasCuratedPack: false, locale: 'brx-IN' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', hasCuratedPack: false, locale: 'doi-IN' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर', hasCuratedPack: false, locale: 'ks-IN' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', hasCuratedPack: false, locale: 'sat-IN' },
  { code: 'sd', name: 'Sindhi', nativeName: 'सिन्धी', hasCuratedPack: false, locale: 'sd-IN' },
];

export function getLanguageByCode(code: string): ScheduledLanguage {
  return SCHEDULED_LANGUAGES.find((l) => l.code === code) || SCHEDULED_LANGUAGES[0];
}
