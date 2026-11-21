import React, { useState } from 'react';
import { ArrowLeft, Database, Type, Trash2, Users, Shield, HardDrive, Check, Sparkles, Globe, BookOpen, Download, Lock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { AppUpdateButton } from '../components/AppUpdateButton';

const AVAILABLE_PACKS = [
  {
    id: 'te-10-maths-ap',
    name: 'తెలుగు (Telugu)',
    sub: '10వ గణితం (AP బోర్డు)',
    badge: 'తెలుగు 10వ',
    isFree: true,
    size: '18 KB',
    tier: 'ఉచితం (Class 1-10 Rural)',
  },
  {
    id: 'hi-10-maths-cbse',
    name: 'हिन्दी (Hindi)',
    sub: 'कक्षा 10 गणित (CBSE)',
    badge: 'हिन्दी 10वीं',
    isFree: true,
    size: '14 KB',
    tier: 'मुफ्त (Class 1-10 Rural)',
  },
  {
    id: 'en-10-maths-cbse',
    name: 'English',
    sub: 'Class 10 Maths (CBSE)',
    badge: 'English 10th',
    isFree: true,
    size: '16 KB',
    tier: 'Free (Class 1-10 Rural)',
  },
  {
    id: 'te-11-maths-inter',
    name: 'ఇంటర్మీడియట్ (Class 11-12)',
    sub: 'గణితం & సైన్స్ (Inter Board / JEE)',
    badge: 'ఇంటర్ / 12వ',
    isFree: false,
    size: '65 KB',
    tier: '🔒 ప్రీమియం చందా (Subscription)',
  },
];

export const S9_SettingsScreen: React.FC = () => {
  const {
    pack,
    switchPack,
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
  const [switchingPack, setSwitchingPack] = useState(false);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);

  const handlePackSwitch = async (packItem: typeof AVAILABLE_PACKS[0]) => {
    if (!packItem.isFree) {
      setShowSubscriptionAlert(true);
      return;
    }
    if (packItem.id === pack?.id) return;
    setSwitchingPack(true);
    await switchPack(packItem.id);
    setTimeout(() => setSwitchingPack(false), 500);
  };

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
        {/* 0. Subject & Curriculum Catalog (Instant Offline Unpack) */}
        <div className="bg-white rounded-3xl p-5 border-2 border-indigo-200 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-brand flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-indigo-brand">
                {pack?.language === 'en'
                  ? 'Subject & Curriculum Catalog'
                  : pack?.language === 'hi'
                  ? 'विषय और पाठ्यक्रम कैटलॉग'
                  : 'సబ్జెక్టులు & పాఠ్యాంశాల కేటలాగ్'}
              </h3>
              <p className="text-xs text-slate-500">
                {pack?.language === 'en'
                  ? '1-Tap download: Unpacks locally for 100% offline access'
                  : pack?.language === 'hi'
                  ? '1-टैप डाउनलोड: 100% ऑफ़लाइन उपयोग के लिए स्वतः अनपैक होता है'
                  : '1-ట్యాప్ డౌన్‌లోడ్: ఆఫ్‌లైన్‌లో వాడటానికి నేరుగా ఫోన్‌లో అన్‌ప్యాక్ అవుతుంది'}
              </p>
            </div>
          </div>

          {/* Rural Grant Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-950 leading-relaxed">
              <strong>గ్రామీణ విద్యార్థుల పథకం:</strong> 1 నుండి 10వ తరగతి వరకు ప్రభుత్వ & గ్రామీణ పాఠశాలల విద్యార్థులకు సిలబస్ ప్యాక్‌లన్నీ <strong>100% ఉచితం</strong> (CSR ఫౌండేషన్ గ్రాంట్ల ద్వారా).
            </div>
          </div>

          <div className="space-y-2">
            {AVAILABLE_PACKS.map((p) => {
              const isSelected = p.id === (pack?.id || 'te-10-maths-ap');
              return (
                <div
                  key={p.id}
                  onClick={() => handlePackSwitch(p)}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-indigo-brand bg-indigo-50/80 shadow-xs ring-2 ring-indigo-300'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      p.isFree ? 'bg-indigo-100 text-indigo-900' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {p.isFree ? '📚' : <Lock className="w-4 h-4 text-amber-700" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-md font-semibold">
                            ప్రస్తుతం సక్రియంగా ఉంది
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{p.sub} • {p.size}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                      p.isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {p.tier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subscription Alert Modal / Card */}
          {showSubscriptionAlert && (
            <div className="mt-3 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  సంస్థాగత చందా అవసరం (Institutional Subscription)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSubscriptionAlert(false)}
                  className="text-xs text-amber-800 font-bold hover:underline"
                >
                  మూసివేయి
                </button>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                10వ తరగతి దాటిన ఇంటర్మీడియట్, 11-12వ తరగతి మరియు JEE/NEET పోటీ పరీక్షల సబ్జెక్టుల కొరకు పాఠశాల/కళాశాల సంస్థాగత సబ్‌స్క్రిప్షన్ లేదా వ్యక్తిగత ప్రీమియం ఖాతా అవసరం.
              </p>
            </div>
          )}

          {switchingPack && (
            <div className="text-center text-xs text-indigo-brand font-bold mt-2 animate-pulse">
              ప్యాక్ డౌన్‌లోడ్ అయ్యి అన్‌ప్యాక్ చేయబడుతోంది...
            </div>
          )}
        </div>

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
