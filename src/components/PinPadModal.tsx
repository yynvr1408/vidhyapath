import React, { useState } from 'react';
import { X, Delete, Check, Lock, AlertCircle, Sparkles, HelpCircle, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { LearnerProfile } from '../types';
import { StudentAvatar } from './StudentAvatar';
import { getTranslations, SupportedLang } from '../utils/translations';
import { useApp } from '../context/AppContext';
import { getSafetyQuestionLabel } from '../config/safetyQuestions';
import { navigationManager } from '../services/navigationManager';

// Helper to format clean display name
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

interface PinPadModalProps {
  learner: LearnerProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinPadModal: React.FC<PinPadModalProps> = ({
  learner,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentLanguage, updateLearnerPin } = useApp();
  const t = getTranslations(currentLanguage);

  const [mode, setMode] = useState<'enter_pin' | 'safety_question' | 'enter_new_pin' | 'reset_success'>('enter_pin');
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [safetyAnswerInput, setSafetyAnswerInput] = useState('');

  React.useEffect(() => {
    setMode('enter_pin');
    setEnteredPin('');
    setErrorMsg(null);
    setSafetyAnswerInput('');
  }, [learner?.id, isOpen]);

  // Phone back-button integration
  React.useEffect(() => {
    if (!isOpen) return;

    return navigationManager.registerBackHandler(() => {
      if (mode !== 'enter_pin') {
        setMode('enter_pin');
        setEnteredPin('');
        setErrorMsg(null);
        return true;
      }
      onClose();
      return true;
    }, 100);
  }, [isOpen, mode, onClose]);

  if (!isOpen) return null;

  // Only the learner's own stored PIN unlocks; no hardcoded fallback.
  const expectedPin = learner.pin || learner.pinHash || null;

  const handleDigit = (digit: string) => {
    if (mode === 'enter_pin') {
      if (enteredPin.length >= 4) return;
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg(null);

      if (next.length === 4) {
        if (expectedPin !== null && next === expectedPin) {
          setTimeout(() => {
            setEnteredPin('');
            onSuccess();
          }, 150);
        } else {
          setTimeout(() => {
            setErrorMsg(t.incorrectPin);
            setEnteredPin('');
          }, 200);
        }
      }
    } else if (mode === 'enter_new_pin') {
      if (enteredPin.length >= 4) return;
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg(null);

      if (next.length === 4) {
        // Persist new PIN via student safety question
        updateLearnerPin(learner.id, next).then(() => {
          setMode('reset_success');
          setTimeout(() => {
            onSuccess();
          }, 700);
        });
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  // Student Safety Question Verification (Case-insensitive, zero-email, zero-OTP)
  const handleVerifySafetyAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyAnswerInput.trim()) return;

    const input = safetyAnswerInput.trim().toLowerCase();
    const stored = (learner.securityAnswer || '').trim().toLowerCase();

    // Standard accepted answers for math/science or the student's stored answer
    const acceptedMath = ['maths', 'math', 'mathematics', 'లెక్కలు', 'గణితం', 'गणित'];
    const acceptedAnimal = ['lion', 'సింహం', 'शेर', 'cheetah', 'చిరుత', 'elephant', 'ఏనుగు', 'हाथी'];

    const isMatch = stored
      ? input === stored || (stored === 'maths' && acceptedMath.includes(input)) || (stored === 'lion' && acceptedAnimal.includes(input))
      : (acceptedMath.includes(input) || input.length >= 2);

    if (isMatch) {
      setMode('enter_new_pin');
      setEnteredPin('');
      setErrorMsg(null);
    } else {
      setErrorMsg(t.incorrectSecurityAnswer);
    }
  };

  const currentSafetyQuestionPrompt = learner.securityQuestion || getSafetyQuestionLabel(learner.securityQuestionId || 'subject', currentLanguage);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#FFFFFF] rounded-[16px] p-6 w-full max-w-sm shadow-xl border border-[#E2E8F0] flex flex-col items-center">
        {/* Top Header & Close Button */}
        <div className="w-full flex justify-between items-center mb-1">
          {mode !== 'enter_pin' && mode !== 'reset_success' ? (
            <button
              type="button"
              onClick={() => {
                setMode('enter_pin');
                setEnteredPin('');
                setErrorMsg(null);
              }}
              className="p-2 rounded-lg text-[#0F766E] hover:bg-[#F0FDFA] flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backToPin}</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Learner Info */}
        <div className="flex flex-col items-center text-center -mt-1 mb-3">
          <StudentAvatar learner={learner} size="lg" className="mb-2" />
          <h3 className="font-bold text-lg text-[#0F172A] leading-tight">
            {getCleanDisplayName(learner.nickname, currentLanguage).primary}
          </h3>
          {getCleanDisplayName(learner.nickname, currentLanguage).secondary && (
            <span className="text-xs text-[#64748B] font-medium mt-0.5">
              {getCleanDisplayName(learner.nickname, currentLanguage).secondary}
            </span>
          )}
          <span className="text-xs text-[#0F766E] font-bold bg-[#F0FDFA] px-3 py-0.5 rounded-full mt-1.5 border border-[#CCFBF1]">
            {learner.loginCode || (learner.classGrade ? `${learner.classGrade} ${t.classText}` : `10 ${t.classText}`)}
          </span>
        </div>

        {/* MODE 1: Standard PIN Entry */}
        {mode === 'enter_pin' && (
          <>
            

            {/* 4-PIN Indicator Dots */}
            <div className="flex items-center gap-4 mb-5">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = enteredPin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all ${
                      isFilled
                        ? 'bg-[#0F766E] scale-110 shadow-sm'
                        : 'bg-[#F1F5F9] border-2 border-[#E2E8F0]'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error notification */}
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-[#DC2626] bg-[#FEE2E2] p-2.5 rounded-lg mb-3 border border-[#FECACA] w-full text-center justify-center font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 3x4 Numeric Keypad with touch targets */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="h-14 rounded-[12px] bg-[#F8FAFC] hover:bg-[#F0FDFA] hover:border-[#0F766E] border border-[#E2E8F0] text-xl font-bold text-[#0F172A] active:scale-95 transition-all flex items-center justify-center min-h-[52px]"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-14 rounded-[12px] bg-[#F8FAFC] hover:bg-[#FEE2E2] hover:text-[#DC2626] border border-[#E2E8F0] text-xs font-bold text-[#475569] active:scale-95 transition-all flex items-center justify-center min-h-[52px]"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-14 rounded-[12px] bg-[#F8FAFC] hover:bg-[#F0FDFA] hover:border-[#0F766E] border border-[#E2E8F0] text-xl font-bold text-[#0F172A] active:scale-95 transition-all flex items-center justify-center min-h-[52px]"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 rounded-[12px] bg-[#F8FAFC] hover:bg-[#FEF3C7] hover:text-[#D97706] border border-[#E2E8F0] active:scale-95 transition-all flex items-center justify-center text-[#475569] min-h-[52px]"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Student Zero-Email Safety Question Reset Trigger */}
            <button
              type="button"
              onClick={() => {
                setMode('safety_question');
                setErrorMsg(null);
                setSafetyAnswerInput('');
              }}
              className="mt-4 text-xs font-bold text-[#0F766E] hover:underline flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-[#F0FDFA] transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t.forgotPin} · {t.resetPinViaSafetyQuestion}</span>
            </button>
          </>
        )}

        {/* MODE 2: Safety Question Challenge (Zero Email / Zero OTP) */}
        {mode === 'safety_question' && (
          <form onSubmit={handleVerifySafetyAnswer} className="w-full space-y-4 pt-1 animate-fadeIn">
            <div className="bg-[#F0FDFA] p-3 rounded-[12px] border border-[#CCFBF1] text-center space-y-1">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.noEmailOrOtpNeeded}</span>
              </div>
              <p className="text-sm font-bold text-[#0F172A]">
                {currentSafetyQuestionPrompt}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                {t.securityAnswerLabel}:
              </label>
              <input
                type="text"
                autoFocus
                required
                value={safetyAnswerInput}
                onChange={(e) => {
                  setSafetyAnswerInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder={t.securityAnswerPlaceholder}
                className="w-full text-sm font-semibold p-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden text-[#0F172A]"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-[#DC2626] bg-[#FEE2E2] p-2.5 rounded-lg border border-[#FECACA] w-full text-center justify-center font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!safetyAnswerInput.trim()}
              className="w-full py-3.5 rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-60 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{t.verifyAnswer}</span>
            </button>
          </form>
        )}

        {/* MODE 3: Enter New 4-Digit PIN */}
        {mode === 'enter_new_pin' && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            <h4 className="text-sm font-bold text-[#0F766E] mb-1">
              {t.enterNewPin}
            </h4>
            <p className="text-xs text-[#64748B] mb-4 text-center">
              {t.noEmailOrOtpNeeded}
            </p>

            {/* 4-PIN Indicator Dots */}
            <div className="flex items-center gap-4 mb-5">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = enteredPin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all ${
                      isFilled
                        ? 'bg-[#0F766E] scale-110 shadow-sm'
                        : 'bg-[#F1F5F9] border-2 border-[#E2E8F0]'
                    }`}
                  />
                );
              })}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="h-14 rounded-[12px] bg-[#F8FAFC] hover:bg-[#F0FDFA] hover:border-[#0F766E] border border-[#E2E8F0] text-xl font-bold text-[#0F172A] active:scale-95 transition-all flex items-center justify-center min-h-[52px]"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-14 rounded-[12px] bg-[#F8FAFC] hover:bg-[#FEE2E2] hover:text-[#DC2626] border border-[#E2E8F0] text-xs font-bold text-[#475569] active:scale-95 transition-all flex items-center justify-center min-h-[52px]"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-14 rounded-[12px] bg-[#F8FAFC] hover:bg-[#F0FDFA] hover:border-[#0F766E] border border-[#E2E8F0] text-xl font-bold text-[#0F172A] active:scale-95 transition-all flex items-center justify-center min-h-[52px]"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 rounded-[12px] bg-[#F8FAFC] hover:bg-[#FEF3C7] hover:text-[#D97706] border border-[#E2E8F0] active:scale-95 transition-all flex items-center justify-center text-[#475569] min-h-[52px]"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* MODE 4: Reset Success */}
        {mode === 'reset_success' && (
          <div className="w-full flex flex-col items-center py-6 space-y-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <p className="text-sm font-bold text-[#16A34A] text-center">
              {t.pinResetSuccess}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
