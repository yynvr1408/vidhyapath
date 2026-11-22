import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Search, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SCHEDULED_LANGUAGES, ScheduledLanguage } from '../config/languages';
import { SupportedLang } from '../utils/translations';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'compact' | 'full' | 'pill';
  showLabel?: boolean;
  dropDirection?: 'down' | 'up' | 'auto';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'compact',
  showLabel = false,
  dropDirection = 'auto',
}) => {
  const { currentLanguage, switchLanguage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Reset focus and search when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  const currentLangObj =
    SCHEDULED_LANGUAGES.find((l) => l.code === currentLanguage) || SCHEDULED_LANGUAGES[0];

  const handleSelect = (lang: ScheduledLanguage) => {
    switchLanguage(lang.code as SupportedLang);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Filter languages based on search query (native name or code)
  const filteredLanguages = SCHEDULED_LANGUAGES.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      l.nativeName.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const coreTeachingLangs = filteredLanguages.filter((l) => l.isTeachingSupported);
  const otherScheduledLangs = filteredLanguages.filter((l) => !l.isTeachingSupported);
  const flatVisibleLangs = [...coreTeachingLangs, ...otherScheduledLangs];

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1 < flatVisibleLangs.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : flatVisibleLangs.length - 1));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < flatVisibleLangs.length) {
      e.preventDefault();
      handleSelect(flatVisibleLangs[focusedIndex]);
    }
  };

  // Determine popover position: open upwards if at screen bottom or explicitly set
  const positionClass =
    dropDirection === 'up'
      ? 'bottom-full mb-1.5'
      : dropDirection === 'down'
      ? 'top-full mt-1.5'
      : 'top-full mt-1.5';

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button - Pure Native Script Display (Zero English Brackets) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Select Language / భాష ఎంచుకోండి / भाषा चुनें"
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#0F766E] text-[#0F172A] font-bold text-sm shadow-2xs transition-all active:scale-98 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]/50 ${
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
          {/* Strictly Pure Native Script (e.g. తెలుగు, हिन्दी, English, বাংলা) */}
          <span className="truncate font-extrabold text-[#0F172A] text-sm tracking-tight">
            {currentLangObj.nativeName}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#64748B] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0F766E]' : ''
          }`}
        />
      </button>

      {/* Accessible Direction-Aware Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Supported Languages (Telugu, Hindi, English)"
          className={`absolute right-0 ${positionClass} w-72 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] z-50 py-2 divide-y divide-[#F1F5F9] focus:outline-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header & Search */}
          <div className="px-3.5 pt-2 pb-2.5 bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B]">
                {SCHEDULED_LANGUAGES.length} Languages
              </span>
              <span className="text-[10px] text-[#0F766E] font-extrabold">
                భారతీయ భాషలు
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="భాష వెతకండి / भाषा खोजें / Search..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F766E] focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Core Teaching Mediums Section (Telugu, Hindi, English) */}
          {coreTeachingLangs.length > 0 && (
            <div className="py-1">
              <div className="px-3.5 py-1.5 text-[10px] font-black text-[#0F766E] uppercase tracking-wider bg-[#F0FDFA] flex items-center justify-between">
                <span>
                  {currentLanguage === 'te'
                    ? 'ప్రధాన బోధనా భాషలు'
                    : currentLanguage === 'hi'
                    ? 'प्रमुख शिक्षण माध्यम'
                    : 'Core Teaching Mediums'}
                </span>
                <span className="text-[9px] bg-[#0F766E] text-white px-1.5 py-0.2 rounded font-mono font-bold">
                  AI TUTOR
                </span>
              </div>

              {coreTeachingLangs.map((lang) => {
                const isSelected = lang.code === currentLanguage;
                const flatIndex = flatVisibleLangs.findIndex((l) => l.code === lang.code);
                const isFocused = flatIndex === focusedIndex;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(lang)}
                    onMouseEnter={() => setFocusedIndex(flatIndex)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0FDFA] text-[#0F766E] font-black'
                        : isFocused
                        ? 'bg-[#F8FAFC] text-[#0F172A]'
                        : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="text-base font-extrabold">{lang.nativeName}</span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-[#0F766E]">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#0F766E] font-semibold bg-[#CCFBF1]/50 px-2 py-0.5 rounded-full">
                        Full Socratic Pack
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Other supported languages for navigation awareness */}
          {otherScheduledLangs.length > 0 && (
            <div className="py-1">
              <div className="px-3.5 py-1.5 text-[10px] font-black text-[#64748B] uppercase tracking-wider bg-[#F8FAFC] flex items-center justify-between">
                <span>
                  {currentLanguage === 'te'
                    ? 'అన్ని అధికారిక భాషలు'
                    : currentLanguage === 'hi'
                    ? 'अन्य अनुसूचित भाषाएं'
                    : 'All Scheduled Languages'}
                </span>
                <span className="text-[9px] text-[#64748B] font-medium">Pan-India</span>
              </div>

              {otherScheduledLangs.map((lang) => {
                const isSelected = lang.code === currentLanguage;
                const flatIndex = flatVisibleLangs.findIndex((l) => l.code === lang.code);
                const isFocused = flatIndex === focusedIndex;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(lang)}
                    onMouseEnter={() => setFocusedIndex(flatIndex)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0FDFA] text-[#0F766E] font-black'
                        : isFocused
                        ? 'bg-[#F8FAFC] text-[#0F172A]'
                        : 'text-[#334155] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="font-semibold">{lang.nativeName}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#0F766E] stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Educational Note on Teaching Depth */}
          <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#0F766E] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#475569] leading-tight font-medium">
                {currentLanguage === 'te'
                  ? 'ప్రధాన బోధన, AI ట్యూటర్ మరియు పూర్తి సిలబస్ తెలుగు, हिन्दी, English లలో అందుబాటులో ఉన్నాయి.'
                  : currentLanguage === 'hi'
                  ? 'मुख्य शिक्षण, एआई ट्यूटर और पूर्ण पाठ्यक्रम हिन्दी, తెలుగు और English में उपलब्ध हैं।'
                  : 'Core Socratic AI tutoring & deep curriculum packs run in Telugu, Hindi & English.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
