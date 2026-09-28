import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LanguageOption } from '../i18n/types';
import { changeAppLanguage } from '../i18n';

export function useAppLanguage() {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(
    () => ((i18n.language as SupportedLanguage) || 'en')
  );

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLang((lng as SupportedLanguage) || 'en');
    };

    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<SupportedLanguage>;
      if (custom.detail) {
        setCurrentLang(custom.detail);
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);
    window.addEventListener('digitalkatta_language_changed', handleCustomEvent);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
      window.removeEventListener('digitalkatta_language_changed', handleCustomEvent);
    };
  }, [i18n]);

  const currentLangObj: LanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const setLanguage = async (newLang: SupportedLanguage) => {
    setCurrentLang(newLang);
    await changeAppLanguage(newLang);
  };

  return {
    t,
    i18n,
    currentLang,
    currentLangObj,
    setLanguage,
    isRtl: currentLang === 'ur',
  };
}
