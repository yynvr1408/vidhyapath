import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Award,
  BarChart2,
  Users,
  LogOut,
  Wifi,
  WifiOff,
  Menu,
  X,
  Zap,
  Lock,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { useApp, ScreenId } from '../../context/AppContext';
import { LanguageSelector } from '../LanguageSelector';
import { VidyapathLogo } from '../VidyapathLogo';
import type { LearnerProfile } from '../../types';

interface AppShellProps {
  children: React.ReactNode;
}

const HUMAN_AVATARS = [
  { emoji: '👦', color: '#0F766E' },
  { emoji: '👧', color: '#7C3AED' },
  { emoji: '👨‍🎓', color: '#2563EB' },
  { emoji: '👩‍🎓', color: '#EA580C' },
  { emoji: '🧑‍🎓', color: '#059669' },
  { emoji: '🧒', color: '#D97706' },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    currentScreen,
    setScreen,
    activeLearner,
    learners,
    switchLearner,
    unlockLearnerWithPin,
    createLearner,
    isOffline,
    lowDataMode,
    toggleLowDataMode,
    t,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // In-Place Switch Profile Modal State
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'list' | 'pin' | 'create'>('list');
  const [targetLearner, setTargetLearner] = useState<LearnerProfile | null>(null);
  const [switchPinInput, setSwitchPinInput] = useState('');
  const [switchPinError, setSwitchPinError] = useState('');

  // Sibling profile creation inside modal
  const [newNickname, setNewNickname] = useState('');
  const [newAvatarEmoji, setNewAvatarEmoji] = useState(HUMAN_AVATARS[0].emoji);
  const [newAvatarColor, setNewAvatarColor] = useState(HUMAN_AVATARS[0].color);
  const [newClassGrade, setNewClassGrade] = useState<number>(10);
  const [newPin, setNewPin] = useState('');
  const [createError, setCreateError] = useState('');

  const openSwitchModal = () => {
    setModalStep('list');
    setTargetLearner(null);
    setSwitchPinInput('');
    setSwitchPinError('');
    setIsSwitchModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleSelectTarget = (learner: LearnerProfile) => {
    if (activeLearner && learner.id === activeLearner.id) {
      setIsSwitchModalOpen(false);
      return;
    }
    setTargetLearner(learner);
    setSwitchPinInput('');
    setSwitchPinError('');
    setModalStep('pin');
  };

  const handlePinDigit = (digit: string) => {
    if (!targetLearner || switchPinInput.length >= 4) return;
    const next = switchPinInput + digit;
    setSwitchPinInput(next);
    setSwitchPinError('');

    if (next.length === 4) {
      setTimeout(() => {
        const success = unlockLearnerWithPin(targetLearner.id, next);
        if (success) {
          switchLearner(targetLearner);
          setIsSwitchModalOpen(false);
          setTargetLearner(null);
          setSwitchPinInput('');
        } else {
          setSwitchPinError(t.incorrectPin || 'Incorrect 4-digit code. Please try again.');
          setSwitchPinInput('');
        }
      }, 100);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) {
      setCreateError('Please enter a student name.');
      return;
    }
    const created = await createLearner({
      nickname: newNickname.trim(),
      avatarEmoji: newAvatarEmoji,
      avatarColor: newAvatarColor,
      classGrade: newClassGrade,
      pin: newPin.trim() || '1234',
      loginCode: `${newNickname.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'STUDENT'}-${newClassGrade}`,
    });
    switchLearner(created);
    setIsSwitchModalOpen(false);
    setNewNickname('');
    setNewPin('');
  };

  const navItems: { id: ScreenId; label: string; icon: React.ElementType; badge?: string }[] = [
    {
      id: 'MY_SYLLABUS',
      label: t.navMySyllabus || 'My Syllabus (Learn)',
      icon: BookOpen,
    },
    {
      id: 'AI_TUTOR',
      label: t.navAiTutor || 'AI Tutor (Ask Doubt)',
      icon: Sparkles,
      badge: 'AI',
    },
    {
      id: 'PRACTICE',
      label: t.navPractice || 'Practice & Weak Topics',
      icon: Award,
    },
    {
      id: 'PROGRESS',
      label: t.navProgress || 'My Progress',
      icon: BarChart2,
    },
    {
      id: 'PARENT_VIEW',
      label: t.navParentView || 'Parent / Teacher View',
      icon: Users,
    },
  ];

  const handleNavClick = (screen: ScreenId) => {
    setScreen(screen);
    setMobileMenuOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A] font-sans max-w-[100vw] overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-xs">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2">
            <VidyapathLogo className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-xs" />
            <div>
              <span className="font-extrabold text-sm sm:text-base md:text-lg text-[#0F766E] tracking-tight">Vidyapath</span>
              <span className="ml-1.5 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 bg-[#CCFBF1] text-[#0F766E] rounded-md hidden xs:inline-block">
                విద్యాపథ్
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Student Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
          {/* Online/Offline Status Pill */}
          <div
            className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold border ${
              isOffline
                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
                : 'bg-[#F0FDF4] border-[#86EFAC] text-[#16A34A]'
            }`}
            title={isOffline ? 'Offline mode active - local caching enabled' : 'Connected to Vidyapath network'}
          >
            {isOffline ? <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            <span className="hidden sm:inline">{isOffline ? t.offlineMode || 'Offline' : t.online || 'Online'}</span>
          </div>

          {/* Low Data Mode Toggle */}
          <button
            type="button"
            onClick={toggleLowDataMode}
            className={`p-1 sm:p-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1 transition-colors ${
              lowDataMode
                ? 'bg-[#FEF3C7] border-[#FCD34D] text-[#D97706]'
                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
            }`}
            title="Toggle Low Data Mode"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{lowDataMode ? 'Low Data: ON' : 'Data Saver'}</span>
          </button>

          {/* Compact Language Selector */}
          <LanguageSelector variant="compact" />

          {/* Active Student Pill (Clickable -> Opens In-Place Switch Modal) */}
          {activeLearner && (
            <button
              type="button"
              onClick={openSwitchModal}
              className="flex items-center space-x-1.5 sm:space-x-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] pl-1 sm:pl-1.5 pr-2 sm:pr-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              title="Click to Switch Profile"
            >
              <span
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm shadow-xs shrink-0"
                style={{ backgroundColor: activeLearner.avatarColor || '#0F766E' }}
              >
                {activeLearner.avatarEmoji || '👦'}
              </span>
              <span className="text-[#1E293B] max-w-[65px] sm:max-w-[90px] truncate">{activeLearner.nickname}</span>
              <span className="text-[#64748B] text-[10px] hidden md:inline">Class {activeLearner.classGrade || 10}</span>
            </button>
          )}

          {/* Dedicated Switch Profile Header Button */}
          <button
            type="button"
            onClick={openSwitchModal}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] flex items-center space-x-1 transition-colors cursor-pointer"
            title={t.navSwitchProfile || 'Switch Profile'}
          >
            <LogOut className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="hidden sm:inline">{t.navSwitchProfile || 'Switch'}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-72 bg-white border-r border-[#E2E8F0] p-3 justify-between shrink-0 overflow-y-auto overflow-x-hidden">
          <nav className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-[#94A3B8] uppercase">
              Class 10 Learning Grid
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#0F766E] text-white shadow-xs shadow-teal-700/20'
                      : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#0F766E]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#CCFBF1] text-[#0F766E]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Pinned Bottom Sidebar: Switch Profile (In-Place Modal) */}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <button
              type="button"
              onClick={openSwitchModal}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{t.navSwitchProfile || 'Switch Profile'}</span>
            </button>
            <p className="text-[11px] text-center text-[#94A3B8]">
              Zero-PII Local Student Session
            </p>
          </div>
        </aside>

        {/* Mobile Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-4 flex flex-col justify-between z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center space-x-2">
                    <VidyapathLogo className="w-7 h-7 rounded-lg" />
                    <span className="font-bold text-base text-[#0F766E]">Vidyapath</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {activeLearner && (
                  <button
                    type="button"
                    onClick={openSwitchModal}
                    className="w-full text-left flex items-center space-x-3 p-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 shadow-xs"
                      style={{ backgroundColor: activeLearner.avatarColor || '#0F766E' }}
                    >
                      {activeLearner.avatarEmoji || '👦'}
                    </span>
                    <div className="truncate flex-1">
                      <p className="text-sm font-bold text-[#0F172A] truncate">{activeLearner.nickname}</p>
                      <p className="text-xs text-[#64748B]">Class {activeLearner.classGrade || 10}</p>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Switch
                    </span>
                  </button>
                )}

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#0F766E] text-white shadow-xs'
                            : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#0F766E]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isActive ? 'bg-white/20 text-white' : 'bg-[#CCFBF1] text-[#0F766E]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Bottom: In-Place Switch Profile */}
              <div className="pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={openSwitchModal}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.navSwitchProfile || 'Switch Profile'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Pane */}
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-28 sm:pb-24 md:pb-8 focus:outline-none w-full">
          <div className="max-w-6xl mx-auto p-2.5 sm:p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (360px Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] px-1 sm:px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-[#0F766E] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 max-w-[62px] truncate leading-tight">
                {item.id === 'MY_SYLLABUS'
                  ? 'Syllabus'
                  : item.id === 'AI_TUTOR'
                  ? 'AI Tutor'
                  : item.id === 'PRACTICE'
                  ? 'Practice'
                  : item.id === 'PROGRESS'
                  ? 'Progress'
                  : 'Report'}
              </span>
            </button>
          );
        })}
      </nav>

      {/* IN-PLACE SWITCH PROFILE MODAL (DOES NOT REDIRECT TO LANDING) */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl w-[92vw] max-w-md mx-auto p-4 sm:p-5 max-h-[90dvh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            {/* Step 1: Profile List View */}
            {modalStep === 'list' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t.navSwitchProfile || 'Switch Student Profile'}</h3>
                    <p className="text-xs text-slate-500">Select who is studying right now</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSwitchModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {learners.map((learner) => {
                    const isActive = activeLearner?.id === learner.id;
                    return (
                      <button
                        key={learner.id}
                        type="button"
                        onClick={() => handleSelectTarget(learner)}
                        className={`p-3.5 rounded-xl border text-left flex flex-col items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                          isActive
                            ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-teal-400 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-xs"
                          style={{ backgroundColor: learner.avatarColor || '#0F766E' }}
                        >
                          {learner.avatarEmoji || '👦'}
                        </div>
                        <div className="text-center w-full">
                          <p className="text-xs font-bold text-slate-900 truncate">{learner.nickname}</p>
                          <p className="text-[10px] text-slate-500">Class {learner.classGrade || 10}</p>
                        </div>
                        {isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white shadow-xs">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> PIN
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setModalStep('create');
                      setCreateError('');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-teal-600" />
                    <span>{t.addNewLearner || '+ New Student'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: In-Modal 4-Digit PIN Pad */}
            {modalStep === 'pin' && targetLearner && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalStep('list')}
                    className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to profiles
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSwitchModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center space-y-1.5">
                  <div
                    className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-3xl shadow-xs"
                    style={{ backgroundColor: targetLearner.avatarColor || '#0F766E' }}
                  >
                    {targetLearner.avatarEmoji || '👦'}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{targetLearner.nickname}</h4>
                  <p className="text-xs text-slate-500">Enter 4-digit code to switch profile</p>
                </div>

                {/* Masked PIN display */}
                <div className="flex justify-center gap-2.5 sm:gap-3 my-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const digit = switchPinInput[idx];
                    return (
                      <div
                        key={idx}
                        className={`w-10 h-11 sm:w-11 sm:h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${
                          digit
                            ? 'border-teal-600 bg-teal-50 text-teal-900'
                            : 'border-slate-200 bg-slate-50 text-slate-400'
                        }`}
                      >
                        {digit ? '•' : ''}
                      </div>
                    );
                  })}
                </div>

                {switchPinError && (
                  <p className="text-xs font-medium text-rose-600 text-center">{switchPinError}</p>
                )}

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePinDigit(num)}
                      className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-base font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSwitchPinInput('');
                      setSwitchPinError('');
                    }}
                    className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinDigit('0')}
                    className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-base font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => setSwitchPinInput((prev) => prev.slice(0, -1))}
                    className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    ⌫
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-400">
                  Default PIN: <span className="font-semibold text-slate-600">1234</span>
                </p>
              </div>
            )}

            {/* Step 3: Sibling / New Student Creation */}
            {modalStep === 'create' && (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalStep('list')}
                    className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSwitchModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-bold text-slate-900">{t.addNewLearner || 'Create New Student Profile'}</h4>
                  <p className="text-xs text-slate-500">Zero-PII • Saved locally on this phone</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student Name</label>
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      placeholder="e.g. Sumanth"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Choose Avatar</label>
                    <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                      {HUMAN_AVATARS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewAvatarEmoji(av.emoji);
                            setNewAvatarColor(av.color);
                          }}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg transition-transform cursor-pointer ${
                            newAvatarEmoji === av.emoji ? 'ring-2 ring-teal-500 scale-110' : 'opacity-80'
                          }`}
                          style={{ backgroundColor: av.color }}
                        >
                          {av.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
                    <select
                      value={newClassGrade}
                      onChange={(e) => setNewClassGrade(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      <option value={10}>Class 10 (State Board & CBSE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4-Digit PIN <span className="text-slate-400 font-normal">(optional, default 1234)</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {createError && (
                    <p className="text-xs text-rose-600 font-medium">{createError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    {t.saveProfile || 'Save & Start Learning'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
