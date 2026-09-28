import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check, ChevronDown, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/types';
import { changeAppLanguage } from '../i18n';

interface LanguageSelectorProps {
  variant?: 'nav' | 'compact' | 'modal';
  onLanguageChange?: (lang: SupportedLanguage) => void;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'nav',
  onLanguageChange,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state directly so button label immediately updates
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

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (code: SupportedLanguage) => {
    setIsOpen(false);
    setCurrentLang(code);
    await changeAppLanguage(code);
    if (onLanguageChange) {
      onLanguageChange(code);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef} id="language-selector-wrapper">
      <button
        id="language-selector-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          variant === 'nav'
            ? 'px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs'
            : 'px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Change language / भाषा बदलें"
      >
        <Languages className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-semibold">{currentLangObj.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="language-selector-dropdown"
          className="absolute right-0 mt-1.5 w-64 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-2.5 bg-slate-50/80 rounded-t-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Indian Languages (11+ Supported)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              UI, AI analysis, & reports adapt to your language
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 focus:outline-none">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  id={`lang-option-${lang.code}`}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors text-left ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">
                      {lang.name} {lang.dir === 'rtl' ? '• RTL' : ''}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
