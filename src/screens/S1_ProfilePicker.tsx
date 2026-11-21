import React, { useState } from 'react';
import { Plus, Flame, HeartHandshake, FileCode2, Shield, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnerProfile } from '../types';
import { PinModal } from '../components/PinModal';

export const S1_ProfilePicker: React.FC = () => {
  const { learners, selectLearner, setScreen, pack } = useApp();
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<LearnerProfile | null>(null);

  const handleProfileClick = (profile: LearnerProfile) => {
    if (profile.pinHash) {
      setSelectedProfileForPin(profile);
    } else {
      selectLearner(profile);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      {/* Header Info */}
      <div className="text-center pt-6 pb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-brand text-amber-400 mb-3 shadow-md border-2 border-lantern">
          <span className="text-3xl">🏮</span>
        </div>
        <h1 className="text-2xl font-bold text-indigo-brand tracking-tight">
          {pack?.uiStrings.appTitle || 'విద్యాపథ్'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {pack?.uiStrings.whoIsLearning || 'ఎవరు చదువుకుంటున్నారు?'}
        </p>
      </div>

      {/* Profiles Grid */}
      <div className="flex-1 py-4">
        <div className="grid grid-cols-2 gap-4">
          {learners.map((learner) => (
            <button
              key={learner.id}
              type="button"
              onClick={() => handleProfileClick(learner)}
              className="bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-lantern shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center active:scale-95 group min-h-[140px]"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner border-2 border-white group-hover:scale-105 transition-transform"
                style={{ backgroundColor: learner.avatarColor }}
              >
                {learner.avatarEmoji}
              </div>
              <span className="font-bold text-lg text-indigo-brand group-hover:text-lantern transition-colors">
                {learner.nickname}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-600 mt-1 font-medium">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>లాంతరు వెలుగు</span>
              </div>
            </button>
          ))}

          {/* Add Learner Tile */}
          <button
            type="button"
            onClick={() => setScreen('S2_CREATE')}
            className="bg-cream-50 p-5 rounded-3xl border-2 border-dashed border-indigo-300 hover:border-indigo-brand hover:bg-white transition-all flex flex-col items-center justify-center text-center active:scale-95 min-h-[140px]"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-brand flex items-center justify-center mb-2">
              <Plus className="w-7 h-7" />
            </div>
            <span className="font-bold text-sm text-indigo-brand">
              {pack?.uiStrings.addNewLearner || 'కొత్త విద్యార్థిని చేర్చు'}
            </span>
          </button>
        </div>
      </div>

      {/* PIN Modal check if learner set a PIN */}
      {selectedProfileForPin && (
        <PinModal
          expectedPin={selectedProfileForPin.pinHash}
          onSuccess={() => {
            selectLearner(selectedProfileForPin);
            setSelectedProfileForPin(null);
          }}
          onCancel={() => setSelectedProfileForPin(null)}
        />
      )}

      {/* Footer Navigation: Guardian, Sponsor Impact, Pack Editor */}
      <div className="pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-indigo-brand">
          <button
            type="button"
            onClick={() => setScreen('S10_GUARDIAN')}
            className="flex items-center gap-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200"
          >
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>సంరక్షకుని వ్యూ</span>
          </button>
          <button
            type="button"
            onClick={() => setScreen('S11_IMPACT')}
            className="flex items-center gap-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200"
          >
            <HeartHandshake className="w-4 h-4 text-lantern" />
            <span>స్పాన్సర్ డాష్‌బోర్డ్</span>
          </button>
          <button
            type="button"
            onClick={() => setScreen('S12_PACK_EDITOR')}
            className="flex items-center gap-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200"
          >
            <FileCode2 className="w-4 h-4 text-indigo-light" />
            <span>ప్యాక్ ఎడిటర్</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 text-center mt-3">
          గోప్యత: ఎలాంటి వ్యక్తిగత పేర్లు, ఫోన్ నంబర్లు సేకరించబడవు.
        </p>
      </div>
    </div>
  );
};
