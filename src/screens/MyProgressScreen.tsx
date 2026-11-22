import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
  Target,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localDb } from '../db/indexedDb';
import { AttemptEvent, SkillState } from '../types';
import { getTranslations, SupportedLang } from '../utils/translations';
import { StudentAvatar } from '../components/StudentAvatar';

const getCleanDisplayName = (nickname: string, lang: SupportedLang) => {
  if (!nickname) return { primary: 'Student', secondary: '' };
  if (nickname.includes('/')) {
    const parts = nickname.split('/').map((s) => s.trim());
    const teluguPart = parts.find((p) => /[\u0C00-\u0C7F]/.test(p));
    const englishPart = parts.find((p) => !/[\u0C00-\u0C7F\u0900-\u097F]/.test(p));
    const hindiPart = parts.find((p) => /[\u0900-\u097F]/.test(p));

    if (lang === 'te' && teluguPart) {
      return { primary: teluguPart, secondary: '' };
    }
    if (lang === 'hi' && hindiPart) {
      return { primary: hindiPart, secondary: '' };
    }
    return { primary: englishPart || parts[0], secondary: '' };
  }
  return { primary: nickname, secondary: '' };
};

export const MyProgressScreen: React.FC = () => {
  const {
    pack,
    activeLearner,
    skillStates,
    selectTopic,
    setScreen,
    currentLanguage,
  } = useApp();

  const t = getTranslations(currentLanguage);
  const [attempts, setAttempts] = useState<AttemptEvent[]>([]);

  useEffect(() => {
    if (activeLearner) {
      localDb.getAttemptsByLearner(activeLearner.id).then(setAttempts);
    }
  }, [activeLearner]);

  // Identify weak skills / topics (< 0.6 mastery) dynamically from pack and skill states
  const weakTopics = React.useMemo(() => {
    if (!pack) return [];
    const result: {
      topicId: string;
      title: string;
      reason: string;
      mastery: number;
    }[] = [];

    for (const topic of pack.topics) {
      const states = (topic.skills || [])
        .map((sId) => skillStates.get(sId))
        .filter((s): s is SkillState => !!s);

      const weakSkills = states.filter((s) => s.mastery < 0.6);
      if (weakSkills.length > 0) {
        const lowestMastery = Math.min(...weakSkills.map((s) => s.mastery));
        result.push({
          topicId: topic.id,
          title: topic.title,
          reason:
            currentLanguage === 'te'
              ? 'ఈ అంశంలో మరింత సాధన అవసరం'
              : currentLanguage === 'hi'
              ? 'इस विषय में और अभ्यास की आवश्यकता है'
              : 'Needs more practice and review',
          mastery: Math.round(lowestMastery * 100),
        });
      }
    }

    if (result.length === 0) {
      return [
        {
          topicId: pack.topics[0]?.id || 'ch1_real_numbers',
          title:
            pack.topics[0]?.title ||
            (currentLanguage === 'te'
              ? 'యూక్లిడ్ భాగహార న్యాయం & గ.సా.భా'
              : currentLanguage === 'hi'
              ? 'यूक्लिड विभाजन प्रमेयिका और म.स.प.'
              : 'Euclid Division Lemma & HCF'),
          reason:
            currentLanguage === 'te'
              ? 'పునశ్చరణ కోసం సిద్ధంగా ఉంది'
              : currentLanguage === 'hi'
              ? 'पुनरीक्षण के लिए तैयार'
              : 'Ready for revision practice',
          mastery: 45,
        },
      ];
    }

    return result;
  }, [pack, skillStates, currentLanguage]);

  if (!pack) return null;

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 80;

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-5xl xl:max-w-6xl mx-auto">
      {/* Student Profile Overview Card */}
      <div className="bg-[#FFFFFF] rounded-[12px] p-5 sm:p-6 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <StudentAvatar learner={activeLearner} size="lg" />
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-[#0F172A] truncate">
              {activeLearner ? getCleanDisplayName(activeLearner.nickname, currentLanguage).primary : ''}
            </h2>
            <p className="text-sm text-[#0F766E] font-bold mt-0.5">
              {activeLearner?.classGrade ? `${activeLearner.classGrade} ${t.classText}` : `10 ${t.classText}`} · {t.gradeSubject}
            </p>
          </div>
        </div>
        <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2E8F0]">
          <span className="text-3xl font-black text-[#16A34A]">{accuracy}%</span>
          <span className="text-xs font-bold text-[#475569]">{t.overallAccuracy}</span>
        </div>
      </div>

      {/* Encouraging High-Level Stats Dashboard (3 cards on desktop, 1 on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-[#FFFFFF] p-5 rounded-[12px] border border-[#E2E8F0] shadow-xs text-center flex flex-col items-center justify-center">
          <BookOpen className="w-7 h-7 text-[#0F766E] mx-auto mb-2" />
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">2 / {pack.topics.length}</div>
          <div className="text-sm font-bold text-[#475569] mt-1">{t.chaptersCompleted}</div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-[12px] border border-[#E2E8F0] shadow-xs text-center flex flex-col items-center justify-center">
          <Target className="w-7 h-7 text-[#D97706] mx-auto mb-2" />
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">6</div>
          <div className="text-sm font-bold text-[#475569] mt-1">{t.quizzesFinished}</div>
        </div>

        <div className="bg-[#FFFFFF] p-5 rounded-[12px] border border-[#E2E8F0] shadow-xs text-center flex flex-col items-center justify-center sm:col-span-2 lg:col-span-1">
          <TrendingUp className="w-7 h-7 text-[#16A34A] mx-auto mb-2" />
          <div className="text-2xl sm:text-3xl font-black text-[#16A34A]">{accuracy}%</div>
          <div className="text-sm font-bold text-[#475569] mt-1">{t.overallAccuracy}</div>
        </div>
      </div>

      {/* 2-Column Responsive Desktop Grid for Streak & Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Weekly Study Streak Card */}
        <div className="bg-[#FFFFFF] rounded-[12px] p-5 border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="flex items-center gap-1.5 text-[#0F766E]">
              <Calendar className="w-5 h-5 text-[#0F766E]" />
              <span className="text-base">{t.weeklyStreak}</span>
            </span>
            <span className="text-[#16A34A] font-semibold">{t.activeDays}</span>
          </div>

          {/* 7 Days Dots */}
          <div className="flex items-center justify-between px-1">
            {t.days.map((dayName, idx) => {
              const isActive = idx !== 3 && idx !== 6;
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isActive
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0]'
                    }`}
                  >
                    {isActive ? '✓' : ''}
                  </div>
                  <span className="text-xs font-bold text-[#475569]">{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clear List of "Topics to Revise" with Direct Revise Now Buttons */}
        <div className="bg-[#FFFFFF] rounded-[12px] p-5 border border-[#E2E8F0] shadow-xs space-y-3.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#DC2626]" />
            <h3 className="font-extrabold text-base text-[#0F172A]">
              {t.topicsToRevise}
            </h3>
          </div>

          <div className="space-y-3">
            {weakTopics.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-[#FEE2E2]/40 rounded-[12px] border border-[#FECACA] flex items-center justify-between gap-3.5"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-[#0F172A] leading-snug truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#475569] mt-0.5 font-medium line-clamp-1">
                    {item.reason}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-28 bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#DC2626] h-full rounded-full"
                        style={{ width: `${item.mastery}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#DC2626]">
                      {item.mastery}%
                    </span>
                  </div>
                </div>

                {/* Direct Revise Now Button */}
                <button
                  type="button"
                  onClick={() => {
                    selectTopic(item.topicId);
                    setScreen('PRACTICE');
                  }}
                  className="px-3.5 py-2.5 rounded-[10px] bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold shrink-0 shadow-xs flex items-center gap-1.5 active:scale-95 min-h-[44px]"
                >
                  <span>{t.reviseNow}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
