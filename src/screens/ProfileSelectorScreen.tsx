import React, { useState } from 'react';
import { Plus, Globe, Shield, ShieldCheck, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnerProfile } from '../types';
import { StudentAvatar } from '../components/StudentAvatar';
import { VidyapathLogo } from '../components/VidyapathLogo';
import { PinPadModal } from '../components/PinPadModal';
import { AddProfileModal } from '../components/AddProfileModal';
import { getTranslations, SupportedLang } from '../utils/translations';
import { SCHEDULED_LANGUAGES } from '../config/languages';

// Formats display names cleanly based on current language
const getCleanDisplayName = (nickname: string, lang: SupportedLang) => {
  if (!nickname) return { primary: 'Student', secondary: '' };
  if (nickname.includes('/')) {
    const parts = nickname.split('/').map((s) => s.trim());
    const teluguPart = parts.find((p) => /[\u0C00-\u0C7F]/.test(p));
    const englishPart = parts.find((p) => !/[\u0C00-\u0C7F\u0900-\u097F]/.test(p));
    const hindiPart = parts.find((p) => /[\u0900-\u097F]/.test(p));

    if (lang === 'te' && teluguPart) {
      return { primary: teluguPart, secondary: englishPart || '' };
    }
    if (lang === 'hi' && hindiPart) {
      return { primary: hindiPart, secondary: englishPart || '' };
    }
    return { primary: englishPart || parts[0], secondary: teluguPart || hindiPart || '' };
  }
  return { primary: nickname, secondary: '' };
};

