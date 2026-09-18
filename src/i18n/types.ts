export type SupportedLanguage =
  | 'en' // English (Default)
  | 'hi' // Hindi (हिन्दी)
  | 'mr' // Marathi (मराठी)
  | 'gu' // Gujarati (ગુજરાતી)
  | 'bn' // Bengali (বাংলা)
  | 'ta' // Tamil (தமிழ்)
  | 'te' // Telugu (తెలుగు)
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'ml' // Malayalam (മലയാളം)
  | 'pa' // Punjabi (ਪੰਜਾਬੀ)
  | 'or' // Odia (ଓଡ଼ିଆ)
  | 'ur' // Urdu (اردو) - RTL
  | 'as' // Assamese (অসমীয়া)
  | 'ne'; // Nepali (नेपाली)

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  script: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', dir: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', dir: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', dir: 'ltr' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Arabic-Persian', dir: 'rtl' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali-Assamese', dir: 'ltr' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari', dir: 'ltr' },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const STORAGE_LANG_KEY = 'digitalkatta_lang';
