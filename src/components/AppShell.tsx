import React, { useState } from 'react';
import {
  Menu,
  X,
  BookOpen,
  HelpCircle,
  Target,
  TrendingUp,
  ShieldCheck,
  Users,
  Wifi,
  WifiOff,
  Globe,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useApp, ScreenId } from '../context/AppContext';
import { StudentAvatar } from './StudentAvatar';
import { VidyapathLogo } from './VidyapathLogo';
import { getTranslations, SupportedLang } from '../utils/translations';
import { SCHEDULED_LANGUAGES } from '../config/languages';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    activeLearner,
    currentScreen,
    setScreen,
    switchLearner,
    isOffline,
    simulatedOffline,
    toggleSimulatedOffline,
    currentLanguage,
    switchLanguage,
    triggerSync,
  } = useApp();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const t = getTranslations(currentLanguage);

  // Map ScreenId to Title
  const getScreenTitle = (screen: ScreenId) => {
    switch (screen) {
      case 'MY_SYLLABUS':
      case 'LESSON_DETAIL':
      case 'S3_HOME':
      case 'S4_LESSON':
        return t.navMySyllabus;
      case 'AI_TUTOR':
      case 'S7_DOUBT':
        return t.navAiTutor;
      case 'PRACTICE':
      case 'S5_PRACTICE':
        return t.navPractice;
      case 'PROGRESS':
      case 'S8_PROGRESS':
        return t.navProgress;
      case 'PARENT_VIEW':
      case 'S10_GUARDIAN':
        return t.navParentView;
      case 'ADMIN':
      case 'ADMIN_PANEL':
      case 'S12_PACK_EDITOR':
        return t.adminPortal;
      default:
        return t.appTitle;
    }
  };

  const navItems: { id: ScreenId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'MY_SYLLABUS',
      label: t.navMySyllabus,
      icon: <BookOpen className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'AI_TUTOR',
      label: t.navAiTutor,
      icon: <HelpCircle className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'PRACTICE',
      label: t.navPractice,
      icon: <Target className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'PROGRESS',
      label: t.navProgress,
      icon: <TrendingUp className="w-5 h-5 shrink-0" />,
    },
  ];

  const handleNavClick = (screen: ScreenId) => {
    setScreen(screen);
    setMobileDrawerOpen(false);
  };

  const handleSwitchProfile = () => {
    setMobileDrawerOpen(false);
    switchLearner();
  };

  // Check if item is active
  const isItemActive = (id: ScreenId) => {
    if (id === 'MY_SYLLABUS') {
      return (
        currentScreen === 'MY_SYLLABUS' ||
        currentScreen === 'LESSON_DETAIL' ||
        currentScreen === 'S3_HOME' ||
        currentScreen === 'S4_LESSON'
      );
    }
    if (id === 'AI_TUTOR') {
      return currentScreen === 'AI_TUTOR' || currentScreen === 'S7_DOUBT';
    }
    if (id === 'PRACTICE') {
      return currentScreen === 'PRACTICE' || currentScreen === 'S5_PRACTICE';
    }
    if (id === 'PROGRESS') {
      return currentScreen === 'PROGRESS' || currentScreen === 'S8_PROGRESS';
    }
    if (id === 'PARENT_VIEW') {
      return currentScreen === 'PARENT_VIEW' || currentScreen === 'S10_GUARDIAN';
    }
    if (id === 'ADMIN') {
      return currentScreen === 'ADMIN' || currentScreen === 'ADMIN_PANEL' || currentScreen === 'S12_PACK_EDITOR';
    }
    return currentScreen === id;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#E2E8F0] p-4 text-[#0F172A] justify-between">
      {/* Top: Brand & Active Student Profile */}
      <div>
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0] mb-4">
          <VidyapathLogo size="sm" showWordmark={false} />
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-[#0F172A] leading-tight">
              {t.appTitle}
            </h1>
            <p className="text-[11px] text-[#475569] font-medium leading-none truncate max-w-[150px]">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Active Student Header Card */}
        {activeLearner && (
          <div className="bg-[#F0FDFA] p-3 rounded-[12px] border border-[#E2E8F0] mb-4 flex items-center gap-3">
            <StudentAvatar learner={activeLearner} size="md" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-base text-[#0F172A] truncate">
                {activeLearner.nickname}
              </div>
              <div className="text-sm text-[#0F766E] font-semibold mt-0.5">
                {activeLearner.classGrade
                  ? `${activeLearner.classGrade} ${t.classText}`
                  : `10 ${t.classText}`}
              </div>
            </div>
          </div>
        )}

        {/* Core Nav Items 1-4 */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = isItemActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-base font-semibold transition-all min-h-[48px] text-left ${
                  active
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <span className={active ? 'text-white' : 'text-[#0F766E]'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Visual Divider */}
          <div className="border-t border-[#E2E8F0] my-2 pt-1" />

          {/* 5. Parent / Teacher View */}
          <button
            type="button"
            onClick={() => handleNavClick('PARENT_VIEW')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-base font-semibold transition-all min-h-[48px] text-left ${
              isItemActive('PARENT_VIEW')
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <span
              className={
                isItemActive('PARENT_VIEW') ? 'text-white' : 'text-[#16A34A]'
              }
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
            </span>
            <span className="truncate">{t.navParentView}</span>
          </button>

          {/* 6. Admin & Teacher Portal */}
          <button
            type="button"
            onClick={() => handleNavClick('ADMIN')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-base font-semibold transition-all min-h-[48px] text-left ${
              isItemActive('ADMIN')
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
          >
            <span
              className={
                isItemActive('ADMIN') ? 'text-white' : 'text-[#0F766E]'
              }
            >
              <Lock className="w-5 h-5 shrink-0" />
            </span>
            <span className="truncate">{t.adminPortal}</span>
          </button>
        </nav>
      </div>

      {/* Bottom: Settings, Offline Demo Toggle, Language & Switch Profile */}
      <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
        {/* Language Switcher Dropdown (Telugu, Hindi, English) */}
        <div className="flex items-center justify-between bg-[#F8FAFC] p-2.5 rounded-[12px] border border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#475569] shrink-0">
            <Globe className="w-4 h-4 text-[#0F766E]" />
            <span>{t.languageLabel}</span>
          </div>
          <select
            value={currentLanguage}
            onChange={(e) => switchLanguage(e.target.value as SupportedLang)}
            className="text-sm bg-white text-[#0F172A] font-bold px-2 py-1.5 rounded-md border border-[#E2E8F0] focus:outline-hidden cursor-pointer max-w-[130px] truncate min-h-[38px]"
            title="Select Language (Telugu, Hindi, English)"
          >
            {SCHEDULED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        {/* Demo Offline Mode Toggle Switch for Presentation */}
        <button
          type="button"
          onClick={toggleSimulatedOffline}
          title="Toggle Simulated Offline Mode for Live Testing"
          className={`w-full flex items-center justify-between p-2.5 rounded-[12px] border text-sm font-bold transition-all min-h-[48px] ${
            isOffline
              ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:border-[#0F766E]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-[#D97706]" />
            ) : (
              <Wifi className="w-4 h-4 text-[#16A34A]" />
            )}
            <span>{t.simulateOffline}</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isOffline
                ? 'bg-[#D97706] text-white'
                : 'bg-[#DCFCE7] text-[#16A34A]'
            }`}
          >
            {isOffline ? 'OFF' : 'ON'}
          </span>
        </button>

        {/* Manual Honest Cloud Sync */}
        {!isOffline && (
          <button
            type="button"
            onClick={() => triggerSync()}
            title="Sync offline progress with cloud"
            className="w-full flex items-center justify-between p-2.5 rounded-[12px] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#0F766E]/30 text-sm font-bold text-[#0F766E] transition-all min-h-[48px]"
          >
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-[#0F766E]" />
              <span>{currentLanguage === 'te' ? 'ఇప్పుడే సింక్ చేయి' : currentLanguage === 'hi' ? 'अभी सिंक करें' : 'Sync Progress'}</span>
            </div>
            <span className="text-xs bg-[#0F766E] text-white px-2 py-0.5 rounded-md">
              {currentLanguage === 'te' ? 'సింక్' : currentLanguage === 'hi' ? 'सिंक' : 'Sync'}
            </span>
          </button>
        )}

        {/* Switch Profile (Pinned at bottom) */}
        <button
          type="button"
          onClick={handleSwitchProfile}
          className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-[12px] bg-[#F8FAFC] hover:bg-[#F0FDFA] border border-[#E2E8F0] hover:border-[#0F766E] text-sm font-bold text-[#0F172A] active:scale-98 transition-all min-h-[48px]"
        >
          <Users className="w-4 h-4 text-[#0F766E]" />
          <span>{t.navSwitchProfile}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-[#0F172A]">
      {/* Desktop / Tablet Persistent Left Sidebar (260px) */}
      <aside className="hidden md:block w-[260px] h-screen sticky top-0 shrink-0 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header (< 768px) */}
      <header className="md:hidden sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between shadow-xs">
        {/* Left: Large Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open Navigation Menu"
          className="w-12 h-12 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] active:scale-95 hover:border-[#0F766E] transition-all"
        >
          <Menu className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Center: Current Page Title */}
        <div className="flex-1 text-center px-2">
          <h2 className="font-extrabold text-base text-[#0F172A] truncate">
            {getScreenTitle(currentScreen)}
          </h2>
        </div>

        {/* Right: Compact Connection / Sync Status Pill */}
        <div className="flex items-center">
          {isOffline ? (
            <div
              onClick={toggleSimulatedOffline}
              title="Offline Mode - Saved on Phone"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FEF3C7] border border-[#D97706]/40 text-[#92400E] text-xs font-bold rounded-full cursor-pointer active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
              <span className="text-[11px] font-bold truncate max-w-[110px]">
                {t.offlineSaved}
              </span>
            </div>
          ) : (
            <div
              onClick={toggleSimulatedOffline}
              title="Online Connected"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DCFCE7] border border-[#16A34A]/40 text-[#16A34A] text-xs font-bold rounded-full cursor-pointer active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span className="text-[11px] font-bold">{t.online}</span>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Slide-out Drawer (< 768px) with Backdrop */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 animate-fadeIn">
          {/* Backdrop overlay */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-[280px] max-w-[85vw] h-full bg-[#FFFFFF] shadow-2xl z-50 transform transition-transform animate-slideRight">
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-12 h-12 min-w-12 min-h-12 rounded-lg text-[#475569] hover:text-[#0F172A] flex items-center justify-center hover:bg-[#F8FAFC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area beside Sidebar */}
      <main className="flex-1 min-w-0 max-w-4xl mx-auto w-full p-4 md:p-6 pb-12">
        {children}
      </main>
    </div>
  );
};
