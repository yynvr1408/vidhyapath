import React, { useState, useRef, useEffect } from 'react';
import { Users, Settings, Flame, ShieldCheck, HeartHandshake, Globe, ChevronDown, Check, Sparkles, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppUpdateButton } from './AppUpdateButton';
import { SCHEDULED_LANGUAGES, ScheduledLanguage } from '../config/languages';

export const Header: React.FC = () => {
  const {
    activeLearner,
    switchLearner,
    setScreen,
    currentScreen,
    pack,
    switchPack,
    tutoringLanguage,
    setTutoringLanguage,
  } = useApp();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    if (isLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangOpen]);

  // Current active language info
  const activeLangCode = tutoringLanguage || pack?.language || 'en';
  const currentLang = SCHEDULED_LANGUAGES.find((l) => l.code === activeLangCode) || SCHEDULED_LANGUAGES[0];

  const filteredLanguages = SCHEDULED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const curatedLangs = filteredLanguages.filter((l) => l.hasCuratedPack);
  const aiTutorLangs = filteredLanguages.filter((l) => !l.hasCuratedPack);

  const handleSelectLanguage = (lang: ScheduledLanguage) => {
    if (lang.hasCuratedPack && lang.packId) {
      switchPack(lang.packId);
    }
    setTutoringLanguage(lang.code);
    setIsLangOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="bg-indigo-brand text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-40 relative">
      {/* Left: Active Learner Profile Avatar & Nickname */}
      <div className="flex items-center gap-3">
        {activeLearner ? (
          <div
            onClick={() => setScreen('S3_HOME')}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-80"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm border-2 border-lantern"
              style={{ backgroundColor: activeLearner.avatarColor }}
            >
              {activeLearner.avatarEmoji}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-wide leading-tight flex items-center gap-1.5">
                {activeLearner.nickname}
                <Flame className="w-4 h-4 text-lantern fill-lantern" />
              </span>
              <div className="flex items-center gap-1 text-[11px] text-indigo-200">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{pack?.language === 'te' ? 'సేవ్ అయింది' : pack?.language === 'hi' ? 'सुरक्षित' : 'Saved'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xl">🏮</span>
            <span className="font-bold text-lg text-cream-100">Vidyapath</span>
          </div>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* 22 Scheduled Languages Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            title="Select from 22 Scheduled Languages of India"
            className="text-xs bg-indigo-light/80 hover:bg-indigo-light text-cream-100 px-2.5 py-1.5 rounded-lg border border-indigo-400/30 flex items-center gap-1.5 min-h-[40px] active:scale-95 transition-all"
          >
            <Globe className="w-4 h-4 text-lantern shrink-0" />
            <span className="font-bold max-w-[80px] truncate">{currentLang.nativeName}</span>
            <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* 22 Scheduled Languages Dropdown Menu */}
          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-[460px] bg-slate-900 text-white rounded-2xl shadow-2xl border border-indigo-400/30 overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Dropdown Header */}
              <div className="p-3 bg-indigo-950/80 border-b border-indigo-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-lantern" />
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                      Languages of India
                    </span>
                  </div>
                  <span className="text-[10px] bg-indigo-800/60 text-indigo-200 px-1.5 py-0.5 rounded font-mono">
                    22 Scheduled + EN
                  </span>
                </div>

                {/* Quick Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search language / భాష / भाषा..."
                    className="w-full bg-slate-800/90 text-xs text-white pl-8 pr-7 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400 placeholder-slate-400"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Language List */}
              <div className="overflow-y-auto p-2 space-y-3 flex-1 scrollbar-thin scrollbar-thumb-indigo-700">
                {/* 1. Curated Offline Syllabus Packs */}
                {curatedLangs.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-1 flex items-center gap-1">
                      <span>✓ Full Offline Curricula (10th Board)</span>
                    </div>
                    <div className="space-y-1">
                      {curatedLangs.map((lang) => {
                        const isSelected = activeLangCode === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleSelectLanguage(lang)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                                : 'hover:bg-slate-800/80 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{lang.code === 'en' ? '🌐' : '🇮🇳'}</span>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold">{lang.nativeName}</span>
                                <span className="text-[10px] text-slate-400">{lang.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded font-mono">
                                100% Offline
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. AI Tutor Regional Languages */}
                {aiTutorLangs.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 px-2 py-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-lantern" />
                      <span>AI Tutor Regional Languages (Groq 120B)</span>
                    </div>
                    <div className="space-y-1">
                      {aiTutorLangs.map((lang) => {
                        const isSelected = activeLangCode === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleSelectLanguage(lang)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                                : 'hover:bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🇮🇳</span>
                              <div className="flex flex-col">
                                <span className="text-xs">{lang.nativeName}</span>
                                <span className="text-[10px] text-slate-400">{lang.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-indigo-900/60 text-indigo-200 border border-indigo-700/30 px-1.5 py-0.5 rounded">
                                AI Live
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Switch Learner (1-tap for shared phone) */}
        {activeLearner && (
          <button
            type="button"
            onClick={switchLearner}
            title="Switch Learner / Profile"
            className="p-2 rounded-xl bg-indigo-light/60 hover:bg-indigo-light text-cream-100 transition-all active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center border border-indigo-400/20"
          >
            <Users className="w-4 h-4 text-amber-300" />
          </button>
        )}

        {/* Sponsor Impact Quick Link */}
        <button
          type="button"
          onClick={() => setScreen(currentScreen === 'S11_IMPACT' ? 'S3_HOME' : 'S11_IMPACT')}
          title="Sponsor Impact Dashboard"
          className={`p-2 rounded-xl transition-all active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center border ${
            currentScreen === 'S11_IMPACT'
              ? 'bg-amber-500 text-indigo-900 border-amber-300'
              : 'bg-indigo-light/60 text-cream-100 border-indigo-400/20'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-lantern" />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={() => setScreen(currentScreen === 'S9_SETTINGS' ? 'S3_HOME' : 'S9_SETTINGS')}
          title="Settings"
          className={`p-2 rounded-xl transition-all active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center border ${
            currentScreen === 'S9_SETTINGS'
              ? 'bg-amber-500 text-indigo-900 border-amber-300'
              : 'bg-indigo-light/60 text-cream-100 border-indigo-400/20'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* GitHub In-App Auto-Update Button */}
        <AppUpdateButton minimal={true} />
      </div>
    </header>
  );
};
