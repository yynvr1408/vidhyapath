import React, { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, Flame, CheckCircle, AlertTriangle, Calendar, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { PracticeEngine } from '../engine/practiceEngine';
import { localDb } from '../db/indexedDb';
import { AttemptEvent } from '../types';

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
          <span className="font-bold text-base">నా ప్రగతి (My Progress)</span>
        </div>
      </header>

      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Profile Summary Card */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm border-2 border-lantern"
              style={{ backgroundColor: activeLearner?.avatarColor }}
            >
              {activeLearner?.avatarEmoji}
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-brand flex items-center gap-1.5">
                {activeLearner?.nickname}
                <Flame className="w-4 h-4 text-lantern fill-lantern" />
              </h2>
              <p className="text-xs text-slate-500">10వ తరగతి గణితం (AP బోర్డు)</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-600">{accuracy}%</div>
            <div className="text-[11px] text-slate-500 font-semibold">ఖచ్చితత్వం</div>
          </div>
        </div>

        {/* Weekly Activity Dots (Section 10 wireframe) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-xs text-indigo-brand flex items-center gap-1.5 uppercase">
              <Calendar className="w-4 h-4 text-lantern" />
              వారపు సాధన రోజులు
            </span>
            <span className="text-xs text-emerald-700 font-bold">5 రోజులు క్రియాశీలకంగా</span>
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
                      ? 'bg-amber-400 text-indigo-dark shadow-sm ring-2 ring-amber-300'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {d.active ? '✓' : ''}
                </div>
                <span className="text-[11px] font-semibold text-slate-600">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chapter Lanterns Progress Breakdown */}
        <div className="bg-white rounded-3xl p-5 border-2 border-indigo-100 shadow-xs">
          <h3 className="font-bold text-sm text-indigo-brand mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-lantern fill-lantern" />
            <span>అధ్యాయాల లాంతరు వెలుగు (Chapter Mastery)</span>
          </h3>

          <div className="space-y-4">
            {pack.topics.map((t) => {
              const { percent, masteredCount, totalCount } = PracticeEngine.computeChapterLanternGlow(
                pack,
                t.id,
                skillStates
              );

              return (
                <div key={t.id} className="p-3 bg-cream-50 rounded-2xl border border-cream-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900">{t.title}</span>
                    <span className="font-black text-sm text-lantern">{percent}% వెలిగింది</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden mb-2">
                    <div
                      className="bg-lantern h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>పూర్తయిన నైపుణ్యాలు: {masteredCount} / {totalCount}</span>
                    <span className={percent >= 80 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                      {percent >= 80 ? 'పూర్తి వెలుగు ✨' : 'మరింత సాధన అవసరం'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strong vs Weak Skills Breakdown */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
          <h3 className="font-bold text-sm text-indigo-brand mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>నైపుణ్యాల విశ్లేషణ (Skills Analysis)</span>
          </h3>

          <div className="space-y-3">
            {/* Example Skill Breakdown */}
            {[
              { name: 'యూక్లిడ్ భాగహార న్యాయం', level: 0.85, status: 'mastered' },
              { name: 'ప్రధాన కారణాంకాలు (Prime Factors)', level: 0.90, status: 'mastered' },
              { name: 'సమితుల సమ్మేళనం (A ∪ B)', level: 0.75, status: 'good' },
              { name: 'అంతమయ్యే దశాంశాలు', level: 0.45, status: 'needs_work' },
              { name: 'సమితుల భేదం (A - B)', level: 0.35, status: 'needs_work' },
            ].map((skill, sIdx) => (
              <div key={sIdx} className="border-b border-slate-100 pb-2.5 last:border-b-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">{skill.name}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      skill.status === 'mastered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : skill.status === 'good'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-coral-light text-coral-brand'
                    }`}
                  >
                    {skill.status === 'mastered'
                      ? 'పరిపూర్ణం'
                      : skill.status === 'good'
                      ? 'బాగుంది'
                      : 'సాధన కావాలి'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      skill.status === 'mastered'
                        ? 'bg-emerald-500'
                        : skill.status === 'good'
                        ? 'bg-blue-500'
                        : 'bg-coral-brand'
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
