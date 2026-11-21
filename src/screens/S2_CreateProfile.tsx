import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnerProfile } from '../types';
import { hashPin } from '../services/pinHash';

const ANIMAL_OPTIONS = [
  { name: 'చిరుత', animal: 'cheetah', emoji: '🐆' },
  { name: 'ఏనుగు', animal: 'elephant', emoji: '🐘' },
  { name: 'సింహం', animal: 'lion', emoji: '🦁' },
  { name: 'జింక', animal: 'deer', emoji: '🦌' },
  { name: 'నెమలి', animal: 'peacock', emoji: '🦚' },
  { name: 'తాబేలు', animal: 'tortoise', emoji: '🐢' },
];

const COLOR_OPTIONS = [
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
];

export const S2_CreateProfile: React.FC = () => {
  const { setScreen, createLearner, pack } = useApp();

  const [selectedAnimal, setSelectedAnimal] = useState(ANIMAL_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  const handleSave = async () => {
    const newProfile: LearnerProfile = {
      id: 'learner_' + Date.now(),
      nickname: selectedAnimal.name,
      animal: selectedAnimal.animal,
      avatarColor: selectedColor,
      avatarEmoji: selectedAnimal.emoji,
      packId: pack?.id || 'te-10-maths-ap',
      pinHash: pin.length === 4 ? await hashPin(pin) : null,
      createdAt: Date.now(),
    };

    await createLearner(newProfile);
  };

  return (
    <div className="min-h-screen bg-cream-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setScreen('S1_PICKER')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-indigo-brand">
            {pack?.uiStrings.addNewLearner || 'కొత్త విద్యార్థిని చేర్చు'}
          </h1>
        </div>

        {/* Selected Avatar Preview */}
        <div className="flex flex-col items-center justify-center py-4 bg-white rounded-3xl border border-slate-200 shadow-xs mb-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-md border-4 border-white transition-all transform scale-105 mb-2"
            style={{ backgroundColor: selectedColor }}
          >
            {selectedAnimal.emoji}
          </div>
          <span className="font-bold text-xl text-indigo-brand">{selectedAnimal.name}</span>
          <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>వ్యక్తిగత గోప్యత రక్షించబడుతుంది</span>
          </div>
        </div>

        {/* 1. Animal Picker Grid */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-indigo-brand mb-2">
            1. మీ జంతువు గుర్తును ఎంచుకోండి:
          </label>
          <div className="grid grid-cols-3 gap-3">
            {ANIMAL_OPTIONS.map((opt) => (
              <button
                key={opt.animal}
                type="button"
                onClick={() => setSelectedAnimal(opt)}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center transition-all active:scale-95 ${
                  selectedAnimal.animal === opt.animal
                    ? 'border-indigo-brand bg-indigo-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-3xl mb-1">{opt.emoji}</span>
                <span className="text-xs font-bold text-slate-800">{opt.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Color Picker */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-indigo-brand mb-2">
            2. మీకు నచ్చిన రంగును ఎంచుకోండి:
          </label>
          <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  selectedColor === color ? 'ring-4 ring-indigo-brand ring-offset-2 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Optional 4-digit PIN */}
        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-brand" />
              <span className="font-bold text-sm text-indigo-brand">
                4 అంకెల పిన్ (ఐచ్ఛికం)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPinInput(!showPinInput)}
              className="text-xs font-bold text-lantern hover:underline"
            >
              {showPinInput ? 'రద్దు చేయి' : 'పిన్ సెట్ చేయి'}
            </button>
          </div>

          {showPinInput && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">
                ఒకే ఫోన్ కుటుంబంలో పంచుకున్నప్పుడు మీ ప్రొఫైల్ లాక్ చేసుకోవడానికి:
              </p>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 అంకెల సంఖ్య"
                className="w-full text-center text-2xl tracking-widest font-bold py-2 rounded-xl border-2 border-indigo-200 focus:border-indigo-brand focus:outline-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-indigo-brand text-white font-bold text-lg hover:bg-indigo-dark shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[56px]"
        >
          <Check className="w-6 h-6 text-amber-400" />
          <span>{pack?.uiStrings.saveProfile || 'ప్రొఫైల్ సేవ్ చేయి'}</span>
        </button>
      </div>
    </div>
  );
};