export const ProfileSelectorScreen: React.FC = () => {
  const {
    learners,
    selectLearner,
    loginWithCode,
    currentLanguage,
    switchLanguage,
    isOffline,
    toggleSimulatedOffline,
    setScreen,
  } = useApp();

  const t = getTranslations(currentLanguage);

  const [selectedLearnerForPin, setSelectedLearnerForPin] = useState<LearnerProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [codeLoginError, setCodeLoginError] = useState<string | null>(null);

  const handleProfileClick = (learner: LearnerProfile) => {
    setSelectedLearnerForPin(learner);
  };

  const handlePinSuccess = () => {
    if (selectedLearnerForPin) {
      selectLearner(selectedLearnerForPin);
      setSelectedLearnerForPin(null);
    }
  };

  const handleDirectCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCodeInput.trim()) return;
    const res = await loginWithCode(studentCodeInput.trim());
    if (res.success && res.learner) {
      setCodeLoginError(null);
    } else {
      setCodeLoginError(res.message || 'Student code not found. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto text-[#0F172A] safe-top-inset">
      {/* 1. Sleek Top Bar with Status & Language Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        {/* Offline Status / Demo Toggle */}
        <button
          type="button"
          onClick={toggleSimulatedOffline}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            isOffline
              ? 'bg-[#FEF3C7] border-[#D97706]/40 text-[#92400E]'
              : 'bg-[#DCFCE7] border-[#16A34A]/30 text-[#16A34A]'
          }`}
          title="Click to toggle offline mode simulation"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOffline ? 'bg-[#D97706]' : 'bg-[#16A34A]'
            }`}
          />
          <span>{isOffline ? t.offlineSaved : t.online}</span>
        </button>

        {/* 22-Language Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-[#FFFFFF] px-2.5 py-1 rounded-[12px] border border-[#E2E8F0] shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-[#0F766E]" />
          <select
            value={currentLanguage}
            onChange={(e) => switchLanguage(e.target.value as SupportedLang)}
            className="text-xs font-bold text-[#0F172A] bg-transparent focus:outline-hidden cursor-pointer max-w-[130px] truncate"
            title="Choose from 22 Eighth Schedule Indian Languages"
          >
            {SCHEDULED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Focused, Clean Hero Header (No walls of text) */}
      <div className="text-center pt-5 pb-3 flex flex-col items-center">
        <VidyapathLogo size="md" showWordmark={true} className="mb-2" />
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight mt-1">
          {t.landingTitle}
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] font-medium mt-1 max-w-xs">
          {t.landingSubtitle}
        </p>

        {/* Compact Demo PIN Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FEF3C7] text-[#D97706] text-xs font-bold rounded-full mt-2.5 border border-[#FDE68A]">
          <Sparkles className="w-3 h-3 text-[#D97706]" />
          <span>{t.demoPinHint}</span>
        </div>
      </div>

      {/* 3. Symmetrical, Structured Card Grid with Identical Alignment */}
      <div className="flex-1 py-3">
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {learners.map((learner) => {
            const displayName = getCleanDisplayName(learner.nickname, currentLanguage);
            const classLabelText = learner.classGrade
              ? `${learner.classGrade} ${t.classText}`
              : `10 ${t.classText}`;

            return (
              <button
                key={learner.id}
                type="button"
                onClick={() => handleProfileClick(learner)}
                className="bg-[#FFFFFF] hover:bg-[#F0FDFA] p-3.5 rounded-[12px] border border-[#E2E8F0] hover:border-[#0F766E] transition-all flex flex-col items-center text-center shadow-xs hover:shadow-sm active:scale-98 group h-[192px] justify-between relative overflow-hidden"
              >
                {/* Top Slot: Avatar */}
                <div className="w-full flex justify-center items-center h-[56px] pt-1">
                  <StudentAvatar learner={learner} size="md" />
                </div>

                {/* Middle Slot: Clean Name & Class Badge */}
                <div className="w-full flex flex-col items-center justify-center min-h-[50px] px-1">
                  <div className="font-extrabold text-[15px] text-[#0F172A] group-hover:text-[#0F766E] transition-colors truncate w-full leading-tight">
                    {displayName.primary}
                  </div>
                  {displayName.secondary ? (
                    <div className="text-[11px] text-[#64748B] font-medium truncate w-full mt-0.5">
                      {displayName.secondary}
                    </div>
                  ) : (
                    <div className="h-[16px]" />
                  )}
                  <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                    {classLabelText}
                  </div>
                </div>

                {/* Bottom Slot: Action Pill */}
                <div className="w-full pt-1">
                  <div className="w-full py-1.5 px-2 rounded-[8px] bg-[#F8FAFC] group-hover:bg-[#0F766E] border border-[#E2E8F0] group-hover:border-[#0F766E] transition-colors flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#475569] group-hover:text-white">
                    <Lock className="w-3 h-3 text-[#0F766E] group-hover:text-white shrink-0" />
                    <span className="truncate">{t.tapToEnter}</span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Add Sample Profile Card - Identical Outer Height & 3-Slot Structure */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-[#FFFFFF] hover:bg-[#F0FDFA] p-3.5 rounded-[12px] border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] transition-all flex flex-col items-center text-center shadow-xs hover:shadow-sm active:scale-98 group h-[192px] justify-between relative"
          >
            {/* Top Slot: Matching circular icon */}
            <div className="w-full flex justify-center items-center h-[56px] pt-1">
              <div className="w-12 h-12 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>

            {/* Middle Slot: Matching Title & Badge */}
            <div className="w-full flex flex-col items-center justify-center min-h-[50px] px-1">
              <div className="font-extrabold text-[15px] text-[#0F172A] group-hover:text-[#0F766E] transition-colors truncate w-full leading-tight">
                {t.newStudentLabel}
              </div>
              <div className="h-[16px]" />
              <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                + ప్రొఫైల్
              </div>
            </div>

            {/* Bottom Slot: Matching Action Button */}
            <div className="w-full pt-1">
              <div className="w-full py-1.5 px-2 rounded-[8px] bg-[#F8FAFC] group-hover:bg-[#0F766E] border border-[#E2E8F0] group-hover:border-[#0F766E] transition-colors flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#475569] group-hover:text-white">
                <Plus className="w-3 h-3 text-[#0F766E] group-hover:text-white shrink-0" />
                <span className="truncate">{t.addSampleProfile}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Student Code Direct Login (Optional) */}
        <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
          <form onSubmit={handleDirectCodeLogin} className="flex items-center gap-2 max-w-sm mx-auto">
            <input
              type="text"
              value={studentCodeInput}
              onChange={(e) => {
                setStudentCodeInput(e.target.value.toUpperCase());
                setCodeLoginError(null);
              }}
              placeholder="Enter Student Code (e.g. CHTR-10)"
              className="flex-1 text-xs font-mono font-bold p-2.5 rounded-[10px] bg-white border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden uppercase"
            />
            <button
              type="submit"
              className="py-2.5 px-3 rounded-[10px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold active:scale-95 transition-all shadow-2xs"
            >
              Login
            </button>
          </form>
          {codeLoginError && (
            <p className="text-[11px] text-[#DC2626] font-semibold text-center mt-1.5">
              {codeLoginError}
            </p>
          )}
        </div>
      </div>

      {/* 4. Minimal Footer with Guardian Link, Admin Portal & Privacy Note */}
      <footer className="pt-3 border-t border-[#E2E8F0] flex flex-col items-center text-center gap-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setScreen('PARENT_VIEW')}
            className="text-xs text-[#0F766E] hover:underline font-bold inline-flex items-center gap-1.5 py-1"
          >
            <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            <span>{t.parentViewTitle}</span>
          </button>

          <span className="text-[#CBD5E1]">·</span>

          <button
            type="button"
            onClick={() => setScreen('ADMIN')}
            className="text-xs text-[#475569] hover:text-[#0F172A] hover:underline font-bold inline-flex items-center gap-1.5 py-1"
          >
            <Lock className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Admin &amp; Teacher Portal</span>
          </button>
        </div>

        <p className="text-[11px] text-[#64748B] font-medium flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-[#0F766E]" />
          <span>{t.zeroPiiNotice}</span>
        </p>
      </footer>

      {/* 4-Digit PIN Pad Modal */}
      {selectedLearnerForPin && (
        <PinPadModal
          learner={selectedLearnerForPin}
          isOpen={!!selectedLearnerForPin}
          onClose={() => setSelectedLearnerForPin(null)}
          onSuccess={handlePinSuccess}
        />
      )}

      {/* Add Sample Profile Modal */}
      {showAddModal && (
        <AddProfileModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
