import React from 'react';
import { Users, Settings, Flame, ShieldCheck, HeartHandshake, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppUpdateButton } from './AppUpdateButton';

export const Header: React.FC = () => {
  const {
    activeLearner,
    switchLearner,
    setScreen,
    currentScreen,
    pack,
    switchPack
  } = useApp();

  return (
    <header className="bg-indigo-brand text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-40">
      {/* Left: Active Learner Profile Avatar & Nickname */}
      <div className="flex items-center gap-3">
        {activeLearner ? (
          <div
            onClick={() => setScreen('S3_HOME')}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-80"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm border-2 border-lantern"
              style={{ backgroundColor: activeLearner.avatarColor }}
            >
              {activeLearner.avatarEmoji}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-wide leading-tight flex items-center gap-1.5">
                {activeLearner.nickname}
                <Flame className="w-4 h-4 text-lantern fill-lantern" />
              </span>
              <div className="flex items-center gap-1 text-[11px] text-indigo-200">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>సేవ్ అయింది</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xl">🏮</span>
            <span className="font-bold text-lg text-cream-100">విద్యాపథ్</span>
          </div>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Language Pack Selector / Preview Stub Switcher */}
        <button
          type="button"
          onClick={() => {
            if (pack?.id === 'te-10-maths-ap') {
              switchPack('hi-10-maths-cbse');
            } else {
              switchPack('te-10-maths-ap');
            }
          }}
          title="భాష మార్చు / Switch Language Pack"
          className="text-xs bg-indigo-light/80 hover:bg-indigo-light text-cream-100 px-2.5 py-1.5 rounded-lg border border-indigo-400/30 flex items-center gap-1 min-h-[40px]"
        >
          <BookOpen className="w-3.5 h-3.5 text-lantern" />
          <span className="font-semibold">{pack?.language === 'te' ? 'తెలుగు' : 'हिन्दी (Stub)'}</span>
        </button>

        {/* Switch Learner (1-tap for shared phone) */}
        {activeLearner && (
          <button
            type="button"
            onClick={switchLearner}
            title="విద్యార్థిని మార్చు / Switch Learner"
            className="p-2 rounded-xl bg-indigo-light/60 hover:bg-indigo-light text-cream-100 transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center border border-indigo-400/20"
          >
            <Users className="w-5 h-5 text-amber-300" />
          </button>
        )}

        {/* Sponsor Impact Quick Link */}
        <button
          type="button"
          onClick={() => setScreen(currentScreen === 'S11_IMPACT' ? 'S3_HOME' : 'S11_IMPACT')}
          title="స్పాన్సర్ డాష్‌బోర్డ్ / Sponsor Impact"
          className={`p-2 rounded-xl transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center border ${
            currentScreen === 'S11_IMPACT'
              ? 'bg-amber-500 text-indigo-900 border-amber-300'
              : 'bg-indigo-light/60 text-cream-100 border-indigo-400/20'
          }`}
        >
          <HeartHandshake className="w-5 h-5 text-lantern" />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={() => setScreen(currentScreen === 'S9_SETTINGS' ? 'S3_HOME' : 'S9_SETTINGS')}
          title="సెట్టింగులు / Settings"
          className={`p-2 rounded-xl transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center border ${
            currentScreen === 'S9_SETTINGS'
              ? 'bg-amber-500 text-indigo-900 border-amber-300'
              : 'bg-indigo-light/60 text-cream-100 border-indigo-400/20'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* GitHub In-App Auto-Update Button */}
        <AppUpdateButton minimal={true} />
      </div>
    </header>
  );
};
