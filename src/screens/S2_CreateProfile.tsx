import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, ShieldCheck, Globe, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnerProfile } from '../types';
import { hashPin } from '../services/pinHash';

const AVAILABLE_PACKS = [
  {
    id: 'te-10-maths-ap',
    lang: 'te',
    name: 'తెలుగు (Telugu)',
    desc: '10వ తరగతి గణితం (AP బోర్డు)',
    badge: 'తెలుగు',
    animals: [
      { name: 'చిరుత', animal: 'cheetah', emoji: '🐆' },
      { name: 'ఏనుగు', animal: 'elephant', emoji: '🐘' },
      { name: 'సింహం', animal: 'lion', emoji: '🦁' },
      { name: 'జింక', animal: 'deer', emoji: '🦌' },
      { name: 'నెమలి', animal: 'peacock', emoji: '🦚' },
      { name: 'తాబేలు', animal: 'tortoise', emoji: '🐢' },
    ],
  },
  {
    id: 'hi-10-maths-cbse',
    lang: 'hi',
    name: 'हिन्दी (Hindi)',
    desc: 'कक्षा 10 गणित (CBSE बोर्ड)',
    badge: 'हिन्दी',
    animals: [
      { name: 'चीता', animal: 'cheetah', emoji: '🐆' },
      { name: 'हाथी', animal: 'elephant', emoji: '🐘' },
      { name: 'शेर', animal: 'lion', emoji: '🦁' },
      { name: 'हिरण', animal: 'deer', emoji: '🦌' },
      { name: 'मोर', animal: 'peacock', emoji: '🦚' },
      { name: 'कछुआ', animal: 'tortoise', emoji: '🐢' },
    ],
  },
  {
    id: 'en-10-maths-cbse',
    lang: 'en',
    name: 'English',
    desc: 'Class 10 Mathematics (CBSE)',
    badge: 'English',
    animals: [
      { name: 'Cheetah', animal: 'cheetah', emoji: '🐆' },
      { name: 'Elephant', animal: 'elephant', emoji: '🐘' },
      { name: 'Lion', animal: 'lion', emoji: '🦁' },
      { name: 'Deer', animal: 'deer', emoji: '🦌' },
      { name: 'Peacock', animal: 'peacock', emoji: '🦚' },
      { name: 'Tortoise', animal: 'tortoise', emoji: '🐢' },
    ],
  },
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
  const { setScreen, createLearner, switchPack, pack } = useApp();

  const [selectedPackId, setSelectedPackId] = useState(pack?.id || 'te-10-maths-ap');
  const currentPackMeta = AVAILABLE_PACKS.find((p) => p.id === selectedPackId) || AVAILABLE_PACKS[0];

  const [selectedAnimal, setSelectedAnimal] = useState(currentPackMeta.animals[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  const handlePackChange = async (packId: string) => {
    setSelectedPackId(packId);
    await switchPack(packId);
    const meta = AVAILABLE_PACKS.find((p) => p.id === packId);
    if (meta) {
      // Find matching animal or default to first
      const match = meta.animals.find((a) => a.animal === selectedAnimal.animal) || meta.animals[0];
      setSelectedAnimal(match);
    }
  };

  const handleSave = async () => {
    const newProfile: LearnerProfile = {
      id: 'learner_' + Date.now(),
      nickname: selectedAnimal.name,
      animal: selectedAnimal.animal,
      avatarColor: selectedColor,
      avatarEmoji: selectedAnimal.emoji,
      packId: selectedPackId,
      pinHash: pin.length === 4 ? await hashPin(pin) : null,
      createdAt: Date.now(),
    };

    await createLearner(newProfile);
  };

  return (
    <div className="min-h-screen bg-cream-100 p-4 max-w-md mx-auto flex flex-col justify-between pb-8">
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

        {/* Language & Subject Selector Banner */}
        <div className="bg-white rounded-3xl p-4 border-2 border-indigo-200 shadow-xs mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Globe className="w-5 h-5 text-indigo-brand" />
            <span className="font-bold text-sm text-indigo-brand">
              {pack?.language === 'en'
                ? 'Choose Learning Language & Subject:'
                : pack?.language === 'hi'
                ? 'अध्ययन भाषा और विषय चुनें:'
                : 'అభ్యసన భాష మరియు సబ్జెక్ట్ ఎంచుకోండి:'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {AVAILABLE_PACKS.map((p) => {
              const isSelected = p.id === selectedPackId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePackChange(p.id)}
                  className={`p-2.5 rounded-2xl border-2 text-center transition-all active:scale-95 flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-indigo-brand bg-indigo-50/80 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold text-indigo-950">{p.badge}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {p.lang === 'te' ? '10వ గణితం' : p.lang === 'hi' ? '10 गणित' : 'Class 10'}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 font-medium text-center">
            {currentPackMeta.desc}
          </div>
        </div>

        {/* Selected Avatar Preview */}
        <div className="flex flex-col items-center justify-center py-4 bg-white rounded-3xl border border-slate-200 shadow-xs mb-5">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-md border-4 border-white transition-all transform scale-105 mb-2"
            style={{ backgroundColor: selectedColor }}
          >
            {selectedAnimal.emoji}
          </div>
          <span className="font-bold text-xl text-indigo-brand">{selectedAnimal.name}</span>
          <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {pack?.language === 'en'
                ? 'Child privacy protected • Pseudonymous'
                : pack?.language === 'hi'
                ? 'व्यक्तिगत गोपनीयता सुरक्षित'
                : 'వ్యక్తిగత గోప్యత రక్షించబడుతుంది'}
            </span>
          </div>
        </div>

        {/* 1. Animal Picker Grid */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-indigo-brand mb-2">
            {pack?.language === 'en'
              ? '1. Choose your animal avatar:'
              : pack?.language === 'hi'
              ? '1. अपना प्रतीक चुनें:'
              : '1. మీ జంతువు గుర్తును ఎంచుకోండి:'}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {currentPackMeta.animals.map((opt) => (
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
        <div className="mb-5">
          <label className="block text-sm font-bold text-indigo-brand mb-2">
            {pack?.language === 'en'
              ? '2. Pick your favorite color:'
              : pack?.language === 'hi'
              ? '2. अपना पसंदीदा रंग चुनें:'
              : '2. మీకు నచ్చిన రంగును ఎంచుకోండి:'}
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
                {pack?.language === 'en'
                  ? '4-Digit PIN (Optional)'
                  : pack?.language === 'hi'
                  ? '4 अंकों का पिन (वैकल्पिक)'
                  : '4 అంకెల పిన్ (ఐచ్ఛికం)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPinInput(!showPinInput)}
              className="text-xs font-bold text-lantern hover:underline"
            >
              {showPinInput
                ? pack?.language === 'en'
                  ? 'Cancel'
                  : pack?.language === 'hi'
                  ? 'रद्द करें'
                  : 'రద్దు చేయి'
                : pack?.language === 'en'
                ? 'Set PIN'
                : pack?.language === 'hi'
                ? 'पिन सेट करें'
                : 'పిన్ సెట్ చేయి'}
            </button>
          </div>

          {showPinInput && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 అంకెలు (4 digits)"
                className="w-full text-center text-2xl tracking-widest py-2 border-2 border-slate-300 rounded-xl focus:border-indigo-brand focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1 text-center">
                {pack?.language === 'en'
                  ? 'Shared phone lock prevents siblings from overwriting progress'
                  : pack?.language === 'hi'
                  ? 'साझा फोन पर भाई-बहनों से प्रगति सुरक्षित रखने के लिए'
                  : 'తోబుట్టువులతో ఫోన్ పంచుకున్నప్పుడు మీ ప్రోగ్రెస్ సురక్షితంగా ఉంటుంది'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-4 rounded-2xl bg-indigo-brand text-cream-100 font-bold text-base shadow-lg hover:bg-indigo-dark active:scale-98 transition-all min-h-[56px] flex items-center justify-center gap-2"
      >
        <Check className="w-5 h-5 text-amber-300" />
        <span>{pack?.uiStrings.saveProfile || 'ప్రొఫైల్ సేవ్ చేయి'}</span>
      </button>
    </div>
  );
};
