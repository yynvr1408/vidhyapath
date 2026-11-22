import React, { useState, useEffect } from 'react';
import { X, Check, Camera, Sparkles, KeyRound, CheckCheck, Lock } from 'lucide-react';
import { LearnerProfile } from '../types';
import { useApp } from '../context/AppContext';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { StudentAvatar } from './StudentAvatar';
import { getTranslations } from '../utils/translations';

interface EditProfileModalProps {
  learner: LearnerProfile;
  isOpen: boolean;
  onClose: () => void;
  requireCodeVerification?: boolean;
}

const COLOR_OPTIONS = [
  '#0F766E', // Primary Educational Teal
  '#15803D', // Emerald Leaf Green
  '#D97706', // Warm Amber
  '#2563EB', // Blue
  '#7C3AED', // Violet / Purple
  '#DC2626', // Crimson Red
];

const HUMAN_STUDENT_AVATARS = [
  { emoji: '🧑‍🎓', label: 'Scholar / విద్యార్థి' },
  { emoji: '👧', label: 'School Girl / విద్యార్థిని' },
  { emoji: '👦', label: 'School Boy / బాలుడు' },
  { emoji: '👩‍🎓', label: 'Graduate Girl / విద్యావతి' },
  { emoji: '👨‍🎓', label: 'Graduate Boy / విద్యావంతుడు' },
  { emoji: '🧒', label: 'Curious Learner / చిన్నారి' },
  { emoji: '🧑‍💻', label: 'Tech Student / టెక్ విద్యార్థి' },
  { emoji: '👩‍🏫', label: 'Mentor / మార్గదర్శి' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  learner,
  isOpen,
  onClose,
  requireCodeVerification = false,
}) => {
  const { updateLearnerProfile, currentLanguage } = useApp();
  const t = getTranslations(currentLanguage);

  const [verified, setVerified] = useState(!requireCodeVerification);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [name, setName] = useState(learner.nickname || '');
  const [classGrade, setClassGrade] = useState<number>(learner.classGrade || 10);
  const [avatarType, setAvatarType] = useState<'initials' | 'icon' | 'photo'>(
    learner.avatarType || (learner.avatarPhoto ? 'photo' : 'icon')
  );
  const [selectedColor, setSelectedColor] = useState(learner.avatarColor || '#0F766E');
  const [selectedEmoji, setSelectedEmoji] = useState(learner.avatarEmoji || '🧑‍🎓');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(learner.avatarPhoto || null);
  const [pin, setPin] = useState(learner.pin || '1234');
  const [isCompressing, setIsCompressing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever learner or modal opens
  useEffect(() => {
    if (learner && isOpen) {
      setName(learner.nickname || '');
      setClassGrade(learner.classGrade || 10);
      setAvatarType(learner.avatarType || (learner.avatarPhoto ? 'photo' : 'icon'));
      setSelectedColor(learner.avatarColor || '#0F766E');
      setSelectedEmoji(learner.avatarEmoji || '🧑‍🎓');
      setPhotoDataUrl(learner.avatarPhoto || null);
      setPin(learner.pin || '1234');
      setVerified(!requireCodeVerification);
      setVerifyCode('');
      setVerifyError(null);
      setPhotoError(null);
      setSaveSuccess(false);
    }
  }, [learner, isOpen, requireCodeVerification]);

  if (!isOpen) return null;

  // Code verification step before editing (if required)
  const handleVerifyCode = () => {
    if (verifyCode.trim().toUpperCase() === (learner.loginCode || '').trim().toUpperCase()) {
      setVerified(true);
      setVerifyError(null);
    } else {
      setVerifyError(
        currentLanguage === 'te'
          ? 'కోడ్ సరిపోలలేదు. దయచేసి సరైన లాగిన్ కోడ్ ఇవ్వండి.'
          : currentLanguage === 'hi'
          ? 'कोड मेल नहीं खा रहा है। कृपया सही लॉगिन कोड दर्ज करें।'
          : 'Code did not match. Please enter the correct student code.'
      );
    }
  };

  // Photo upload with client-side canvas compression (< 25 KB)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setPhotoError(null);

    try {
      const compressedUrl = await compressImageToDataUrl(file);
      setPhotoDataUrl(compressedUrl);
      setAvatarType('photo');
    } catch (err: any) {
      console.warn('Compression error:', err);
      setPhotoError(
        currentLanguage === 'te'
          ? 'ఫోటో కంప్రెస్ చేయడంలో సమస్య వచ్చింది. దయచేసి వేరొక ఫోటో ఎంచుకోండి.'
          : currentLanguage === 'hi'
          ? 'फ़ोटो कंप्रेस करने में त्रुटि। कृपया कोई अन्य फ़ोटो चुनें।'
          : 'Failed to compress photo. Please try a different image.'
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    const cleanPin = pin.trim().length === 4 ? pin.trim() : (learner.pin || '1234');

    const updated: LearnerProfile = {
      ...learner,
      nickname: name.trim(),
      classGrade: classGrade,
      avatarType,
      avatarColor: selectedColor,
      avatarEmoji: selectedEmoji,
      avatarPhoto: avatarType === 'photo' ? photoDataUrl : null,
      pin: cleanPin,
      pinHash: cleanPin,
    };

    try {
      await updateLearnerProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.warn('Save failed:', err);
    }
  };

  const previewLearner: LearnerProfile = {
    ...learner,
    nickname: name || (currentLanguage === 'te' ? 'విద్యార్థి' : currentLanguage === 'hi' ? 'विद्यार्थी' : 'Student'),
    classGrade,
    avatarType,
    avatarColor: selectedColor,
    avatarEmoji: selectedEmoji,
    avatarPhoto: photoDataUrl,
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-[#E2E8F0] max-h-[92vh] overflow-y-auto text-[#0F172A]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">✏️</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#0F172A] leading-tight">
                {t.editProfileTitle}
              </h3>
              <p className="text-xs text-[#475569] mt-0.5">
                {t.editProfileSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0] min-h-[44px] min-w-[44px] flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Step if required */}
        {!verified ? (
          <div className="py-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#F0FDFA] border border-[#0F766E]/30 text-[#0F766E] flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#0F172A]">
                {learner.nickname} - {t.editProfileTitle}
              </h4>
              <p className="text-xs text-[#475569] mt-1">
                {currentLanguage === 'te'
                  ? 'మార్పులు చేయడానికి దయచేసి మీ ప్రత్యేక లాగిన్ కోడ్‌ను నమోదు చేయండి:'
                  : currentLanguage === 'hi'
                  ? 'बदलाव करने के लिए कृपया अपना विशेष लॉगिन कोड दर्ज करें:'
                  : 'Please enter your unique student login code to continue:'}
              </p>
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => {
                  setVerifyCode(e.target.value.toUpperCase());
                  setVerifyError(null);
                }}
                placeholder="e.g. RAVI-10"
                className="w-full text-center text-lg font-mono font-black tracking-wider py-3 rounded-xl bg-[#F8FAFC] border-2 border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden text-[#0F172A]"
              />
            </div>

            {verifyError && (
              <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] p-2.5 rounded-xl mb-3 font-medium">
                {verifyError}
              </p>
            )}

            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={!verifyCode.trim()}
              className="w-full py-3.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:bg-[#E2E8F0] text-white disabled:text-[#94A3B8] font-bold text-sm shadow-sm transition-all"
            >
              {currentLanguage === 'te'
                ? 'కోడ్ ధృవీకరించండి'
                : currentLanguage === 'hi'
                ? 'कोड सत्यापित करें'
                : 'Verify Code & Continue'}
            </button>
          </div>
        ) : (
          /* Main Profile Edit Form */
          <form onSubmit={handleSave} className="space-y-4">
            {/* 1. Live Student Card Preview */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-[#F0FDFA] rounded-2xl border border-[#CCFBF1]">
              <StudentAvatar learner={previewLearner} size="xl" className="mb-2 shadow-sm" />
              <div className="font-extrabold text-base text-[#0F172A]">
                {name || (currentLanguage === 'te' ? 'విద్యార్థి' : currentLanguage === 'hi' ? 'विद्यार्थी' : 'Student')}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-[#0F766E] bg-white px-2.5 py-0.5 rounded-full border border-[#CCFBF1]">
                  {classGrade} {t.classText}
                </span>
                {learner.loginCode && (
                  <span className="text-[11px] font-mono font-bold text-[#475569] bg-white px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                    {learner.loginCode}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Student Name Input */}
            <div>
              <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5">
                {t.studentNameLabel} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ravi / రవి"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] focus:bg-white focus:outline-hidden text-sm text-[#0F172A] font-bold transition-all min-h-[44px]"
              />
            </div>

            {/* 3. Class Grade Selector (Class 8, 9, 10) */}
            <div>
              <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5">
                {t.selectClassLabel}:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[8, 9, 10].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setClassGrade(c)}
                    className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all min-h-[44px] flex items-center justify-center gap-1 ${
                      classGrade === c
                        ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                        : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#0F766E]'
                    }`}
                  >
                    <span>{c}</span>
                    <span>{t.classText}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Avatar Style Mode Switcher */}
            <div>
              <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5">
                {t.avatarStyleLabel}:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarType('icon')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
                    avatarType === 'icon'
                      ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#0F766E]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.iconAvatar}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarType('photo')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
                    avatarType === 'photo'
                      ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#0F766E]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t.photoAvatar}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarType('initials')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
                    avatarType === 'initials'
                      ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:border-[#0F766E]'
                  }`}
                >
                  <span>{t.initialsAvatar}</span>
                </button>
              </div>
            </div>

            {/* Sub-options for Avatar */}
            {avatarType === 'icon' && (
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t.chooseAvatarLabel}:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {HUMAN_STUDENT_AVATARS.map((p) => (
                    <button
                      key={p.emoji}
                      type="button"
                      title={p.label}
                      onClick={() => setSelectedEmoji(p.emoji)}
                      className={`h-11 rounded-xl text-2xl flex items-center justify-center border transition-all ${
                        selectedEmoji === p.emoji
                          ? 'border-[#0F766E] bg-[#F0FDFA] scale-105 shadow-xs ring-2 ring-[#0F766E]'
                          : 'border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#0F766E]'
                      }`}
                    >
                      {p.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {avatarType === 'photo' && (
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  {t.photoAvatar} (Auto-compressed &lt; 25 KB):
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 py-3 px-4 rounded-xl bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#0F766E]/40 text-xs font-bold text-[#0F766E] flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[48px]">
                    <Camera className="w-4 h-4 text-[#0F766E]" />
                    <span>{isCompressing ? t.compressingPhoto : t.uploadPhoto}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handlePhotoUpload}
                      disabled={isCompressing}
                      className="hidden"
                    />
                  </label>
                  {photoDataUrl && (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#0F766E] shrink-0 shadow-xs">
                      <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                {photoError && (
                  <p className="text-xs text-[#DC2626] mt-1.5">{photoError}</p>
                )}
              </div>
            )}

            {/* 5. Theme Accent Ring Color */}
            <div>
              <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5">
                {t.accentColorLabel}:
              </label>
              <div className="flex items-center justify-between bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      selectedColor === c
                        ? 'ring-4 ring-[#0F766E] ring-offset-2 ring-offset-white scale-110 shadow-xs'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {selectedColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Optional 4-Digit PIN Update */}
            <div>
              <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>{t.setPinLabel}</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] focus:bg-white focus:outline-hidden text-sm font-mono tracking-widest text-[#0F172A] font-bold min-h-[44px]"
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs sm:text-sm font-bold text-[#475569] min-h-[48px] transition-all"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isCompressing}
                className="flex-1 py-3 px-3 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:bg-[#E2E8F0] text-white disabled:text-[#94A3B8] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                {saveSuccess ? (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>{t.savedSuccess}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t.saveChanges}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
