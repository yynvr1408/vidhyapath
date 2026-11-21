import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Check, Lock, ShieldCheck, Volume2, Copy, CheckCheck, RefreshCw, AlertCircle, Camera, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnerProfile } from '../types';
import { localDb } from '../db/indexedDb';
import { SpeechService } from '../services/speech';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { StudentAvatar } from '../components/StudentAvatar';

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

export const S2_CreateProfile: React.FC = () => {
  const { setScreen, createLearner, pack } = useApp();

  const [studentName, setStudentName] = useState('');
  const [avatarType, setAvatarType] = useState<'initials' | 'icon' | 'photo'>('icon');
  const [selectedIcon, setSelectedIcon] = useState(HUMAN_STUDENT_AVATARS[0].emoji);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [studentCode, setStudentCode] = useState('');
  const [isCodeConfirmed, setIsCodeConfirmed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  // Generate a random unique code (e.g., VP-4829)
  const generateUniqueCode = useCallback(async () => {
    setIsCheckingCode(true);
    let candidate = '';
    let isTaken = true;
    let attempts = 0;

    while (isTaken && attempts < 25) {
      attempts++;
      const num = Math.floor(1000 + Math.random() * 9000);
      candidate = `VP-${num}`;
      isTaken = await localDb.isLoginCodeTaken(candidate);
    }

    setStudentCode(candidate);
    setCodeError(null);
    setIsCodeConfirmed(false);
    setIsCheckingCode(false);
  }, []);

  // Initialize unique code on mount
  useEffect(() => {
    generateUniqueCode();
  }, [generateUniqueCode]);

  // Validate custom student code
  const handleCodeChange = async (val: string) => {
    const formatted = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setStudentCode(formatted);
    setIsCodeConfirmed(false);

    if (formatted.length < 4) {
      setCodeError('కోడ్ కనీసం 4 అక్షరాలు/అంకెలు ఉండాలి');
      return;
    }

    setIsCheckingCode(true);
    const taken = await localDb.isLoginCodeTaken(formatted);
    setIsCheckingCode(false);

    if (taken) {
      setCodeError('ఈ కోడ్ ఇప్పటికే మీ ఫోన్‌లో మరొకరికి ఉంది. వేరే కోడ్ ఎంచుకోండి.');
    } else {
      setCodeError(null);
    }
  };

  // Photo upload with client-side canvas compression to 160x160 JPEG (< 25 KB)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setPhotoError(null);

    try {
      const compressedUrl = await compressImageToDataUrl(file);
      setPhotoDataUrl(compressedUrl);
      setAvatarType('photo');
    } catch (err) {
      setPhotoError('ఫోటో కంప్రెస్ చేయడంలో లోపం వచ్చింది. దయచేసి మళ్ళీ ప్రయత్నించండి.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Hear & Copy Code button using Web Speech API in active pack language
  const handleHearCode = () => {
    if (!studentCode) return;

    // 1. Copy to clipboard
    navigator.clipboard.writeText(studentCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);

    // 2. Speak the code clearly in active language
    const lang = pack?.language || 'te';
    const spokenText =
      lang === 'en'
        ? `Your personal student login code is: ${studentCode.replace(/-/g, ' ')}. Please note it down.`
        : lang === 'hi'
        ? `आपका छात्र लॉगिन कोड है: ${studentCode.replace(/-/g, ' ')}। इसे याद रखें।`
        : `మీ ప్రత్యేక లాగిన్ కోడ్: ${studentCode.replace(/-/g, ' ')}. దీనిని గుర్తుంచుకోండి.`;

    SpeechService.speak(spokenText, pack?.locales.tts || 'te-IN');
  };

  const handleSave = async () => {
    if (!studentName.trim() || !studentCode || codeError || !isCodeConfirmed) return;

    const newProfile: LearnerProfile = {
      id: 'learner_' + Date.now(),
      nickname: studentName.trim(),
      avatarType,
      avatarColor: selectedColor,
      avatarEmoji: selectedIcon,
      avatarPhoto: avatarType === 'photo' ? photoDataUrl : null,
      packId: pack?.id || 'te-10-maths-ap',
      loginCode: studentCode.trim().toUpperCase(),
      pinHash: pin.length === 4 ? pin : null,
      createdAt: Date.now(),
    };

    await createLearner(newProfile);
  };

  const isSubmitDisabled =
    !studentName.trim() ||
    !studentCode ||
    !!codeError ||
    !isCodeConfirmed ||
    isCheckingCode ||
    isCompressing;

  const currentPreviewLearner: LearnerProfile = {
    id: 'preview',
    nickname: studentName.trim() || 'విద్యార్థి పేరు',
    avatarType,
    avatarColor: selectedColor,
    avatarEmoji: selectedIcon,
    avatarPhoto: photoDataUrl,
    packId: 'te-10-maths-ap',
    loginCode: studentCode,
    createdAt: Date.now(),
  };

  return (
    <div className="min-h-screen bg-[#F4F9F6] p-4 max-w-md mx-auto flex flex-col justify-between text-[#0F172A]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setScreen('S1_PICKER')}
            className="w-12 h-12 rounded-2xl bg-[#FFFFFF] border border-[#D1E7DD] flex items-center justify-center text-[#0F172A] active:scale-95 transition-all hover:border-[#15803D] shadow-xs"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">
              {pack?.uiStrings.addNewLearner || 'కొత్త విద్యార్థిని చేర్చు'}
            </h1>
            <p className="text-xs text-[#475569] font-medium">విద్యార్థి ప్రొఫైల్ & ప్రత్యేక లాగిన్ కోడ్</p>
          </div>
        </div>

        {/* Selected Avatar Preview Card */}
        <div className="flex flex-col items-center justify-center py-4 bg-[#FFFFFF] rounded-3xl border border-[#D1E7DD] shadow-sm mb-4">
          <StudentAvatar learner={currentPreviewLearner} size="xl" className="mb-2" />
          <span className="font-bold text-lg text-[#0F172A]">
            {studentName.trim() || 'విద్యార్థి పేరు'}
          </span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#86EFAC] text-xs font-mono font-bold text-[#15803D] mt-1.5">
            <span>లాగిన్ కోడ్: {studentCode || '...'}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#059669] mt-2 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>జీరో-PII: డేటా మీ ఫోన్లోనే సురక్షితంగా సేవ్ అవుతుంది</span>
          </div>
        </div>

        {/* 1. Student Name Input */}
        <div className="mb-4 bg-[#FFFFFF] p-4 rounded-2xl border border-[#D1E7DD] shadow-xs">
          <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
            1. మీ పేరు నమోదు చేయండి (Student Name):
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="ఉదా: ప్రియ లేదా Priya"
            className="w-full text-base font-semibold py-3 px-4 rounded-xl bg-[#F4F9F6] border-2 border-[#D1E7DD] focus:border-[#15803D] focus:outline-hidden text-[#0F172A] placeholder-[#94A3B8]"
          />
          <p className="text-[11px] text-[#475569] mt-1.5 font-medium">
            మొదటి పేరు లేదా పిలిచే పేరు ఇవ్వండి. ఫోన్ నంబర్లు లేదా ఈమెయిల్ అవసరం లేదు.
          </p>
        </div>

        {/* 2. Avatar Builder & Photo Upload */}
        <div className="mb-4 bg-[#FFFFFF] p-4 rounded-2xl border border-[#D1E7DD] shadow-xs">
          <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
            2. అవతార్ లేదా ఫోటో ఎంచుకోండి (Avatar / Photo):
          </label>

          {/* Avatar Mode Switcher */}
          <div className="grid grid-cols-3 gap-2 mb-3">
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
              <span>ఐకాన్</span>
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
              <span>అక్షరాలు</span>
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
              <span>ఫోటో</span>
            </button>
          </div>

          {/* Sub-options for Avatar */}
          {avatarType === 'icon' && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
              {HUMAN_STUDENT_AVATARS.map((p) => (
                <button
                  key={p.emoji}
                  type="button"
                  title={p.label}
                  onClick={() => setSelectedIcon(p.emoji)}
                  className={`h-11 rounded-xl text-2xl flex items-center justify-center border transition-all ${
                    selectedIcon === p.emoji
                      ? 'border-[#15803D] bg-[#DCFCE7] scale-105 shadow-xs ring-2 ring-[#15803D]'
                      : 'border-[#D1E7DD] bg-[#FFFFFF] hover:border-[#15803D]'
                  }`}
                >
                  {p.emoji}
                </button>
              ))}
            </div>
          )}

          {avatarType === 'photo' && (
            <div className="mb-3">
              <label className="w-full py-3 px-4 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] text-xs font-bold text-[#14532D] flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[48px]">
                <Camera className="w-4 h-4 text-[#15803D]" />
                <span>{isCompressing ? 'ఫోటో కంప్రెస్ అవుతోంది...' : 'ఫోటో ఎంచుకోండి (Upload Photo)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handlePhotoUpload}
                  disabled={isCompressing}
                  className="hidden"
                />
              </label>
              {photoError && <p className="text-[11px] text-[#DC2626] mt-1.5">{photoError}</p>}
              <p className="text-[10px] text-[#475569] mt-1 text-center font-medium">
                ఆటో-కంప్రెస్డ్ 160x160 JPEG (&lt; 25 KB) · ఆఫ్లైన్ సేవ్
              </p>
            </div>
          )}

          {/* Ring / Badge Color Options */}
          <div>
            <span className="block text-[11px] font-semibold text-[#475569] mb-1.5">
              రంగు ఎంచుకోండి (Ring Accent Color):
            </span>
            <div className="flex items-center gap-2.5 bg-[#F4F9F6] p-2.5 rounded-xl border border-[#D1E7DD]">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    selectedColor === c ? 'ring-4 ring-[#15803D] ring-offset-2 ring-offset-white scale-110 shadow-xs' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Unique Student Code Generator & Input */}
        <div className="mb-4 bg-[#FFFFFF] p-4 rounded-2xl border border-[#D1E7DD] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              3. మీ ప్రత్యేక లాగిన్ కోడ్ (Unique Student Code):
            </label>
            <button
              type="button"
              onClick={generateUniqueCode}
              className="text-xs font-semibold text-[#15803D] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>కొత్త కోడ్</span>
            </button>
          </div>

          <div className="relative mb-2">
            <input
              type="text"
              value={studentCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="ఉదా: VP-4829 లేదా PRIYA-10"
              maxLength={14}
              className="w-full text-center text-xl font-mono font-black tracking-wider py-3.5 px-4 rounded-xl bg-[#F4F9F6] border-2 border-[#D1E7DD] focus:border-[#15803D] focus:outline-hidden text-[#0F172A] placeholder-[#94A3B8]"
            />
          </div>

          {/* Code Feedback / Error */}
          {codeError ? (
            <div className="flex items-center gap-1.5 text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] p-2 rounded-xl mb-2 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{codeError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-[#059669] bg-[#DCFCE7] border border-[#86EFAC] p-2 rounded-xl mb-2 font-medium">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>ఈ ప్రత్యేక కోడ్ అందుబాటులో ఉంది (Unique)</span>
            </div>
          )}

          {/* Hear Code & Copy Button */}
          <button
            type="button"
            onClick={handleHearCode}
            className="w-full py-2.5 px-3 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] border border-[#D1E7DD] hover:border-[#15803D] text-xs font-bold text-[#0F172A] flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[44px]"
          >
            {isCopied ? (
              <>
                <CheckCheck className="w-4 h-4 text-[#059669]" />
                <span className="text-[#059669]">కోడ్ కాపీ అయింది! (Copied)</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#15803D]" />
                <Copy className="w-3.5 h-3.5 text-[#475569]" />
                <span>కోడ్ వినండి & కాపీ చేయండి (Hear Code)</span>
              </>
            )}
          </button>
        </div>

        {/* 4. Optional 4-digit PIN */}
        <div className="mb-4 bg-[#FFFFFF] p-4 rounded-2xl border border-[#D1E7DD] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#15803D]" />
              <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
                4 అంకెల పిన్ (ఐచ్ఛికం / Optional PIN)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPinInput(!showPinInput)}
              className="text-xs font-bold text-[#15803D] hover:underline"
            >
              {showPinInput ? 'రద్దు చేయి' : 'పిన్ సెట్ చేయి'}
            </button>
          </div>

          {showPinInput && (
            <div className="mt-3 pt-3 border-t border-[#D1E7DD]">
              <p className="text-xs text-[#475569] mb-2 font-medium">
                ఒకే ఫోన్ కుటుంబంలో పంచుకున్నప్పుడు మీ ప్రొఫైల్ లాక్ చేసుకోవడానికి:
              </p>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 అంకెల సంఖ్య"
                className="w-full text-center text-2xl tracking-widest font-bold py-2 rounded-xl bg-[#F4F9F6] border-2 border-[#D1E7DD] focus:border-[#15803D] focus:outline-hidden text-[#0F172A]"
              />
            </div>
          )}
        </div>

        {/* 5. Mandatory Confirmation Checkbox */}
        <div className="mb-6 p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#D1E7DD] shadow-xs">
          <label className="flex items-start gap-3.5 cursor-pointer min-h-[48px] select-none">
            <input
              type="checkbox"
              checked={isCodeConfirmed}
              onChange={(e) => setIsCodeConfirmed(e.target.checked)}
              className="mt-1 w-6 h-6 rounded-lg bg-[#FFFFFF] border-2 border-[#D1E7DD] text-[#15803D] focus:ring-[#15803D] focus:ring-offset-0 cursor-pointer accent-[#15803D]"
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#0F172A] leading-snug">
                నేను నా ప్రత్యేక లాగిన్ కోడ్ను గుర్తుంచుకున్నాను
              </span>
              <span className="text-xs text-[#475569] mt-0.5">
                (I confirm and have noted my unique login code: <strong className="text-[#15803D] font-mono">{studentCode}</strong>)
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Submit / Create Profile & Login Button */}
      <div className="pt-2 pb-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitDisabled}
          className={`w-full py-4 rounded-2xl font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[56px] ${
            isSubmitDisabled
              ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed opacity-70'
              : 'bg-[#15803D] hover:bg-[#166534] text-[#FFFFFF] shadow-emerald-700/20 ring-2 ring-[#86EFAC]'
          }`}
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>ఖాతా సృష్టించి లాగిన్ అవ్వండి (Create Profile & Login)</span>
        </button>
      </div>
    </div>
  );
};
