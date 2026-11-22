import React, { useState } from 'react';
import { X, Check, UserPlus, ShieldCheck } from 'lucide-react';
import { LearnerProfile } from '../types';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';
import { SAFETY_QUESTIONS, getSafetyQuestionLabel } from '../config/safetyQuestions';
import { navigationManager } from '../services/navigationManager';

interface AddProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HUMAN_AVATARS = ['👦', '👧', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧒', '🙋‍♂️', '🙋‍♀️'];
const AVATAR_COLORS = ['#0F766E', '#D97706', '#16A34A', '#2563EB', '#7C3AED'];

export const AddProfileModal: React.FC<AddProfileModalProps> = ({ isOpen, onClose }) => {
  const { createLearner, currentLanguage, pack } = useApp();
  const t = getTranslations(currentLanguage);

  const [name, setName] = useState('');
  const [classGrade, setClassGrade] = useState<number>(9);
  const [selectedAvatar, setSelectedAvatar] = useState(HUMAN_AVATARS[0]);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [pin, setPin] = useState('1234');
  const [securityQuestionId, setSecurityQuestionId] = useState(SAFETY_QUESTIONS[0].id);
  const [securityAnswer, setSecurityAnswer] = useState('Maths');

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const unreg = navigationManager.registerBackHandler(() => {
      onClose();
      return true;
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unreg();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const chosenQuestionPrompt = getSafetyQuestionLabel(securityQuestionId, currentLanguage);

    const newProfile: LearnerProfile = {
      id: 'learner_' + Date.now(),
      nickname: name.trim(),
      classGrade,
      avatarType: 'icon',
      avatarEmoji: selectedAvatar,
      avatarColor: selectedColor,
      loginCode: name.trim().toUpperCase().slice(0, 5) + '-' + classGrade,
      pin: pin.length === 4 ? pin : '1234',
      pinHash: pin.length === 4 ? pin : '1234',
      securityQuestionId,
      securityQuestion: chosenQuestionPrompt,
      securityAnswer: securityAnswer.trim() || 'Maths',
      packId: pack?.id || 'te-10-maths-ap',
      createdAt: Date.now(),
    };

    await createLearner(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#FFFFFF] rounded-[12px] p-6 w-full max-w-sm shadow-xl border border-[#E2E8F0]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#0F766E]" />
            <h3 className="font-bold text-base text-[#0F172A]">{currentLanguage === 'te' ? 'విద్యార్థి ప్రొఫైల్ నమోదు' : currentLanguage === 'hi' ? 'छात्र प्रोफ़ाइल पंजीकरण' : 'Register Student Profile'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              {t.nicknameLabel}:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ravi / రవి"
              className="w-full text-sm font-semibold p-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden text-[#0F172A]"
            />
          </div>

          {/* Class Selector (Classes 1 through 12) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#0F172A]">
                {t.classLabel}:
              </label>
              <span className="text-[10px] font-black text-[#0F766E] uppercase">
                {classGrade <= 5 ? (currentLanguage === 'te' ? 'ప్రాథమిక (ఉచితం)' : currentLanguage === 'hi' ? 'प्राथमिक (निःशुल्क)' : 'Primary (Free)')
                  : classGrade <= 8 ? (currentLanguage === 'te' ? 'మిడిల్ స్కూల్ (ఉచితం)' : currentLanguage === 'hi' ? 'माध्यमिक पूर्व (निःशुल्क)' : 'Middle School (Free)')
                  : classGrade <= 10 ? (currentLanguage === 'te' ? 'సెకండరీ బోర్డు (ఉచితం)' : currentLanguage === 'hi' ? 'माध्यमिक बोर्ड (निःशुल्क)' : 'Secondary Board (Free)')
                  : (currentLanguage === 'te' ? 'ఇంటర్మీడియట్' : currentLanguage === 'hi' ? 'उच्च माध्यमिक' : 'Higher Secondary')}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setClassGrade(c)}
                  className={`py-2 px-1.5 rounded-[10px] text-xs font-bold border transition-all text-center cursor-pointer ${
                    classGrade === c
                      ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                      : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F766E]'
                  }`}
                >
                  {c} {t.classText}
                </button>
              ))}
            </div>
          </div>

          {/* Choose Avatar */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              {t.chooseAvatarLabel}:
            </label>
            <div className="grid grid-cols-6 gap-2">
              {HUMAN_AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`h-11 rounded-[12px] text-2xl flex items-center justify-center border transition-all ${
                    selectedAvatar === av
                      ? 'border-[#0F766E] bg-[#F0FDFA] scale-105 ring-2 ring-[#0F766E]'
                      : 'border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#0F766E]'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* 4-digit PIN */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              {t.setPinLabel}:
            </label>
            <input
              type="text"
              maxLength={4}
              pattern="\d{4}"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center text-lg font-mono font-bold tracking-widest p-2.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden text-[#0F172A]"
            />
          </div>

          {/* Safety Question & Answer for Zero-Email PIN Recovery */}
          <div className="bg-[#F0FDFA] p-3 rounded-[12px] border border-[#CCFBF1] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F766E]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t.securityQuestionLabel} ({t.noEmailOrOtpNeeded})</span>
            </div>

            <select
              value={securityQuestionId}
              onChange={(e) => setSecurityQuestionId(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-[8px] bg-white border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden text-[#0F172A] cursor-pointer"
            >
              {SAFETY_QUESTIONS.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.labels[currentLanguage] || q.labels.en}
                </option>
              ))}
            </select>

            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">
                {t.securityAnswerLabel}:
              </label>
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder={t.securityAnswerPlaceholder}
                className="w-full text-xs font-semibold p-2.5 rounded-[8px] bg-white border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden text-[#0F172A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3.5 rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-60 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{t.save}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
