import React, { useEffect, useState } from 'react';
import { ArrowLeft, Flame, Calendar, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { PracticeEngine } from '../engine/practiceEngine';
import { localDb } from '../db/indexedDb';
import { AttemptEvent } from '../types';
import { StudentAvatar } from '../components/StudentAvatar';

export const S8_ProgressScreen: React.FC = () => {
  const { pack, activeLearner, skillStates, setScreen } = useApp();
  const [attempts, setAttempts] = useState<AttemptEvent[]>([]);

  useEffect(() => {
    if (activeLearner) {
      localDb.getAttemptsByLearner(activeLearner.id).then(setAttempts);
    }
  }, [activeLearner]);

  if (!pack) return null;

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 75;

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col pb-8">
      {/* Header */}
      <header className="bg-[#FFFFFF] text-[#0F172A] px-4 py-3 shadow-xs border-b border-[#D1E7DD] sticky top-0 z-30">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setScreen('S3_HOME')}
            className="p-2 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] active:scale-95 border border-[#D1E7DD]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-base">నా ప్రగతి (My Progress)</span>
        </div>
      </header>

      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Profile Summary Card */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StudentAvatar learner={activeLearner} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-1.5">
                {activeLearner?.nickname}
                <Flame className="w-4 h-4 text-[#16A34A] fill-[#16A34A]" />
              </h2>
              <p className="text-xs text-[#475569] font-medium">
                కోడ్: <span className="font-mono text-[#15803D] font-bold">{activeLearner?.loginCode}</span> · 10వ తరగతి గణితం
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-[#059669]">{accuracy}%</div>
            <div className="text-[11px] text-[#475569] font-bold">ఖచ్చితత్వం</div>
          </div>
        </div>

        {/* Weekly Activity Dots */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#D1E7DD] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-xs text-[#15803D] flex items-center gap-1.5 uppercase">
              <Calendar className="w-4 h-4 text-[#15803D]" />
              వారపు సాధన రోజులు
            </span>
            <span className="text-xs text-[#059669] font-bold">5 రోజులు క్రియాశీలకంగా</span>
          </div>

          <div className="flex items-center justify-between px-2">
            {[
              { day: 'సోమ', active: true },
              { day: 'మంగళ', active: true },
              { day: 'బుధ', active: true },
              { day: 'గురు', active: false },
              { day: 'శుక్ర', active: true },
              { day: 'శని', active: true },
              { day: 'ఆది', active: false },
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    d.active
                      ? 'bg-[#15803D] text-white shadow-xs ring-2 ring-[#86EFAC]'
                      : 'bg-[#F4F9F6] text-[#94A3B8] border border-[#D1E7DD]'
                  }`}
                >
                  {d.active ? '✓' : ''}
                </div>
                <span className="text-[11px] font-semibold text-[#475569]">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chapter Lanterns Progress Breakdown */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
          <h3 className="font-bold text-sm text-[#0F172A] mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#16A34A] fill-[#16A34A]" />
            <span>అధ్యాయాల లాంతరు వెలుగు (Chapter Mastery)</span>
          </h3>

          <div className="space-y-3.5">
            {pack.topics.map((t) => {
              const { percent, masteredCount, totalCount } = PracticeEngine.computeChapterLanternGlow(
                pack,
                t.id,
                skillStates
              );

              return (
                <div key={t.id} className="p-3.5 bg-[#F4F9F6] rounded-2xl border border-[#D1E7DD]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-[#0F172A]">{t.title}</span>
                    <span className="font-black text-sm text-[#15803D]">{percent}% వెలిగింది</span>
                  </div>

                  <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden mb-2 border border-[#D1E7DD]">
                    <div
                      className="bg-[#16A34A] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#475569] font-medium">
                    <span>పూర్తయిన నైపుణ్యాలు: {masteredCount} / {totalCount}</span>
                    <span className={percent >= 80 ? 'text-[#059669] font-bold' : 'text-[#15803D] font-bold'}>
                      {percent >= 80 ? 'పూర్తి వెలుగు ✨' : 'మరింత సాధన అవసరం'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strong vs Weak Skills Breakdown */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
          <h3 className="font-bold text-sm text-[#0F172A] mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#059669]" />
            <span>నైపుణ్యాల విశ్లేషణ (Skills Analysis)</span>
          </h3>

          <div className="space-y-3">
            {[
              { name: 'యూక్లిడ్ భాగహార న్యాయం', level: 0.85, status: 'mastered' },
              { name: 'ప్రధాన కారణాంకాలు (Prime Factors)', level: 0.90, status: 'mastered' },
              { name: 'సమితుల సమ్మేళనం (A ∪ B)', level: 0.75, status: 'good' },
              { name: 'అంతమయ్యే దశాంశాలు', level: 0.45, status: 'needs_work' },
              { name: 'సమితుల భేదం (A - B)', level: 0.35, status: 'needs_work' },
            ].map((skill, sIdx) => (
              <div key={sIdx} className="border-b border-[#D1E7DD] pb-2.5 last:border-b-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#0F172A]">{skill.name}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      skill.status === 'mastered'
                        ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                        : skill.status === 'good'
                        ? 'bg-[#CCFBF1] text-[#0D9488] border border-[#99F6E4]'
                        : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                    }`}
                  >
                    {skill.status === 'mastered'
                      ? 'పరిపూర్ణం'
                      : skill.status === 'good'
                      ? 'బాగుంది'
                      : 'సాధన కావాలి'}
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden border border-[#D1E7DD]">
                  <div
                    className={`h-full rounded-full ${
                      skill.status === 'mastered'
                        ? 'bg-[#059669]'
                        : skill.status === 'good'
                        ? 'bg-[#0D9488]'
                        : 'bg-[#DC2626]'
                    }`}
                    style={{ width: `${Math.round(skill.level * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
