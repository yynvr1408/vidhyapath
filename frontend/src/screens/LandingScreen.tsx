import React, { useState } from 'react';
import { Plus, Lock, KeyRound, ArrowRight, UserPlus, X, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnerProfile } from '../types';
import { LanguageSelector } from '../components/LanguageSelector';
import { VidyapathLogo } from '../components/VidyapathLogo';

const HUMAN_AVATAR_PRESETS = [
  { emoji: '👦', color: '#0F766E', label: 'Boy' },
  { emoji: '👧', color: '#7C3AED', label: 'Girl' },
  { emoji: '👨‍🎓', color: '#2563EB', label: 'Scholar (M)' },
  { emoji: '👩‍🎓', color: '#EA580C', label: 'Scholar (F)' },
  { emoji: '🧑‍🎓', color: '#059669', label: 'Student' },
  { emoji: '🧒', color: '#D97706', label: 'Learner' },
];

export const LandingScreen: React.FC = () => {
  const {
    learners,
    unlockLearnerWithPin,
    createLearner,
    isOffline,
    t,
  } = useApp();

  // PIN Unlock Modal State
  const [selectedLearner, setSelectedLearner] = useState<LearnerProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Create Profile Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newAvatarEmoji, setNewAvatarEmoji] = useState(HUMAN_AVATAR_PRESETS[0].emoji);
  const [newAvatarColor, setNewAvatarColor] = useState(HUMAN_AVATAR_PRESETS[0].color);
  const [newClassGrade, setNewClassGrade] = useState<number>(10);
  const [newPin, setNewPin] = useState('');
  const [createError, setCreateError] = useState('');

  const handleCardClick = (learner: LearnerProfile) => {
    setSelectedLearner(learner);
    setPinInput('');
    setPinError('');
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedLearner) return;

    if (pinInput.trim().length === 0) {
      setPinError('Please enter your 4-digit PIN code.');
      return;
    }

    const success = unlockLearnerWithPin(selectedLearner.id, pinInput.trim());
    if (!success) {
      setPinError(t.incorrectPin || 'Incorrect 4-digit code. Please try again.');
      setPinInput('');
    } else {
      setSelectedLearner(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    const trimmedName = newNickname.trim();
    if (!trimmedName) {
      setCreateError('Please enter the student name.');
      return;
    }

    const cleanPin = newPin.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setCreateError('Please enter a valid 4-digit PIN code (e.g. 1234).');
      return;
    }

    try {
      await createLearner({
        nickname: trimmedName,
        classGrade: newClassGrade,
        avatarEmoji: newAvatarEmoji,
        avatarColor: newAvatarColor,
        pin: cleanPin,
        loginCode: `${trimmedName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5)}-${newClassGrade}`,
      });
      setIsCreateModalOpen(false);
      setNewNickname('');
      setNewPin('');
    } catch (err: any) {
      setCreateError(err?.message || 'Could not create profile.');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F0FDFA] via-[#F8FAFC] to-[#F1F5F9] flex flex-col justify-between font-sans">
      {/* Top Header: Pure Brand & Controls */}
      <header className="px-4 md:px-8 py-3.5 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
        <div className="flex items-center space-x-2.5">
          <VidyapathLogo className="w-9 h-9 rounded-xl shadow-xs" />
          <div>
            <h1 className="font-extrabold text-lg md:text-xl text-[#0F766E] tracking-tight flex items-center space-x-1.5">
              <span>Vidyapath</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-[#CCFBF1] text-[#0F766E] rounded-md hidden sm:inline-block">
                విద్యాపథ్ · विद्यापथ
              </span>
            </h1>
            <p className="text-[11px] text-[#64748B] font-medium hidden sm:block">
              {t.tagline || 'The Last-Mile Vernacular Tutor'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Online/Offline status pill */}
          <div
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isOffline
                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
                : 'bg-[#F0FDF4] border-[#86EFAC] text-[#16A34A]'
            }`}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOffline ? t.offlineMode || 'Offline' : t.online || 'Online'}</span>
          </div>

          {/* Compact Language Selector */}
          <LanguageSelector variant="compact" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12 max-w-4xl mx-auto w-full">
        {/* Title & Prompt */}
        <div className="text-center max-w-xl mb-8 md:mb-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-bold mb-3 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Class 10 State SSC & CBSE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            {t.whoIsLearning || 'Who is learning today?'}
          </h2>
          <p className="text-sm md:text-base text-[#64748B] mt-2 font-medium">
            {t.selectProfileSubtitle || 'Select your student profile and enter your 4-digit code to start.'}
          </p>
        </div>

        {/* Student Profiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl">
          {learners.map((learner) => (
            <button
              key={learner.id}
              type="button"
              onClick={() => handleCardClick(learner)}
              className="group relative flex flex-col items-center p-5 bg-white rounded-2xl border-2 border-[#E2E8F0] hover:border-[#0F766E] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mb-3.5 shadow-sm group-hover:scale-105 transition-transform"
                style={{ backgroundColor: learner.avatarColor || '#0F766E' }}
              >
                {learner.avatarEmoji || '👦'}
              </div>

              <h3 className="font-bold text-base sm:text-lg text-[#0F172A] group-hover:text-[#0F766E] transition-colors truncate max-w-full">
                {learner.nickname}
              </h3>

              <div className="mt-1 flex items-center space-x-1 text-xs text-[#64748B] font-medium">
                <span>Class {learner.classGrade || 10}</span>
                <span>•</span>
                <span className="flex items-center text-[#0F766E]">
                  <Lock className="w-3 h-3 mr-0.5" /> PIN
                </span>
              </div>

              <div className="mt-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] group-hover:bg-[#CCFBF1] group-hover:text-[#0F766E] transition-colors">
                {t.tapToEnter || 'Enter'} →
              </div>
            </button>
          ))}

          {/* Create New Profile Button / Card */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-center justify-center p-5 bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] hover:bg-[#F0FDFA] rounded-2xl text-center transition-all group focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#E2E8F0] group-hover:bg-[#CCFBF1] flex items-center justify-center text-[#64748B] group-hover:text-[#0F766E] mb-3.5 transition-colors">
              <Plus className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="font-bold text-sm sm:text-base text-[#475569] group-hover:text-[#0F766E] transition-colors">
              {t.addNewLearner || 'New Student'}
            </h3>

            <span className="mt-1 text-xs text-[#94A3B8] font-medium">
              Create Profile
            </span>
          </button>
        </div>
      </main>

      {/* Footer: Zero PII Notice */}
      <footer className="py-4 text-center text-xs text-[#94A3B8] border-t border-[#E2E8F0] bg-white/50">
        <p>🔒 Vidyapath Zero-PII Offline First Architecture • No Email, Phone or Password Required</p>
      </footer>

      {/* 4-Digit PIN Unlock Modal */}
      {selectedLearner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedLearner(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-3"
                style={{ backgroundColor: selectedLearner.avatarColor || '#0F766E' }}
              >
                {selectedLearner.avatarEmoji || '👦'}
              </div>

              <h3 className="text-xl font-extrabold text-[#0F172A]">{selectedLearner.nickname}</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Class {selectedLearner.classGrade || 10} Student</p>

              <form onSubmit={handlePinSubmit} className="w-full mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                    {t.enterPinPrompt || 'Enter 4-Digit PIN Code'}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      autoFocus
                      value={pinInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPinInput(val);
                        setPinError('');
                      }}
                      placeholder="• • • •"
                      className="w-full pl-11 pr-4 py-3 text-center text-2xl tracking-[0.5em] font-extrabold rounded-xl border-2 border-[#CBD5E1] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                    />
                  </div>
                  {pinError && (
                    <p className="text-xs font-semibold text-[#DC2626] mt-2">{pinError}</p>
                  )}
                  <p className="text-[11px] text-[#94A3B8] mt-2">
                    Default code is <code className="bg-[#F1F5F9] px-1 py-0.5 rounded font-mono text-[#0F766E]">1234</code>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={pinInput.length === 0}
                  className="w-full py-3 bg-[#0F766E] hover:bg-[#0D6962] disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
                >
                  <span>{t.unlockProfileBtn || 'Unlock Profile'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create New Profile Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[#E2E8F0] relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-[#E2E8F0]">
              <div className="p-2 rounded-xl bg-[#CCFBF1] text-[#0F766E]">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0F172A]">
                  {t.addNewLearner || 'Create New Student Profile'}
                </h3>
                <p className="text-xs text-[#64748B]">Saved on this device only (Zero PII)</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  {t.nicknameLabel || 'Student Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  placeholder="e.g. Ramesh / స్నేహ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-sm font-medium"
                />
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  {t.classLabel || 'Class'} *
                </label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-sm font-semibold bg-white"
                >
                  <option value={10}>Class 10 (State SSC & CBSE)</option>
                  <option value={9}>Class 9 (Foundational Maths)</option>
                  <option value={8}>Class 8 (Pre-Algebra)</option>
                </select>
              </div>

              {/* Avatar Preset Picker */}
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                  {t.chooseAvatarLabel || 'Pick Human Avatar'} *
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {HUMAN_AVATAR_PRESETS.map((preset) => {
                    const isSelected = newAvatarEmoji === preset.emoji;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setNewAvatarEmoji(preset.emoji);
                          setNewAvatarColor(preset.color);
                        }}
                        className={`p-2 rounded-xl text-2xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-[#0F766E] scale-110 shadow-sm'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.label}
                      >
                        {preset.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4-Digit Unique PIN */}
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  {t.setPinLabel || 'Set Unique 4-Digit Code'} *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4 digits (e.g. 2026)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-sm font-mono tracking-widest"
                  />
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">Remember this code to log into your profile.</p>
              </div>

              {createError && (
                <p className="text-xs font-semibold text-[#DC2626] bg-[#FEF2F2] p-2 rounded-lg border border-[#FCA5A5]">
                  {createError}
                </p>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-[#0F766E] hover:bg-[#0D6962] text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <span>{t.saveProfile || 'Create & Start Learning'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
