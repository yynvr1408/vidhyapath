import React from 'react';
import { Users, Settings, Flame, ShieldCheck, HeartHandshake, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudentAvatar } from './StudentAvatar';
import { VidyapathLogo } from './VidyapathLogo';

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
    <header className="bg-[#FFFFFF] text-[#0F172A] px-4 py-3 flex items-center justify-between shadow-xs border-b border-[#D1E7DD] sticky top-0 z-40">
      {/* Left: Active Learner Profile Avatar or Creative Logo */}
      <div className="flex items-center gap-3">
        {activeLearner ? (
          <div
            onClick={() => setScreen('S3_HOME')}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-80"
          >
            <StudentAvatar learner={activeLearner} size="sm" />
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-wide leading-tight flex items-center gap-1.5 text-[#0F172A]">
                {activeLearner.nickname}
                <Flame className="w-4 h-4 text-[#16A34A] fill-[#16A34A]" />
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                <span className="font-mono text-[#15803D] font-bold">{activeLearner.loginCode}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-[#059669] font-medium">
                  <ShieldCheck className="w-3 h-3 text-[#059669]" />
                  <span>{pack?.language === 'en' ? 'Saved' : pack?.language === 'hi' ? 'सहेजा गया' : 'సేవ్ అయింది'}</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div onClick={() => setScreen('S1_PICKER')} className="cursor-pointer">
            <VidyapathLogo size="sm" showWordmark={true} />
          </div>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Language Pack Selector: Telugu, English, Hindi */}
        <div className="relative flex items-center">
          <BookOpen className="w-3.5 h-3.5 text-[#15803D] absolute left-2.5 pointer-events-none" />
          <select
            value={pack?.id || 'te-10-maths-ap'}
            onChange={(e) => switchPack(e.target.value)}
            title="Switch Language Pack / భాష మార్చు"
            className="text-xs bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] font-bold pl-7 pr-2.5 py-1.5 rounded-xl border border-[#D1E7DD] focus:border-[#15803D] focus:outline-hidden min-h-[40px] transition-all cursor-pointer shadow-2xs"
          >
            <option value="te-10-maths-ap">తెలుగు</option>
            <option value="en-10-maths-cbse">English</option>
            <option value="hi-10-maths-cbse">हिन्दी</option>
          </select>
        </div>

        {/* Switch Learner (1-tap for shared phone) */}
        {activeLearner && (
          <button
            type="button"
            onClick={switchLearner}
            title={pack?.language === 'en' ? 'Switch Student' : pack?.language === 'hi' ? 'शिक्षार्थी बदलें' : 'విద్యార్థిని మార్చు'}
            className="p-2 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] transition-all active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center border border-[#D1E7DD] hover:border-[#15803D]"
          >
            <Users className="w-4 h-4 text-[#15803D]" />
          </button>
        )}

        {/* Sponsor Impact Quick Link */}
        <button
          type="button"
          onClick={() => setScreen(currentScreen === 'S11_IMPACT' ? 'S3_HOME' : 'S11_IMPACT')}
          title="Sponsor Impact / స్పాన్సర్ ఇంపాక్ట్"
          className={`p-2 rounded-xl transition-all active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center border ${
            currentScreen === 'S11_IMPACT'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-[#F4F9F6] text-[#0F172A] border-[#D1E7DD] hover:border-[#15803D]'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-[#16A34A]" />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={() => setScreen(currentScreen === 'S9_SETTINGS' ? 'S3_HOME' : 'S9_SETTINGS')}
          title="Settings / సెట్టింగులు"
          className={`p-2 rounded-xl transition-all active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center border ${
            currentScreen === 'S9_SETTINGS'
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-[#F4F9F6] text-[#0F172A] border-[#D1E7DD] hover:border-[#15803D]'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
