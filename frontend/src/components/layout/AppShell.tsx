import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp, ScreenId } from '../../context/AppContext';
import { LanguageSelector } from '../LanguageSelector';
import { VidyapathLogo } from '../VidyapathLogo';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const {
    currentScreen,
    setScreen,
    activeLearner,
    switchProfile,
    isOffline,
    lowDataMode,
    toggleLowDataMode,
    t,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A] font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between shadow-sm">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2">
            <VidyapathLogo className="w-8 h-8 rounded-lg shadow-sm" />
            <div>
              <span className="font-extrabold text-base md:text-lg text-[#0F766E] tracking-tight">Vidyapath</span>
              <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 bg-[#CCFBF1] text-[#0F766E] rounded-md hidden sm:inline-block">
                విద్యాపథ్
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Student Profile */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Online/Offline Status Pill */}
          <div
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isOffline
                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
                : 'bg-[#F0FDF4] border-[#86EFAC] text-[#16A34A]'
            }`}
            title={isOffline ? 'Offline mode active - local caching enabled' : 'Connected to Vidyapath network'}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOffline ? t.offlineMode || 'Offline' : t.online || 'Online'}</span>
          </div>

          {/* Low Data Mode Toggle */}
          <button
            type="button"
            onClick={toggleLowDataMode}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1 transition-colors ${
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

          {/* Active Student Pill */}
          {activeLearner && (
            <div className="flex items-center space-x-2 bg-[#F1F5F9] border border-[#CBD5E1] pl-1.5 pr-3 py-1 rounded-full text-xs font-semibold">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-xs"
                style={{ backgroundColor: activeLearner.avatarColor || '#0F766E' }}
              >
                {activeLearner.avatarEmoji || '👦'}
              </span>
              <span className="text-[#1E293B] max-w-[90px] truncate">{activeLearner.nickname}</span>
              <span className="text-[#64748B] text-[10px] hidden md:inline">Class {activeLearner.classGrade || 10}</span>
            </div>
          )}

          {/* Switch Profile Button */}
          <button
            type="button"
            onClick={switchProfile}
            className="p-1.5 md:px-2.5 md:py-1 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] flex items-center space-x-1 transition-colors"
            title={t.navSwitchProfile || 'Switch Profile'}
          >
            <LogOut className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="hidden md:inline">{t.navSwitchProfile || 'Switch'}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E2E8F0] p-3 justify-between shrink-0">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0F766E] text-white shadow-sm shadow-teal-700/20'
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

          {/* Pinned Bottom Sidebar: Switch Profile */}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <button
              type="button"
              onClick={switchProfile}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors"
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

            {/* Menu Panel */}
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-4 flex flex-col justify-between z-10">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center space-x-2">
                    <VidyapathLogo className="w-7 h-7 rounded-lg" />
                    <span className="font-extrabold text-[#0F766E]">Vidyapath</span>
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
                  <div className="flex items-center space-x-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 shadow-xs"
                      style={{ backgroundColor: activeLearner.avatarColor || '#0F766E' }}
                    >
                      {activeLearner.avatarEmoji || '👦'}
                    </span>
                    <div className="truncate">
                      <p className="text-sm font-bold text-[#0F172A] truncate">{activeLearner.nickname}</p>
                      <p className="text-xs text-[#64748B]">Class {activeLearner.classGrade || 10}</p>
                    </div>
                  </div>
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold ${
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

              {/* Drawer Bottom: Switch Profile */}
              <div className="pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    switchProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.navSwitchProfile || 'Switch Profile'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 focus:outline-none">
          <div className="max-w-6xl mx-auto p-3 sm:p-5 md:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (360px Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors ${
                isActive ? 'text-[#0F766E] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 max-w-[64px] truncate leading-tight">
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
    </div>
  );
};
