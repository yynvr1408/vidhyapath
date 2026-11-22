import React, { useState } from 'react';
import {
  Plus,
  UserPlus,
  Shield,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  GraduationCap,
  Users,
  Building2,
  KeyRound,
  BookOpen,
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
import { UnifiedAuthModal, AuthRoleTab } from '../components/auth/UnifiedAuthModal';
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
  
  // Unified Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<AuthRoleTab>('student');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuth = (role: AuthRoleTab, mode: 'login' | 'register' = 'login') => {
    setAuthModalRole(role);
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

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

      {/* 2. Hero Header (Centered Logo & Vernacular Title) */}
      <div className="text-center pt-4 pb-2 flex flex-col items-center">
        <div className="flex justify-center mb-2">
          <VidyapathLogo size="md" showWordmark={false} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          {t.landingTitle}
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] font-medium mt-0.5 max-w-xs">
          {t.landingSubtitle}
        </p>
      </div>

      {/* 3. Section 1: Student Profiles & Quick Login */}
      <div className="flex-1 py-3 space-y-4">
        {/* If profiles exist on device: Grid of Student Profiles */}
        {learners.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#475569]">
                {currentLanguage === 'te' ? 'విద్యార్థి ప్రొఫైల్స్' : currentLanguage === 'hi' ? 'छात्र प्रोफ़ाइल' : 'Student Profiles'}
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{currentLanguage === 'te' ? 'కొత్త విద్యార్థి' : currentLanguage === 'hi' ? 'नया छात्र' : 'New Student'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                    className="bg-[#FFFFFF] hover:bg-[#F0FDFA] p-3 rounded-[12px] border border-[#E2E8F0] hover:border-[#0F766E] transition-all flex flex-col items-center text-center shadow-xs active:scale-98 group justify-between cursor-pointer"
                  >
                    <div className="w-full flex justify-center items-center pt-1">
                      <StudentAvatar learner={learner} size="md" />
                    </div>
                    <div className="w-full flex flex-col items-center justify-center my-1.5 px-1">
                      <div className="font-extrabold text-sm text-[#0F172A] group-hover:text-[#0F766E] transition-colors truncate w-full">
                        {displayName.primary}
                      </div>
                      <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                        {classLabelText}
                      </div>
                    </div>
                    <div className="w-full py-1.5 px-2 rounded-[8px] bg-[#F8FAFC] group-hover:bg-[#0F766E] border border-[#E2E8F0] group-hover:border-[#0F766E] transition-colors flex items-center justify-center gap-1 text-[11px] font-bold text-[#475569] group-hover:text-white">
                      <Lock className="w-3 h-3 text-[#0F766E] group-hover:text-white shrink-0" />
                      <span className="truncate">{t.tapToEnter}</span>
                    </div>
                  </button>
                );
              })}

              {/* Add Student / Sibling Profile Card */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="bg-[#FFFFFF] hover:bg-[#F0FDFA] p-3 rounded-[12px] border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] transition-all flex flex-col items-center text-center shadow-xs active:scale-98 group justify-between cursor-pointer"
              >
                <div className="w-full flex justify-center items-center pt-2">
                  <div className="w-11 h-11 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserPlus className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
                <div className="w-full flex flex-col items-center justify-center my-1.5 px-1">
                  <div className="font-extrabold text-sm text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
                    {currentLanguage === 'te' ? 'సహోదరుడి ప్రొఫైల్' : currentLanguage === 'hi' ? 'सहोदर प्रोफ़ाइल' : 'Add Sibling Profile'}
                  </div>
                  <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                    {currentLanguage === 'te' ? 'తరగతి 1-12' : currentLanguage === 'hi' ? 'कक्षा 1-12' : 'Classes 1–12'}
                  </div>
                </div>
                <div className="w-full py-1.5 px-2 rounded-[8px] bg-[#F0FDFA] group-hover:bg-[#0F766E] border border-[#CCFBF1] group-hover:border-[#0F766E] transition-colors flex items-center justify-center gap-1 text-[11px] font-bold text-[#0F766E] group-hover:text-white">
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>{currentLanguage === 'te' ? 'చేర్చండి' : currentLanguage === 'hi' ? 'जोड़ें' : 'Add Profile'}</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* If no profiles exist yet: Primary Student Action Cards */}
        {learners.length === 0 && (
          <div className="space-y-2.5">
            {/* Create Student Profile (Free Classes 1-10 SSC/CBSE, 11-12) */}
            <button
              type="button"
              onClick={() => openAuth('student', 'register')}
              className="w-full bg-white hover:bg-[#F0FDFA] p-4 rounded-2xl border-2 border-[#0F766E]/50 hover:border-[#0F766E] shadow-xs hover:shadow-md transition-all text-left flex items-start gap-3.5 active:scale-98 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#0F172A] group-hover:text-[#0F766E] transition-colors leading-tight">
                    {currentLanguage === 'te' ? 'విద్యార్థి ప్రొఫైల్ సృష్టించండి' : currentLanguage === 'hi' ? 'छात्र प्रोफ़ाइल बनाएं' : 'Create Student Profile'}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                    {currentLanguage === 'te' ? 'ఉచితం' : currentLanguage === 'hi' ? 'निःशुल्क' : 'Free'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] font-medium mt-1 leading-snug">
                  {currentLanguage === 'te'
                    ? '1-10 తరగతులు (SSC & CBSE ఉచితం), 11-12 తరగతులు. సురక్షితమైన 4-అంకెల పిన్.'
                    : currentLanguage === 'hi'
                    ? 'कक्षा 1-10 (SSC और CBSE निःशुल्क), 11-12। सुरक्षित 4-अंकीय पिन।'
                    : 'Classes 1–10 (SSC & CBSE Free), 11–12 Streams. Safe 4-digit PIN.'}
                </p>
              </div>
            </button>

            {/* Direct Student Login (Enter PIN or Login Code) */}
            <button
              type="button"
              onClick={() => openAuth('student', 'login')}
              className="w-full bg-white hover:bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#CBD5E1] hover:border-[#0F766E] shadow-2xs transition-all text-left flex items-center gap-3.5 active:scale-98 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
                  {currentLanguage === 'te' ? 'విద్యార్థి లాగిన్' : currentLanguage === 'hi' ? 'छात्र लॉगिन' : 'Student Login'}
                </h3>
                <p className="text-xs text-[#64748B] font-medium">
                  {currentLanguage === 'te'
                    ? 'స్టూడెంట్ రోల్ నంబర్ / కోడ్ మరియు పిన్ ద్వారా లాగిన్ అవ్వండి'
                    : currentLanguage === 'hi'
                    ? 'छात्र रोल नंबर / कोड एवं पिन से तुरंत लॉगिन करें'
                    : 'Sign in with your Student Roll Number / Code & PIN'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-colors shrink-0" />
            </button>
          </div>
        )}

        {/* Student Code Instant Form */}
        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <form onSubmit={handleDirectCodeLogin} className="flex items-center gap-2">
            <input
              type="text"
              value={studentCodeInput}
              onChange={(e) => {
                setStudentCodeInput(e.target.value.toUpperCase());
                setCodeLoginError(null);
              }}
              placeholder={currentLanguage === 'te' ? 'స్టూడెంట్ కోడ్ (ఉదా: RAVI-10)' : currentLanguage === 'hi' ? 'छात्र कोड (उदा: RAVI-10)' : 'Student Code (e.g. RAVI-10)'}
              className="flex-1 text-sm font-mono font-bold px-3 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0F766E] focus:outline-hidden uppercase"
            />
            <button
              type="submit"
              className="py-2.5 px-4 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
            >
              {currentLanguage === 'te' ? 'ప్రవేశించు' : currentLanguage === 'hi' ? 'प्रवेश करें' : 'Enter'}
            </button>
          </form>
          {codeLoginError && (
            <p className="text-xs text-[#DC2626] font-semibold text-center mt-1.5">
              {codeLoginError}
            </p>
          )}
        </div>

        {/* 4. Section 2: Dedicated Role Gateways (Teacher, Guardian, Institution, Super Admin) */}
        <div className="pt-2 border-t border-[#E2E8F0] space-y-2.5">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#64748B]">
            {currentLanguage === 'te' ? 'ఉపాధ్యాయులు, తల్లిదండ్రులు & సంస్థల పోర్టల్' : currentLanguage === 'hi' ? 'शिक्षक, अभिभावक एवं संस्थान पोर्टल' : 'Staff, Guardian & Institution Access'}
          </div>

          {/* Card 1: Teacher & Guardian Access */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#0F766E] transition-all shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#0F172A] leading-tight">
                  {currentLanguage === 'te' ? 'తల్లిదండ్రులు & ఉపాధ్యాయుల పోర్టల్' : currentLanguage === 'hi' ? 'अभिभावक एवं शिक्षक पोर्टल' : 'Guardian & Teacher Portal'}
                </h4>
                <p className="text-xs text-[#64748B] font-medium mt-0.5 leading-snug">
                  {currentLanguage === 'te'
                    ? 'ఇంటి అభ్యాసం పర్యవేక్షణ, విద్యార్థి పురోగతి, మరియు అసైన్‌మెంట్లు'
                    : currentLanguage === 'hi'
                    ? 'गृह अध्ययन निगरानी, छात्र प्रगति रिपोर्ट एवं शिक्षण सामग्री'
                    : 'Monitor home study progress, weekly digests & classroom materials'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => openAuth('guardian', 'login')}
                    className="py-1.5 px-3 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    {currentLanguage === 'te' ? 'లాగిన్' : currentLanguage === 'hi' ? 'लॉगिन' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('guardian', 'register')}
                    className="py-1.5 px-3 rounded-lg bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] border border-[#CCFBF1] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    {currentLanguage === 'te' ? 'నమోదు' : currentLanguage === 'hi' ? 'पंजीकरण' : 'Register'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreen('PARENT_VIEW')}
                    className="ml-auto text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t.parentViewTitle}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Institution & School Administration */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#0F766E] transition-all shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#0F172A] leading-tight">
                  {currentLanguage === 'te' ? 'పాఠశాల & కళాశాల సంస్థ పోర్టల్' : currentLanguage === 'hi' ? 'संस्थान एवं विद्यालय प्रशासन' : 'Institution & School Admin'}
                </h4>
                <p className="text-xs text-[#64748B] font-medium mt-0.5 leading-snug">
                  {currentLanguage === 'te'
                    ? '1-10 తరగతులు ఉచితం (SSC/CBSE), పై తరగతులకు కోర్సులు & విద్యా ప్రణాళిక'
                    : currentLanguage === 'hi'
                    ? 'कक्षा 1-10 निःशुल्क, उच्च कक्षाओं के लिए पाठ्यक्रम कैटलॉग एवं नियम'
                    : 'Setup classes 1-10 free, dynamic paid courses & syllabus catalogue'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => openAuth('admin', 'login')}
                    className="py-1.5 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    {currentLanguage === 'te' ? 'సంస్థ లాగిన్' : currentLanguage === 'hi' ? 'संस्थान लॉगिन' : 'Institution Login'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('admin', 'register')}
                    className="py-1.5 px-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#2563EB] border border-[#CBD5E1] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    {currentLanguage === 'te' ? 'సంస్థ నమోదు' : currentLanguage === 'hi' ? 'संस्थान पंजीकरण' : 'Register School'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Platform Super Administrator Panel */}
          <div className="bg-linear-to-r from-[#FFFBEB] to-[#FEF3C7]/40 p-3 rounded-xl border border-[#FDE68A] transition-all flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#D97706] text-white flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs text-[#92400E] leading-tight">
                  {currentLanguage === 'te' ? 'సూపర్ అడ్మిన్ ప్యానెల్' : currentLanguage === 'hi' ? 'सुपर एडमिन पैनल' : 'Platform Super Admin'}
                </div>
                <div className="text-[11px] text-[#B45309] font-medium truncate">
                  admin@vidyapath.edu • Master Platform Oversight
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAuth('admin', 'login')}
              className="py-1.5 px-3 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
            >
              {currentLanguage === 'te' ? 'ప్రవేశం' : currentLanguage === 'hi' ? 'लॉगिन' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Clean Footer with App Version, APK Update Action & Privacy Note */}
      <footer className="pt-3 border-t border-[#E2E8F0] flex flex-col items-center text-center gap-2">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#0F766E]">
          <button
            type="button"
            onClick={openModal}
            className="hover:underline inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-[#FEF3C7] text-[#D97706] transition-colors"
            title="Check for App Updates & APK Downloads"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{hasUpdate ? `Update Available (v${currentVersion})` : `App Version: v${currentVersion}`}</span>
          </button>
        </div>

        <p className="text-[11px] text-[#64748B] font-medium flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>{t.zeroPiiNotice}</span>
        </p>
      </footer>

      {/* Unified Multi-Role Auth Modal */}
      <UnifiedAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authModalRole}
        initialMode={authModalMode}
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
