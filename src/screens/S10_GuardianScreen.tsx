import React, { useState } from 'react';
import { ArrowLeft, Shield, Share2, Heart, Sparkles, CheckCircle2, AlertCircle, Copy, Check, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AudioButton } from '../components/AudioButton';

export const S10_GuardianScreen: React.FC = () => {
  const { activeLearner, setScreen } = useApp();
  const [copied, setCopied] = useState(false);

  // View-only dummy token or current learner data
  const nickname = activeLearner?.nickname || 'చిరుత (Cheetah)';
  const tokenUrl = `${window.location.origin}/#guardian?token=g_token_cheetah_01`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tokenUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const summaryData = {
    week: 'ఈ వారం సమీక్ష (Weekly Summary)',
    sessionsCompleted: 6,
    accuracyPercent: 82,
    strongSkills: [
      'యూక్లిడ్ భాగహార న్యాయం (Euclid Lemma)',
      'ప్రధాన కారణాంకాలు (Prime Factors)',
      'సమితుల సమ్మేళనం (Union ∪)'
    ],
    weakSkill: 'సమితుల భేదం (Difference A - B)',
    suggestedAction: 'రెండు వర్తులాలు (Venn Diagram) కాగితంపై గీసి, మొదటి వృత్తంలో మాత్రమే ఉండే భాగం గుర్తించడాన్ని సాధన చేయించండి.',
    practiceTogetherPrompt: 'ఇంట్లో ఉన్న పప్పులు లేదా గింజలను రెండు పళ్ళాలలో ఉంచి, మొదటి పళ్ళెంలో మాత్రమే ఉన్నవాటిని వేరుచేసే సరదా ఆట ఆడండి.'
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col pb-8">
      {/* Top Header */}
      <header className="bg-emerald-800 text-white px-4 py-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen(activeLearner ? 'S3_HOME' : 'S1_PICKER')}
              className="p-2 rounded-xl bg-emerald-900 hover:bg-emerald-700 text-white active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <Shield className="w-5 h-5 text-emerald-300" />
              <span className="font-bold text-base">సంరక్షకుని సారాంశం (Guardian View)</span>
            </div>
          </div>
          <AudioButton
            text={`సంరక్షకుని సారాంశం. విద్యార్థి ${nickname}. ఈ వారం 6 సెషన్లు పూర్తి చేశారు. ఖచ్చితత్వం 82 శాతం.`}
            label=""
            size="sm"
          />
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 space-y-4">
        {/* Banner Card */}
        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-bold border-2 border-emerald-300">
              {activeLearner?.avatarEmoji || '🐆'}
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">విద్యార్థి ప్రొఫైల్ (చూడటానికి మాత్రమే)</div>
              <h2 className="text-lg font-bold text-slate-900">{nickname}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-center">
            <div>
              <div className="text-2xl font-black text-emerald-800">{summaryData.sessionsCompleted}</div>
              <div className="text-[11px] font-bold text-emerald-950">పూర్తయిన సెషన్లు</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-800">{summaryData.accuracyPercent}%</div>
              <div className="text-[11px] font-bold text-emerald-950">సగటు ఖచ్చితత్వం</div>
            </div>
          </div>
        </div>

        {/* Strong Skills */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
          <h3 className="font-bold text-sm text-indigo-brand mb-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>బాగా వచ్చిన అంశాలు (Strong Topics):</span>
          </h3>
          <ul className="space-y-1.5">
            {summaryData.strongSkills.map((sk, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{sk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weak Skill & Suggested Action */}
        <div className="bg-white rounded-3xl p-5 border-2 border-amber-300 shadow-xs">
          <h3 className="font-bold text-sm text-amber-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>మరింత శ్రద్ధ అవసరమైన అంశం (Weak Skill):</span>
          </h3>
          <div className="text-xs font-bold text-slate-900 mb-3 bg-amber-50 p-2 rounded-xl border border-amber-200">
            {summaryData.weakSkill}
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="text-xs font-bold text-indigo-brand uppercase mb-1">
              తల్లిదండ్రులు / పెద్దలు చేయవలసిన సూచన:
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {summaryData.suggestedAction}
            </p>
          </div>
        </div>

        {/* Practice Together Activity Card */}
        <div className="bg-linear-to-br from-indigo-900 to-indigo-brand text-white rounded-3xl p-5 shadow-md">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-300 mb-2">
            <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>కలిసి సాధన చేద్దాం (Practice Together):</span>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed font-medium mb-3">
            {summaryData.practiceTogetherPrompt}
          </p>
          <div className="text-[11px] text-amber-200/90 font-medium italic">
            "తల్లిదండ్రుల చిన్న ప్రోత్సాహం పిల్లలలో గణిత భయాన్ని తొలగిస్తుంది."
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
          <p className="text-xs text-slate-600 mb-3">
            ఈ పేజీని లాగిన్ లేకుండా చూడటానికి మీ కుటుంబ సభ్యులకు ఈ లింక్‌ను పంపవచ్చు:
          </p>
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-brand font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-slate-200"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'లింక్ కాపీ అయింది!' : 'సంరక్షకుని లింక్ కాపీ చేయండి'}</span>
          </button>
        </div>

        {/* Link to cohort (teacher/volunteer) view */}
        <button
          type="button"
          onClick={() => setScreen('S13_COHORT')}
          className="w-full min-h-[56px] py-3 px-4 rounded-xl bg-indigo-brand text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Users className="w-5 h-5" />
          <span>ఉపాధ్యాయ వీక్షణ (teacher view)</span> {/* TODO native review */}
        </button>
      </main>
    </div>
  );
};
