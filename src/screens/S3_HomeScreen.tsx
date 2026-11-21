import React from 'react';
import { BookOpen, Target, HelpCircle, TrendingUp, CheckCircle, Flame, ArrowRight, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { OfflineBanner } from '../components/OfflineBanner';
import { LanternVillage } from '../components/LanternVillage';
import { AudioButton } from '../components/AudioButton';
import { StudentAvatar } from '../components/StudentAvatar';

export const S3_HomeScreen: React.FC = () => {
  const { pack, activeLearner, setScreen, selectTopic } = useApp();

  const isEn = pack?.language === 'en';
  const isHi = pack?.language === 'hi';

  const handleStartLearn = () => {
    selectTopic(null);
    setScreen('S4_LESSON');
  };

  const handleStartPractice = () => {
    selectTopic(null);
    setScreen('S5_PRACTICE');
  };

  const handleAskDoubt = () => {
    setScreen('S7_DOUBT');
  };

  const welcomeSpokenText = isEn
    ? `Welcome ${activeLearner?.nickname}! Begin your mathematics practice today.`
    : isHi
    ? `स्वागत है ${activeLearner?.nickname}! आज अपना गणित अभ्यास शुरू करें।`
    : `స్వాగతం ${activeLearner?.nickname}! ఈరోజు మీ గణిత సాధన ప్రారంభించండి.`;

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col pb-8">
      <Header />
      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col">
        {/* Welcome Banner */}
        <div className="flex items-center justify-between mb-3 bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#D1E7DD] shadow-xs">
          <div className="flex items-center gap-3">
            <StudentAvatar learner={activeLearner} size="md" />
            <div>
              <div className="text-xs text-[#475569] font-medium">
                {isEn ? 'Welcome,' : isHi ? 'स्वागत है,' : 'స్వాగతం,'}
              </div>
              <div className="font-bold text-lg text-[#0F172A] flex items-center gap-1.5">
                {activeLearner?.nickname}
                <Flame className="w-4 h-4 text-[#16A34A] fill-[#16A34A]" />
              </div>
            </div>
          </div>
          <AudioButton
            text={welcomeSpokenText}
            label=""
            size="sm"
          />
        </div>

        {/* Lantern Village Metaphor Card */}
        <LanternVillage
          onSelectTopic={(topicId) => {
            selectTopic(topicId);
            setScreen('S4_LESSON');
          }}
        />

        {/* 3 Large Action Buttons */}
        <div className="grid grid-cols-1 gap-3.5 mb-5">
          {/* 1. Learn Button */}
          <button
            type="button"
            onClick={handleStartLearn}
            className="w-full bg-[#FFFFFF] hover:bg-[#F0FDF4] border-2 border-[#D1E7DD] hover:border-[#15803D] p-4 rounded-2xl shadow-xs transition-all flex items-center justify-between active:scale-98 group min-h-[72px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] flex items-center justify-center group-hover:bg-[#15803D] group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg text-[#0F172A]">
                  {pack?.uiStrings.learn || (isEn ? 'Learn' : isHi ? 'सीखें' : 'నేర్చుకో')}
                </div>
                <div className="text-xs text-[#475569] font-medium">
                  {isEn
                    ? 'Step-by-step concepts and worked examples'
                    : isHi
                    ? 'अवधारणाओं का विवरण और हल किए गए उदाहरण'
                    : 'పాఠాల వివరణలు మరియు ఉదాహరణలు'}
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#15803D] group-hover:translate-x-1 transition-all" />
          </button>

          {/* 2. Practice Button (Highlighted Primary #15803D CTA) */}
          <button
            type="button"
            onClick={handleStartPractice}
            className="w-full bg-[#15803D] hover:bg-[#166534] text-white p-4 rounded-2xl shadow-md transition-all flex items-center justify-between active:scale-98 group ring-4 ring-[#86EFAC] min-h-[76px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white text-[#15803D] flex items-center justify-center font-bold shadow-xs">
                <Target className="w-7 h-7" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-lg text-white flex items-center gap-2">
                  <span>{pack?.uiStrings.practice || (isEn ? 'Practice' : isHi ? 'अभ्यास करें' : 'సాధన చేయి')}</span>
                  <span className="text-[11px] bg-[#DCFCE7] text-[#14532D] px-2 py-0.5 rounded-full font-bold">
                    {isEn ? '5 Questions' : isHi ? '5 प्रश्न' : '5 ప్రశ్నలు'}
                  </span>
                </div>
                <div className="text-xs text-white/90 font-medium">
                  {isEn
                    ? 'Adaptive questions · Learn from mistakes'
                    : isHi
                    ? 'अनुकूली अभ्यास · गलतियों से सीखें'
                    : 'అడాప్టివ్ ప్రశ్నలు · తప్పుల నుండి నేర్చుకోండి'}
                </div>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </button>

          {/* 3. Ask a Doubt Button */}
          <button
            type="button"
            onClick={handleAskDoubt}
            className="w-full bg-[#FFFFFF] hover:bg-[#F0FDF4] border-2 border-[#D1E7DD] hover:border-[#15803D] p-4 rounded-2xl shadow-xs transition-all flex items-center justify-between active:scale-98 group min-h-[72px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#0D9488] border border-[#86EFAC] flex items-center justify-center group-hover:bg-[#0D9488] group-hover:text-white transition-colors">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg text-[#0F172A]">
                  {pack?.uiStrings.askDoubt || (isEn ? 'Ask a Doubt' : isHi ? 'संदेह पूछें' : 'సందేహం అడగండి')}
                </div>
                <div className="text-xs text-[#475569] font-medium">
                  {isEn
                    ? 'Ask via mic voice or type your question'
                    : isHi
                    ? 'माइक से बोलें या प्रश्न टाइप करें'
                    : 'మైక్ లేదా టైప్ ద్వారా సహాయం తీసుకోండి'}
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#15803D] group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Daily Goal & Progress Indicators */}
        <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#D1E7DD] shadow-xs mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#059669]" />
              {pack?.uiStrings.todayGoal || (isEn ? "Today's Goal" : isHi ? 'आज का लक्ष्य' : 'నేటి లక్ష్యం')}
            </span>
            <span className="text-xs font-bold text-[#14532D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-md border border-[#86EFAC]">
              {pack?.uiStrings.sessionsLeft ||
                (isEn ? '1 session remaining' : isHi ? '1 सत्र शेष' : 'ఇంకా 1 సెషన్ మిగిలి ఉంది')}
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden border border-[#D1E7DD]">
            <div className="bg-[#059669] h-full w-2/3 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#475569] mt-2 font-medium">
            <span>
              {isEn ? '2 of 3 sessions completed' : isHi ? '2 / 3 सत्र पूरे हुए' : '2 / 3 సెషన్లు పూర్తయ్యాయి'}
            </span>
            <span className="text-[#059669] font-bold flex items-center gap-1">
              {isEn
                ? '✓ Saved (Offline Safe)'
                : isHi
                ? '✓ सहेजा गया (ऑफलाइन सुरक्षित)'
                : '✓ సేవ్ అయింది (ఆఫ్‌లైన్ సురక్షితం)'}
            </span>
          </div>
        </div>

        {/* Progress & Guardian Quick Links */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            type="button"
            onClick={() => setScreen('S8_PROGRESS')}
            className="flex items-center justify-center gap-2 p-3 bg-[#FFFFFF] hover:bg-[#F0FDF4] rounded-xl border border-[#D1E7DD] text-sm font-bold text-[#0F172A] active:scale-95 transition-all min-h-[50px] hover:border-[#15803D] shadow-xs"
          >
            <TrendingUp className="w-4 h-4 text-[#15803D]" />
            <span>{pack?.uiStrings.myProgress || (isEn ? 'My Progress' : isHi ? 'मेरी प्रगति' : 'నా ప్రగతి')}</span>
          </button>

          <button
            type="button"
            onClick={() => setScreen('S10_GUARDIAN')}
            className="flex items-center justify-center gap-2 p-3 bg-[#FFFFFF] hover:bg-[#F0FDF4] rounded-xl border border-[#D1E7DD] text-sm font-bold text-[#059669] active:scale-95 transition-all min-h-[50px] hover:border-[#059669] shadow-xs"
          >
            <Share2 className="w-4 h-4 text-[#059669]" />
            <span>{isEn ? 'Guardian View' : isHi ? 'अभिभावक सारांश' : 'సంరక్షకుని సారాంశం'}</span>
          </button>
        </div>
      </main>
    </div>
  );
};
