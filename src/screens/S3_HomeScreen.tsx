import React from 'react';
import { BookOpen, Target, HelpCircle, TrendingUp, CheckCircle, Flame, ArrowRight, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { OfflineBanner } from '../components/OfflineBanner';
import { LanternVillage } from '../components/LanternVillage';
import { AudioButton } from '../components/AudioButton';

export const S3_HomeScreen: React.FC = () => {
  const { pack, activeLearner, setScreen, selectTopic } = useApp();

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

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col pb-8">
      <Header />
      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col">
        {/* Welcome Banner */}
        <div className="flex items-center justify-between mb-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 border-lantern shadow-xs"
              style={{ backgroundColor: activeLearner?.avatarColor }}
            >
              {activeLearner?.avatarEmoji}
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">స్వాగతం,</div>
              <div className="font-bold text-lg text-indigo-brand flex items-center gap-1.5">
                {activeLearner?.nickname}
                <Flame className="w-4 h-4 text-lantern fill-lantern" />
              </div>
            </div>
          </div>
          <AudioButton
            text={`స్వాగతం ${activeLearner?.nickname}! ఈరోజు మీ గణిత సాధన ప్రారంభించండి.`}
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

        {/* 3 Large Action Buttons (Section 10 wireframe) */}
        <div className="grid grid-cols-1 gap-3.5 mb-5">
          {/* 1. Learn Button */}
          <button
            type="button"
            onClick={handleStartLearn}
            className="w-full bg-white hover:bg-amber-50/50 border-2 border-indigo-brand/20 hover:border-indigo-brand p-4 rounded-2xl shadow-xs transition-all flex items-center justify-between active:scale-98 group min-h-[72px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-brand flex items-center justify-center group-hover:bg-indigo-brand group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg text-indigo-brand">
                  {pack?.uiStrings.learn || 'నేర్చుకో'}
                </div>
                <div className="text-xs text-slate-500">
                  పాఠాల వివరణలు మరియు ఉదాహరణలు
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-300 group-hover:text-indigo-brand group-hover:translate-x-1 transition-all" />
          </button>

          {/* 2. Practice Button (Highlighted Primary) */}
          <button
            type="button"
            onClick={handleStartPractice}
            className="w-full bg-indigo-brand hover:bg-indigo-dark text-white p-4 rounded-2xl shadow-md transition-all flex items-center justify-between active:scale-98 group ring-4 ring-indigo-200/50 min-h-[76px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-indigo-dark flex items-center justify-center font-bold">
                <Target className="w-7 h-7" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg text-amber-300 flex items-center gap-2">
                  {pack?.uiStrings.practice || 'సాధన చేయి'}
                  <span className="text-[11px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full font-normal border border-amber-400/30">
                    5 ప్రశ్నలు
                  </span>
                </div>
                <div className="text-xs text-indigo-200">
                  అడాప్టివ్ ప్రశ్నలు · తప్పుల నుండి నేర్చుకోండి
                </div>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 3. Ask a Doubt Button */}
          <button
            type="button"
            onClick={handleAskDoubt}
            className="w-full bg-white hover:bg-amber-50/50 border-2 border-slate-200 hover:border-lantern p-4 rounded-2xl shadow-xs transition-all flex items-center justify-between active:scale-98 group min-h-[72px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <HelpCircle className="w-6 h-6 text-lantern" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg text-indigo-brand">
                  {pack?.uiStrings.askDoubt || 'సందేహం అడగండి'}
                </div>
                <div className="text-xs text-slate-500">
                  మైక్ లేదా టైప్ ద్వారా సహాయం తీసుకోండి
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-lantern group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Daily Goal & Progress Indicators */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-indigo-brand flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {pack?.uiStrings.todayGoal || 'నేటి లక్ష్యం'}
            </span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {pack?.uiStrings.sessionsLeft || 'ఇంకా 1 సెషన్ మిగిలి ఉంది'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-full w-2/3 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>2 / 3 సెషన్లు పూర్తయ్యాయి</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              ✓ సేవ్ అయింది (ఆఫ్‌లైన్ సురక్షితం)
            </span>
          </div>
        </div>

        {/* Progress & Guardian Quick Links */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            type="button"
            onClick={() => setScreen('S8_PROGRESS')}
            className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-indigo-brand active:scale-95 transition-all min-h-[50px]"
          >
            <TrendingUp className="w-4 h-4 text-indigo-light" />
            <span>{pack?.uiStrings.myProgress || 'నా ప్రగతి'}</span>
          </button>

          <button
            type="button"
            onClick={() => setScreen('S10_GUARDIAN')}
            className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-emerald-700 active:scale-95 transition-all min-h-[50px]"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>సంరక్షకుని సారాంశం</span>
          </button>
        </div>
      </main>
    </div>
  );
};
