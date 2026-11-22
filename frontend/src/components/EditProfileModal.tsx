import React, { useState } from 'react';
import { X, Check, Camera, Sparkles, AlertCircle, KeyRound, CheckCheck } from 'lucide-react';
import { LearnerProfile } from '../types';
import { useApp } from '../context/AppContext';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { StudentAvatar } from './StudentAvatar';

interface EditProfileModalProps {
  learner: LearnerProfile;
  isOpen: boolean;
  onClose: () => void;
  requireCodeVerification?: boolean;
}

const COLOR_OPTIONS = [
  '#15803D', // Emerald
  '#0D9488', // Teal
  '#16A34A', // Leaf
  '#14532D', // Forest
  '#CA8A04', // Gold
];

const HUMAN_STUDENT_AVATARS = [
  { emoji: '👩‍🎓', label: 'Graduate Girl / విద్యావతి' },
  { emoji: '👨‍🎓', label: 'Graduate Boy / విద్యావంతుడు' },
  { emoji: '👧', label: 'School Girl / విద్యార్థిని' },
  { emoji: '👦', label: 'School Boy / విద్యార్థి' },
  { emoji: '🧑‍🎓', label: 'Scholar / అభ్యాసకుడు' },
  { emoji: '🧒', label: 'Curious Learner / చిన్నారి' },
  { emoji: '👩‍🏫', label: 'Mentor / మార్గదర్శి' },
  { emoji: '🧑‍💻', label: 'Tech Student / టెక్ విద్యార్థి' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  learner,
  isOpen,
  onClose,
  requireCodeVerification = false,
}) => {
  const { updateLearnerProfile } = useApp();

  const [verified, setVerified] = useState(!requireCodeVerification);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [name, setName] = useState(learner.nickname || '');
  const [avatarType, setAvatarType] = useState<'initials' | 'icon' | 'photo'>(
    learner.avatarType || (learner.avatarPhoto ? 'photo' : 'icon')
  );
  const [selectedColor, setSelectedColor] = useState(learner.avatarColor || '#15803D');
  const [selectedEmoji, setSelectedEmoji] = useState(learner.avatarEmoji || '🎓');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(learner.avatarPhoto || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // Code verification step before editing
  const handleVerifyCode = () => {
    if (verifyCode.trim().toUpperCase() === (learner.loginCode || '').trim().toUpperCase()) {
      setVerified(true);
      setVerifyError(null);
    } else {
      setVerifyError('కోడ్ సరిపోలలేదు. దయచేసి సరైన లాగిన్ కోడ్ ఇవ్వండి.');
    }
  };

  // Photo upload with client-side canvas compression
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
      setPhotoError('ఫోటో కంప్రెస్ చేయడంలో సమస్య వచ్చింది. దయచేసి వేరొక ఫోటో ఎంచుకోండి.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    const updated: LearnerProfile = {
      ...learner,
      nickname: name.trim(),
      avatarType,
      avatarColor: selectedColor,
      avatarEmoji: selectedEmoji,
      avatarPhoto: avatarType === 'photo' ? photoDataUrl : null,
    };

    try {
      await updateLearnerProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.warn('Save failed:', err);
    }
  };

  const previewLearner: LearnerProfile = {
    ...learner,
    nickname: name || 'విద్యార్థి',
    avatarType,
    avatarColor: selectedColor,
    avatarEmoji: selectedEmoji,
    avatarPhoto: photoDataUrl,
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#FFFFFF] rounded-3xl p-5 w-full max-w-md shadow-2xl border border-[#D1E7DD] max-h-[90vh] overflow-y-auto text-[#0F172A]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D1E7DD] mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">ప్రొఫైల్ మార్చండి (Edit Profile)</h3>
              <span className="text-xs text-[#475569]">విద్యార్థి పేరు, అవతార్ & ఫోటో</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F4F9F6] text-[#475569] hover:text-[#0F172A] border border-[#D1E7DD] min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Step if required */}
        {!verified ? (
          <div className="py-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] border border-[#D1E7DD] text-[#15803D] flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#0F172A]">{learner.nickname} ప్రొఫైల్ సవరణ</h4>
              <p className="text-xs text-[#475569] mt-1">
                మార్పులు చేయడానికి దయచేసి మీ ప్రత్యేక లాగిన్ కోడ్‌ను నమోదు చేయండి:
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
                placeholder="ఉదా: PRIYA-10"
                className="w-full text-center text-lg font-mono font-black tracking-wider py-3 rounded-xl bg-[#F4F9F6] border-2 border-[#D1E7DD] focus:border-[#15803D] focus:outline-hidden text-[#0F172A]"
              />
            </div>

            {verifyError && (
              <div className="flex items-center gap-1.5 text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] p-2.5 rounded-xl mb-3 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={!verifyCode.trim()}
              className="w-full py-3.5 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:bg-[#E2E8F0] text-white disabled:text-[#94A3B8] font-bold text-sm shadow-sm transition-all"
            >
              కోడ్ ధృవీకరించండి (Verify & Continue)
            </button>
          </div>
        ) : (
          /* Profile Edit Form */
          <div className="space-y-4">
            {/* Live Preview */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-[#F4F9F6] rounded-2xl border border-[#D1E7DD]">
              <StudentAvatar learner={previewLearner} size="xl" className="mb-2" />
              <span className="font-bold text-base text-[#0F172A]">{name || 'విద్యార్థి పేరు'}</span>
              <span className="text-xs font-mono font-bold text-[#15803D] mt-0.5">కోడ్: {learner.loginCode}</span>
            </div>

            {/* 1. Student Name Input */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                విద్యార్థి పేరు (Student Display Name):
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="మీ పేరు (తెలుగు లేదా English)"
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#FFFFFF] border border-[#D1E7DD] focus:border-[#15803D] focus:outline-hidden text-sm text-[#0F172A] font-semibold"
              />
            </div>

            {/* 2. Avatar Mode Switcher */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                అవతార్ శైలి (Avatar Style):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarType('icon')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    avatarType === 'icon'
                      ? 'bg-[#15803D] text-white border-[#15803D]'
                      : 'bg-[#F4F9F6] text-[#475569] border-[#D1E7DD]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ఐకాన్ (Icon)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarType('initials')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    avatarType === 'initials'
                      ? 'bg-[#15803D] text-white border-[#15803D]'
                      : 'bg-[#F4F9F6] text-[#475569] border-[#D1E7DD]'
                  }`}
                >
                  <span>అక్షరాలు (Initials)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarType('photo')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    avatarType === 'photo'
                      ? 'bg-[#15803D] text-white border-[#15803D]'
                      : 'bg-[#F4F9F6] text-[#475569] border-[#D1E7DD]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>ఫోటో (Photo)</span>
                </button>
              </div>
            </div>

            {/* 3. Avatar Type Sub-options */}
            {avatarType === 'icon' && (
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  విద్యార్థి అవతార్ ఎంచుకోండి (Student Avatar):
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
                          ? 'border-[#15803D] bg-[#DCFCE7] scale-105 shadow-sm ring-2 ring-[#15803D]'
                          : 'border-[#D1E7DD] bg-[#FFFFFF] hover:border-[#15803D]'
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
                  ఫోటో ఎంచుకోండి (160x160 కంప్రెస్డ్ &lt; 25 KB):
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 py-3 px-4 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] text-xs font-bold text-[#14532D] flex items-center justify-center gap-2 cursor-pointer transition-all">
                    <Camera className="w-4 h-4 text-[#15803D]" />
                    <span>{isCompressing ? 'కంప్రెస్ అవుతోంది...' : 'కొత్త ఫోటో అప్‌లోడ్'}</span>
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
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#15803D] shrink-0 shadow-sm">
                      <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                {photoError && (
                  <p className="text-[11px] text-[#DC2626] mt-1.5">{photoError}</p>
                )}
              </div>
            )}

            {/* 4. Color Palette */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                రంగు ఎంచుకోండి (Accent Ring Color):
              </label>
              <div className="flex items-center gap-3 bg-[#F4F9F6] p-2.5 rounded-xl border border-[#D1E7DD]">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      selectedColor === c ? 'ring-4 ring-[#15803D] ring-offset-2 ring-offset-white scale-110 shadow-sm' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {selectedColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-[#F4F9F6] hover:bg-[#E2E8F0] border border-[#D1E7DD] text-xs font-bold text-[#475569]"
              >
                రద్దు చేయి
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim() || isCompressing}
                className="flex-1 py-3 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:bg-[#E2E8F0] text-white disabled:text-[#94A3B8] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>సేవ్ అయింది!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>మార్పులు సేవ్ చేయి</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
