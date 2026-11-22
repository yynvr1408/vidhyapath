import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SCHEDULED_LANGUAGES, ScheduledLanguage } from '../config/languages';
import { SupportedLang } from '../utils/translations';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'compact' | 'full' | 'pill';
  showLabel?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'compact',
  showLabel = false,
}) => {
  const { currentLanguage, switchLanguage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangObj =
    SCHEDULED_LANGUAGES.find((l) => l.code === currentLanguage) || SCHEDULED_LANGUAGES[0];

  const handleSelect = (lang: ScheduledLanguage) => {
    switchLanguage(lang.code as SupportedLang);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Select Language / భాష ఎంచుకోండి / भाषा चुनें"
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#0F766E] text-[#0F172A] font-bold text-sm shadow-2xs transition-all active:scale-98 cursor-pointer focus:outline-hidden ${
          variant === 'pill' ? 'rounded-full px-3.5 py-1.5 text-xs' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="w-4 h-4 text-[#0F766E] shrink-0" />
          {showLabel && (
            <span className="text-xs text-[#64748B] font-semibold hidden sm:inline">
              {currentLanguage === 'te' ? 'భాష:' : currentLanguage === 'hi' ? 'भाषा:' : 'Language:'}
            </span>
          )}
          {/* Pure Native Name Only: Zero brackets, zero English subtitles */}
          <span className="truncate font-extrabold text-[#0F172A] text-sm">
            {currentLangObj.nativeName}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#64748B] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0F766E]' : ''
          }`}
        />
      </button>

      {/* Accessible Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Languages of India"
          className="absolute right-0 mt-1.5 w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-[#E2E8F0] z-50 py-1.5 divide-y divide-[#F1F5F9] focus:outline-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-3.5 py-2 bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
            <span>22 Scheduled Languages</span>
            <span className="text-[10px] text-[#0F766E] font-extrabold">భారతీయ భాషలు</span>
          </div>

          {/* Core Teaching Section */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-bold text-[#0F766E] uppercase tracking-wider bg-[#F0FDFA]">
              {currentLanguage === 'te'
                ? 'ప్రధాన బోధనా భాషలు'
                : currentLanguage === 'hi'
                ? 'प्रमुख शिक्षण माध्यम'
                : 'Core Teaching Mediums'}
            </div>
            {SCHEDULED_LANGUAGES.filter((l) => l.isTeachingSupported).map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm font-bold transition-colors ${
                    isSelected
                      ? 'bg-[#F0FDFA] text-[#0F766E] font-extrabold'
                      : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="text-base">{lang.nativeName}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#0F766E]" />}
                </button>
              );
            })}
          </div>

          {/* All Other Scheduled Languages */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider bg-[#F8FAFC]">
              {currentLanguage === 'te'
                ? 'అన్ని అధికారిక భాషలు'
                : currentLanguage === 'hi'
                ? 'अन्य अनुसूचित भाषाएं'
                : 'All Scheduled Languages'}
            </div>
            {SCHEDULED_LANGUAGES.filter((l) => !l.isTeachingSupported).map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-[#F0FDFA] text-[#0F766E] font-extrabold'
                      : 'text-[#334155] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{lang.nativeName}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#0F766E]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
