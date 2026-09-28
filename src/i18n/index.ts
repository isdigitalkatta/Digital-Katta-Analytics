import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, STORAGE_LANG_KEY, SupportedLanguage, SUPPORTED_LANGUAGES } from './types';

// Import locales
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import pa from './locales/pa.json';
import or from './locales/or.json';
import ur from './locales/ur.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  gu: { translation: gu },
  bn: { translation: bn },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  ml: { translation: ml },
  pa: { translation: pa },
  or: { translation: or },
  ur: { translation: ur },
  as: { translation: bn }, // Fallback to Bengali / English for Phase 2
  ne: { translation: hi }, // Fallback to Hindi / English for Phase 2
};

// Retrieve stored language or default to 'en'
const getStoredLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const stored = localStorage.getItem(STORAGE_LANG_KEY) as SupportedLanguage;
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      return stored;
    }
  } catch (e) {
    // localStorage might fail in restricted iframes
  }
  return DEFAULT_LANGUAGE;
};

const initialLang = getStoredLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    react: {
      useSuspense: false,
    },
  });

// Apply document direction (RTL for Urdu)
if (typeof document !== 'undefined') {
  const isRtl = initialLang === 'ur';
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', initialLang);
}

export const changeAppLanguage = async (newLang: SupportedLanguage) => {
  try {
    await i18n.changeLanguage(newLang);
  } catch (err) {
    console.error('Failed to change i18n language:', err);
  }
  try {
    localStorage.setItem(STORAGE_LANG_KEY, newLang);
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
  if (typeof document !== 'undefined') {
    const isRtl = newLang === 'ur';
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLang);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('digitalkatta_language_changed', { detail: newLang }));
  }
};

/**
 * Format currency with Indian grouping: ₹1,23,456
 * Preserves Latin numerals by default for fintech clarity while allowing Indian prefix ₹
 */
export const formatIndianCurrency = (amount: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

/**
 * Format date in standard Indian format (DD/MM/YYYY)
 */
export const formatIndianDate = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
};

export default i18n;
