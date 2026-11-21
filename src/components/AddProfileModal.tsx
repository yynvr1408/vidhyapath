import React, { useState } from 'react';
import { X, Check, UserPlus } from 'lucide-react';
import { LearnerProfile } from '../types';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';

interface AddProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HUMAN_AVATARS = ['🐆', '🐘', '🦁', '👦', '👧', '👩‍🎓', '👨‍🎓', '🧑‍🎓'];
const AVATAR_COLORS = ['#0F766E', '#D97706', '#16A34A', '#2563EB', '#7C3AED'];

export const AddProfileModal: React.FC<AddProfileModalProps> = ({ isOpen, onClose }) => {
  const { createLearner, currentLanguage, pack } = useApp();
  const t = getTranslations(currentLanguage);

  const [name, setName] = useState('');
  const [classGrade, setClassGrade] = useState<number>(9);
  const [selectedAvatar, setSelectedAvatar] = useState(HUMAN_AVATARS[0]);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [pin, setPin] = useState('1234');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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
            <h3 className="font-bold text-base text-[#0F172A]">{t.addSampleProfile}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
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

          {/* Class Selector (Class 9 or Class 10) */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              {t.classLabel}:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[9, 10].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setClassGrade(c)}
                  className={`py-2.5 px-3 rounded-[12px] text-xs font-bold border transition-all ${
                    classGrade === c
                      ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
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
              placeholder="1234"
              className="w-full text-center text-lg font-mono font-bold tracking-widest p-2.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden text-[#0F172A]"
            />
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
