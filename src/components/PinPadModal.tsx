import React, { useState } from 'react';
import { X, Delete, Check, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { LearnerProfile } from '../types';
import { StudentAvatar } from './StudentAvatar';
import { getTranslations, SupportedLang } from '../utils/translations';
import { useApp } from '../context/AppContext';

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
  const { currentLanguage } = useApp();
  const t = getTranslations(currentLanguage);

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setEnteredPin('');
    setErrorMsg(null);
  }, [learner?.id, isOpen]);

  if (!isOpen) return null;

  // Only the learner's own stored PIN unlocks; no hardcoded fallback.
  const expectedPin = learner.pin || learner.pinHash || null;

  const handleDigit = (digit: string) => {
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
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#FFFFFF] rounded-[12px] p-6 w-full max-w-sm shadow-xl border border-[#E2E8F0] flex flex-col items-center">
        {/* Close Button */}
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Learner Info */}
        <div className="flex flex-col items-center text-center -mt-2 mb-3">
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
            {learner.classGrade ? `${learner.classGrade} ${t.classText}` : `10 ${t.classText}`}
          </span>
        </div>

        {/* Demo Hint Banner for easy hackathon judging */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF3C7] text-[#D97706] text-xs font-bold rounded-full mb-4 border border-[#FDE68A]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.demoPinHint}</span>
        </div>

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

        {/* 3x4 Numeric Keypad with >= 56px touch targets */}
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
    </div>
  );
};
