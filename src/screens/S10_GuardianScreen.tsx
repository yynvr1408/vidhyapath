import React, { useState } from 'react';
import { ArrowLeft, Shield, Heart, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AudioButton } from '../components/AudioButton';
import { StudentAvatar } from '../components/StudentAvatar';

export const S10_GuardianScreen: React.FC = () => {
  const { activeLearner, setScreen, pack } = useApp();
  const [copied, setCopied] = useState(false);

  const isEn = pack?.language === 'en';
  const isHi = pack?.language === 'hi';

  const nickname = activeLearner?.nickname || (isEn ? 'Priya' : isHi ? 'प्रिया' : 'ప్రియ (Priya)');
  const tokenUrl = `${window.location.origin}/#guardian?token=g_token_priya_01`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tokenUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const summaryData = isEn
    ? {
        week: 'Weekly Summary',
        sessionsCompleted: 6,
        accuracyPercent: 82,
        strongSkills: [
          "Euclid's Division Lemma (HCF)",
          'Fundamental Theorem of Arithmetic (Prime Factors)',
          'Union and Sets Definition (∪)',
        ],
        weakSkill: 'Set Difference (A - B)',
        suggestedAction:
          'Draw two circles (Venn Diagram) on paper and practice shading the region that belongs exclusively to set A.',
        practiceTogetherPrompt:
          'Take two bowls with different lentils or beans at home. Play a quick game identifying items that belong only to the first bowl.',
      }
    : isHi
    ? {
        week: 'साप्ताहिक सारांश',
        sessionsCompleted: 6,
        accuracyPercent: 82,
        strongSkills: [
          'यूक्लिड विभाजन प्रमेयिका (म.स.प.)',
          'अंकगणित की आधारभूत प्रमेय (अभाज्य गुणनखंड)',
          'समुच्चयों का सम्मिलन (Union ∪)',
        ],
        weakSkill: 'समुच्चयों का अंतर (A - B)',
        suggestedAction:
          'कागज़ पर दो वृत्त (वेन आरेख) खींचें और केवल पहले समुच्चय में आने वाले भाग को पहचानने का अभ्यास कराएं।',
        practiceTogetherPrompt:
          'घर में दो कटोरियों में अलग-अलग दालें या अनाज रखें। एक कटोरी में से अनूठे दानों को अलग करने का मजेदार अभ्यास करें।',
      }
    : {
        week: 'ఈ వారం సమీక్ష (Weekly Summary)',
        sessionsCompleted: 6,
        accuracyPercent: 82,
        strongSkills: [
          'యూక్లిడ్ భాగహార న్యాయం (Euclid Lemma)',
          'ప్రధాన కారణాంకాలు (Prime Factors)',
          'సమితుల సమ్మేళనం (Union ∪)',
        ],
        weakSkill: 'సమితుల భేదం (Difference A - B)',
        suggestedAction:
          'రెండు వృత్తాలు (Venn Diagram) కాగితంపై గీసి, మొదటి వృత్తంలో మాత్రమే ఉండే భాగం గుర్తించడాన్ని సాధన చేయించండి.',
        practiceTogetherPrompt:
          'ఇంట్లో ఉన్న పప్పులు లేదా గింజలను రెండు పళ్ళాలలో ఉంచి, మొదటి పళ్ళెంలో మాత్రమే ఉన్నవాటిని వేరుచేసే సరదా ఆట ఆడండి.',
      };

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col pb-8">
      {/* Top Header */}
      <header className="bg-[#FFFFFF] text-[#0F172A] px-4 py-3 shadow-xs border-b border-[#D1E7DD] sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen(activeLearner ? 'S3_HOME' : 'S1_PICKER')}
              className="p-2 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] active:scale-95 border border-[#D1E7DD]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <Shield className="w-5 h-5 text-[#059669]" />
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
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <StudentAvatar learner={activeLearner} size="lg" />
            <div>
              <div className="text-xs text-[#475569] font-medium">విద్యార్థి ప్రొఫైల్ (వీక్షణ మాత్రమే · Zero-PII)</div>
              <h2 className="text-lg font-bold text-[#0F172A]">{nickname}</h2>
              {activeLearner?.loginCode && (
                <span className="text-xs font-mono text-[#15803D] font-bold">కోడ్: {activeLearner.loginCode}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-[#F4F9F6] p-3.5 rounded-2xl border border-[#D1E7DD] text-center">
            <div>
              <div className="text-2xl font-black text-[#059669]">{summaryData.sessionsCompleted}</div>
              <div className="text-[11px] font-bold text-[#475569]">పూర్తయిన సెషన్లు</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#059669]">{summaryData.accuracyPercent}%</div>
              <div className="text-[11px] font-bold text-[#475569]">సగటు ఖచ్చితత్వం</div>
            </div>
          </div>
        </div>

        {/* Strong Skills */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
          <h3 className="font-bold text-sm text-[#059669] mb-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#059669]" />
            <span>బాగా వచ్చిన అంశాలు (Strong Topics):</span>
          </h3>
          <ul className="space-y-1.5">
            {summaryData.strongSkills.map((sk, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] bg-[#DCFCE7] p-2.5 rounded-xl border border-[#86EFAC]">
                <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
                <span>{sk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weak Skill & Suggested Action */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#FECACA] shadow-xs">
          <h3 className="font-bold text-sm text-[#DC2626] mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#DC2626]" />
            <span>మరింత శ్రద్ధ అవసరమైన అంశం (Weak Skill):</span>
          </h3>
          <div className="text-xs font-bold text-[#DC2626] mb-3 bg-[#FEF2F2] p-2.5 rounded-xl border border-[#FECACA]">
            {summaryData.weakSkill}
          </div>

          <div className="border-t border-[#D1E7DD] pt-3">
            <div className="text-xs font-bold text-[#15803D] uppercase tracking-wider mb-1">
              తల్లిదండ్రులు / సంరక్షకులు చేయవలసిన సూచన:
            </div>
            <p className="text-xs text-[#475569] leading-relaxed font-semibold">
              {summaryData.suggestedAction}
            </p>
          </div>
        </div>

        {/* Practice Together Activity Card */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border-2 border-[#16A34A] shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-[#15803D] mb-2">
            <Heart className="w-5 h-5 text-[#16A34A] fill-[#16A34A]" />
            <span>కలిసి సాధన చేద్దాం (Practice Together):</span>
          </div>
          <p className="text-xs text-[#0F172A] leading-relaxed font-semibold mb-3">
            {summaryData.practiceTogetherPrompt}
          </p>
          <div className="text-[11px] text-[#15803D] font-bold italic">
            "తల్లిదండ్రుల చిన్న ప్రోత్సాహం పిల్లలలో గణిత భయాన్ని తొలగిస్తుంది."
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#D1E7DD] text-center shadow-xs">
          <p className="text-xs text-[#475569] mb-3 font-medium">
            ఈ పేజీని లాగిన్ లేకుండా చూడటానికి కుటుంబ సభ్యులకు ఈ లింక్‌ను పంపవచ్చు:
          </p>
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-3 px-4 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md min-h-[48px]"
          >
            {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'లింక్ కాపీ అయింది!' : 'సంరక్షకుని లింక్ కాపీ చేయండి'}</span>
          </button>
        </div>
      </main>
    </div>
  );
};
