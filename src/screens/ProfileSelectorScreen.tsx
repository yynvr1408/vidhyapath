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
import { AppUpdateHeaderPill } from '../components/AppUpdateHeaderPill';
import { AppUpdateBanner } from '../components/AppUpdateBanner';
import { AppUpdateModal } from '../components/AppUpdateModal';

// Formats display names cleanly based on current language
const getCleanDisplayName = (nickname: string, lang: SupportedLang) => {
  if (!nickname) return { primary: 'Student', secondary: '' };
  if (nickname.includes('/')) {
    const parts = nickname.split('/').map((s) => s.trim());
    const teluguPart = parts.find((p) => /[\u0C00-\u0C7F]/.test(p));
    const englishPart = parts.find((p) => !/[\u0C00-\u0C7F\u0900-\u097F]/.test(p));
    const hindiPart = parts.find((p) => /[\u0900-\u097F]/.test(p));

    if (lang === 'te' && teluguPart) {
      return { primary: teluguPart, secondary: '' };
    }
    if (lang === 'hi' && hindiPart) {
      return { primary: hindiPart, secondary: '' };
    }
    return { primary: englishPart || parts[0], secondary: '' };
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
      {/* 1. Sleek Top Bar with Vidyapath Brand & Language Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        {/* Top Left: Vidyapath Brand Name (Localized to Telugu/Hindi/English) */}
        <div className="flex items-center gap-2">
          <VidyapathLogo size="sm" showWordmark={false} />
          <span className="font-extrabold text-xl text-[#0F766E] tracking-tight">
            {t.appTitle}
          </span>
        </div>

        {/* Top Right: Language Selector Dropdown (Telugu, Hindi, English) */}
        <div className="flex items-center gap-1.5 bg-[#FFFFFF] px-2.5 py-1.5 rounded-[12px] border border-[#E2E8F0] shadow-2xs min-h-[44px]">
          <Globe className="w-4 h-4 text-[#0F766E]" />
          <select
            value={currentLanguage}
            onChange={(e) => switchLanguage(e.target.value as SupportedLang)}
            className="text-xs font-bold text-[#0F172A] bg-transparent focus:outline-hidden cursor-pointer max-w-[130px] truncate"
            title="Select Language (Telugu, Hindi, English)"
          >
            {SCHEDULED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Focused, Clean Hero Header (Centered Logo, No Hardcoded English Tagline) */}
      <div className="text-center pt-5 pb-3 flex flex-col items-center">
        <div className="flex justify-center mb-3">
          <VidyapathLogo size="lg" showWordmark={false} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight mt-1">
          {t.landingTitle}
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] font-medium mt-1 max-w-xs">
          {t.landingSubtitle}
        </p>

        {/* Compact Demo PIN Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF3C7] text-[#D97706] text-xs font-bold rounded-full mt-2.5 border border-[#FDE68A]">
          <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
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
                  <div className="font-extrabold text-base text-[#0F172A] group-hover:text-[#0F766E] transition-colors truncate w-full leading-tight">
                    {displayName.primary}
                  </div>
                  {displayName.secondary ? (
                    <div className="text-xs text-[#64748B] font-medium truncate w-full mt-0.5">
                      {displayName.secondary}
                    </div>
                  ) : (
                    <div className="h-[16px]" />
                  )}
                  <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                    {classLabelText}
                  </div>
                </div>

                {/* Bottom Slot: Action Pill */}
                <div className="w-full pt-1">
                  <div className="w-full py-2 px-2.5 rounded-[8px] bg-[#F8FAFC] group-hover:bg-[#0F766E] border border-[#E2E8F0] group-hover:border-[#0F766E] transition-colors flex items-center justify-center gap-1.5 text-xs font-bold text-[#475569] group-hover:text-white min-h-[38px]">
                    <Lock className="w-3.5 h-3.5 text-[#0F766E] group-hover:text-white shrink-0" />
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
              <div className="font-extrabold text-base text-[#0F172A] group-hover:text-[#0F766E] transition-colors truncate w-full leading-tight">
                {t.newStudentLabel}
              </div>
              <div className="h-[16px]" />
              <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                {currentLanguage === 'te' ? '+ ప్రొఫైల్' : currentLanguage === 'hi' ? '+ प्रोफ़ाइल' : '+ Profile'}
              </div>
            </div>

            {/* Bottom Slot: Matching Action Button */}
            <div className="w-full pt-1">
              <div className="w-full py-2 px-2.5 rounded-[8px] bg-[#F8FAFC] group-hover:bg-[#0F766E] border border-[#E2E8F0] group-hover:border-[#0F766E] transition-colors flex items-center justify-center gap-1.5 text-xs font-bold text-[#475569] group-hover:text-white min-h-[38px]">
                <Plus className="w-3.5 h-3.5 text-[#0F766E] group-hover:text-white shrink-0" />
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
              placeholder={currentLanguage === 'te' ? 'స్టూడెంట్ కోడ్ (ఉదా: RAVI-10)' : currentLanguage === 'hi' ? 'छात्र कोड (उदा: RAVI-10)' : 'Student Code (e.g. RAVI-10)'}
              className="flex-1 text-sm font-mono font-bold p-3 rounded-[12px] bg-white border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden uppercase min-h-[48px]"
            />
            <button
              type="submit"
              className="py-3 px-4 rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold active:scale-95 transition-all shadow-2xs min-h-[48px]"
            >
              {currentLanguage === 'te' ? 'లాగిన్' : currentLanguage === 'hi' ? 'लॉगिन' : 'Login'}
            </button>
          </form>
          {codeLoginError && (
            <p className="text-xs text-[#DC2626] font-semibold text-center mt-1.5">
              {codeLoginError}
            </p>
          )}
        </div>
      </div>

      {/* 4. Minimal Footer with Guardian Link & Privacy Note */}
      <footer className="pt-3 border-t border-[#E2E8F0] flex flex-col items-center text-center gap-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setScreen('PARENT_VIEW')}
            className="text-sm text-[#0F766E] hover:underline font-bold inline-flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-[#F0FDFA] min-h-[48px]"
          >
            <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
            <span>{t.parentViewTitle}</span>
          </button>
        </div>

        <p className="text-xs text-[#64748B] font-medium flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#0F766E]" />
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

      {/* Global Interactive In-App Update Modal */}
      <AppUpdateModal />
    </div>
  );
};
