import React, { useState } from 'react';
import {
  Plus,
  Shield,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnerProfile } from '../types';
import { StudentAvatar } from '../components/StudentAvatar';
import { VidyapathLogo } from '../components/VidyapathLogo';
import { PinPadModal } from '../components/PinPadModal';
import { AddProfileModal } from '../components/AddProfileModal';
import { getTranslations, SupportedLang } from '../utils/translations';
import { AppUpdateHeaderPill } from '../components/AppUpdateHeaderPill';
import { AppUpdateBanner } from '../components/AppUpdateBanner';
import { AppUpdateModal } from '../components/AppUpdateModal';
import { UnifiedAuthModal } from '../components/auth/UnifiedAuthModal';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAppUpdate } from '../hooks/useAppUpdate';

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
    setScreen,
  } = useApp();

  const t = getTranslations(currentLanguage);
  const { currentVersion, hasUpdate, openModal } = useAppUpdate();

  const [selectedLearnerForPin, setSelectedLearnerForPin] = useState<LearnerProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [codeLoginError, setCodeLoginError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
      {/* 1. Sleek Top Bar with Vidyapath Brand, Update Pill & 22-Language Native Selector */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        {/* Top Left: Vidyapath Brand Logo & Name */}
        <div className="flex items-center gap-2">
          <VidyapathLogo size="sm" showWordmark={false} />
          <span className="font-extrabold text-xl text-[#0F766E] tracking-tight">
            {t.appTitle}
          </span>
        </div>

        {/* Top Right: App Update Option & Universal Language Dropdown */}
        <div className="flex items-center gap-2">
          {/* App Update Header Pill (Prominently Accessible on Landing Page) */}
          <AppUpdateHeaderPill />

          {/* Pure Native Script 22-Language Selector (Zero Brackets, Zero English Subtitles) */}
          <LanguageSelector variant="compact" />
        </div>
      </div>

      {/* Floating In-App Update Alert Banner (If update or new PWA service worker is available) */}
      <AppUpdateBanner />

      {/* 2. Clean Hero Header (Centered Logo & Vernacular Title) */}
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
      </div>

      {/* 3. Main Operational Section (Onboarding Gateway or Multi-Sibling Profile Grid) */}
      <div className="flex-1 py-3">
        {learners.length === 0 ? (
          /* Clean Onboarding Gateway when zero student profiles registered */
          <div className="space-y-3.5 max-w-sm mx-auto py-2">
            {/* Card 1: Register Student Profile (Classes 1–10 100% Free) */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="w-full bg-white hover:bg-[#F0FDFA] p-4 sm:p-5 rounded-2xl border-2 border-[#0F766E]/40 hover:border-[#0F766E] shadow-xs hover:shadow-md transition-all text-left flex items-start gap-3.5 active:scale-98 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#0F172A] group-hover:text-[#0F766E] transition-colors leading-tight">
                    {currentLanguage === 'te' ? '+ విద్యార్థి ప్రొఫైల్ నమోదు' : currentLanguage === 'hi' ? '+ छात्र प्रोफ़ाइल पंजीकरण' : '+ Register Student Profile'}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                    {currentLanguage === 'te' ? 'ఉచితం' : currentLanguage === 'hi' ? 'निःशुल्क' : 'Free'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] font-medium mt-1 leading-snug">
                  {currentLanguage === 'te'
                    ? '1-10 తరగతులు (SSC & CBSE). రహస్య 4-అంకెల పిన్ మరియు భద్రతా ప్రశ్నను ఎంచుకోండి.'
                    : currentLanguage === 'hi'
                    ? 'कक्षा 1-10 (SSC और CBSE)। 4-अंकीय गोपनीय पिन एवं सुरक्षा प्रश्न सेट करें।'
                    : 'Classes 1–10 (State & CBSE). Confidential 4-digit PIN & safety question.'}
                </p>
              </div>
            </button>

            {/* Card 2: Portal Sign In & Registration (Students, Parents, Teachers, Admins) */}
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full bg-white hover:bg-[#F8FAFC] p-4 rounded-2xl border border-[#CBD5E1] hover:border-[#0F766E] shadow-2xs transition-all text-left flex items-start gap-3.5 active:scale-98 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
                  {currentLanguage === 'te' ? 'పోర్టల్ లాగిన్ & రిజిస్ట్రేషన్' : currentLanguage === 'hi' ? 'पोर्टल लॉगिन एवं पंजीकरण' : 'Portal Sign In & Register'}
                </h3>
                <p className="text-xs text-[#64748B] font-medium mt-0.5">
                  {currentLanguage === 'te'
                    ? 'విద్యార్థులు, తల్లిదండ్రులు, ఉపాధ్యాయులు & సూపర్ అడ్మిన్'
                    : currentLanguage === 'hi'
                    ? 'विद्यार्थी, अभिभावक, शिक्षक एवं सुपर व्यवस्थापक'
                    : 'Students, Parents, Teachers, Institutions & Super Admin'}
                </p>
              </div>
            </button>
          </div>
        ) : (
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
                  className="bg-[#FFFFFF] hover:bg-[#F0FDFA] p-3.5 rounded-[12px] border border-[#E2E8F0] hover:border-[#0F766E] transition-all flex flex-col items-center text-center shadow-xs hover:shadow-sm active:scale-98 group h-[192px] justify-between relative overflow-hidden cursor-pointer"
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

            {/* Add Sibling Profile Card */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-[#FFFFFF] hover:bg-[#F0FDFA] p-3.5 rounded-[12px] border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] transition-all flex flex-col items-center text-center shadow-xs hover:shadow-sm active:scale-98 group h-[192px] justify-between relative cursor-pointer"
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

              {/* Bottom Slot: Action Button */}
              <div className="w-full pt-1">
                <div className="w-full py-2 px-2.5 rounded-[8px] bg-[#F8FAFC] group-hover:bg-[#0F766E] border border-[#E2E8F0] group-hover:border-[#0F766E] transition-colors flex items-center justify-center gap-1.5 text-xs font-bold text-[#475569] group-hover:text-white min-h-[38px]">
                  <Plus className="w-3.5 h-3.5 text-[#0F766E] group-hover:text-white shrink-0" />
                  <span className="truncate">{currentLanguage === 'te' ? '+ విద్యార్థి ప్రొఫైల్' : currentLanguage === 'hi' ? '+ छात्र प्रोफ़ाइल' : '+ Add Sibling Profile'}</span>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Student Code Direct Login */}
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
              className="py-3 px-4 rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold active:scale-95 transition-all shadow-2xs min-h-[48px] cursor-pointer"
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

      {/* 4. Minimal Footer with Guardian Link, Portal Access, App Update Action & Privacy Note */}
      <footer className="pt-3 border-t border-[#E2E8F0] flex flex-col items-center text-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-[#0F766E]">
          <button
            type="button"
            onClick={() => setScreen('PARENT_VIEW')}
            className="hover:underline inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-[#F0FDFA] transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
            <span>{t.parentViewTitle}</span>
          </button>

          <span className="text-[#CBD5E1]">·</span>

          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="hover:underline inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-[#F0FDFA] transition-colors"
          >
            <Lock className="w-4 h-4 text-[#0F766E]" />
            <span>Portal Login (Student/Parent/Staff/Admin)</span>
          </button>

          <span className="text-[#CBD5E1]">·</span>

          {/* Dedicated Landing Page App Update Action */}
          <button
            type="button"
            onClick={openModal}
            className="hover:underline inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-[#FEF3C7] text-[#D97706] transition-colors"
            title="Check for App Updates & APK Downloads"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{hasUpdate ? `Update to v${currentVersion}` : `App Version: v${currentVersion}`}</span>
          </button>
        </div>

        <p className="text-xs text-[#64748B] font-medium flex items-center justify-center gap-1.5 mt-1">
          <Shield className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>{t.zeroPiiNotice}</span>
        </p>
      </footer>

      {/* Unified Multi-Role Auth Modal */}
      <UnifiedAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* 4-Digit PIN Pad Modal */}
      {selectedLearnerForPin && (
        <PinPadModal
          learner={selectedLearnerForPin}
          isOpen={!!selectedLearnerForPin}
          onClose={() => setSelectedLearnerForPin(null)}
          onSuccess={handlePinSuccess}
        />
      )}

      {/* Add Student Profile Modal */}
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
