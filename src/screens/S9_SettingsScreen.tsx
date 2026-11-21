import React, { useState } from 'react';
import { ArrowLeft, Database, Type, Trash2, Users, Shield, HardDrive, Check, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { AppUpdateButton } from '../components/AppUpdateButton';

export const S9_SettingsScreen: React.FC = () => {
  const {
    lowDataMode,
    toggleLowDataMode,
    fontSize,
    setFontSize,
    dataUsedKb,
    clearAiCache,
    switchLearner,
    setScreen,
  } = useApp();

  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = async () => {
    await clearAiCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col pb-8">
      {/* Header */}
      <header className="bg-indigo-brand text-white px-4 py-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setScreen('S3_HOME')}
            className="p-2 rounded-xl bg-indigo-light hover:bg-indigo-dark text-white active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-base">సెట్టింగులు (Settings)</span>
        </div>
      </header>

      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 space-y-4">
        {/* 1. Low-Data Mode Toggle */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-brand flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-indigo-brand" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-indigo-brand">తక్కువ డేటా మోడ్ (Low Data Mode)</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  డేటాను ఆదా చేస్తుంది. చిత్రాలు మరియు వాయిస్ అప్‌లోడ్ నిలిపివేయబడతాయి. ఆన్-డివైస్ తెలుగు ఆడియో పనిచేస్తుంది.
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={toggleLowDataMode}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                lowDataMode ? 'bg-indigo-brand justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md"></div>
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>ప్రస్తుత మోడ్:</span>
            <span className={lowDataMode ? 'text-indigo-brand font-bold' : 'text-slate-500'}>
              {lowDataMode ? 'తక్కువ డేటా మోడ్ ఆన్‌లో ఉంది' : 'సాధారణ మోడ్ (పూర్తి ఫీచర్లు)'}
            </span>
          </div>
        </div>

        {/* 2. Font Size Adjustment */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-lantern flex items-center justify-center">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-indigo-brand">అక్షరాల పరిమాణం (Font Size)</h3>
              <p className="text-xs text-slate-500">తెలుగు లిపి సులభంగా చదవడానికి అనువైన పరిమాణం</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'సాధారణ (18px)' },
              { id: 'large', label: 'పెద్దది (20px)' },
              { id: 'xlarge', label: 'చాలా పెద్దది (22px)' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFontSize(f.id as any)}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                  fontSize === f.id
                    ? 'bg-indigo-brand text-amber-300 border-indigo-brand shadow-xs'
                    : 'bg-cream-50 text-slate-700 border-slate-200 hover:bg-cream-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Data Consumption & Storage */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-indigo-brand">డేటా మరియు నిల్వ (Storage & Data)</h3>
              <p className="text-xs text-slate-500">నెట్‌వర్క్ వినియోగం మరియు కాష్ నిర్వహణ</p>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">ఈ సెషన్‌లో ఉపయోగించిన డేటా:</span>
            <span className="text-sm font-black text-indigo-brand">{dataUsedKb} KB</span>
          </div>

          {/* Clear AI Cache */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleClearCache}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4 text-slate-500" />
              <span>AI వివరణల కాష్‌ను క్లియర్ చేయి (ప్రోగ్రెస్ అలాగే ఉంటుంది)</span>
            </button>
            {cacheCleared && (
              <div className="text-center text-xs text-emerald-700 font-bold mt-2 flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>కాష్ విజయవంతంగా తొలగించబడింది!</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. App Version & GitHub Updates */}
        <div className="pt-1">
          <AppUpdateButton />
        </div>

        {/* 5. Switch Learner Profile */}
        <div className="pt-2">
          <button
            type="button"
            onClick={switchLearner}
            className="w-full py-4 rounded-2xl bg-white border-2 border-indigo-200 hover:border-indigo-brand text-indigo-brand font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[56px]"
          >
            <Users className="w-5 h-5 text-lantern" />
            <span>మరొక విద్యార్థి ప్రొఫైల్‌కు మారండి (Switch Learner)</span>
          </button>
        </div>
      </main>
    </div>
  );
};
