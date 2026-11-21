import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Flame,
  Volume2,
  Target,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Topic, LessonCard } from '../types';
import { getTranslations } from '../utils/translations';
import { AudioButton } from '../components/AudioButton';
import { PracticeEngine } from '../engine/practiceEngine';

export const MySyllabusScreen: React.FC = () => {
  const {
    pack,
    skillStates,
    offlineChapters,
    toggleChapterOffline,
    selectTopic,
    setScreen,
    currentLanguage,
  } = useApp();

  const t = getTranslations(currentLanguage);

  // Active expanded chapter for reading bite-sized concept cards
  const [activeReadingTopic, setActiveReadingTopic] = useState<Topic | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  if (!pack || !pack.topics) return null;

  const handleStartPracticeForTopic = (topicId: string) => {
    selectTopic(topicId);
    setScreen('PRACTICE');
  };

  // If reading concept cards inside a chapter
  if (activeReadingTopic) {
    const cards: LessonCard[] = activeReadingTopic.cards || [];
    const currentCard = cards[activeCardIndex] || {
      id: 'placeholder',
      stepNumber: 1,
      heading: activeReadingTopic.title,
      conceptText: activeReadingTopic.description,
      keyTakeaway: 'ఈ అధ్యాయంలోని ప్రాథమిక సూత్రాలు గుర్తుంచుకోండి.',
    };

    const hasNext = activeCardIndex < cards.length - 1;
    const hasPrev = activeCardIndex > 0;

    return (
      <div className="space-y-4 animate-fadeIn">
        {/* Breadcrumb Navigation Header */}
        <div className="flex items-center justify-between bg-[#FFFFFF] p-3 rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveReadingTopic(null);
              setActiveCardIndex(0);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
          >
            <span>← {t.back}</span>
          </button>
          <span className="font-extrabold text-sm text-[#0F172A] truncate px-2">
            {activeReadingTopic.title}
          </span>
          <AudioButton
            text={`${currentCard.heading}. ${currentCard.conceptText}. ${
              currentCard.workedExample ? 'ఉదాహరణ: ' + currentCard.workedExample.problem : ''
            }`}
            label={t.listen}
            size="sm"
          />
        </div>

        {/* Card Progress Stepper dots */}
        {cards.length > 1 && (
          <div className="flex items-center justify-between bg-[#FFFFFF] px-4 py-2 rounded-[12px] border border-[#E2E8F0] text-xs font-bold text-[#0F766E]">
            <span>
              {t.step} {activeCardIndex + 1} / {cards.length}
            </span>
            <div className="flex gap-1.5">
              {cards.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === activeCardIndex
                      ? 'w-6 bg-[#0F766E]'
                      : 'w-2 bg-[#E2E8F0]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bite-sized Concept Card */}
        <div className="bg-[#FFFFFF] rounded-[12px] p-5 border border-[#E2E8F0] shadow-xs space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0FDFA] text-[#0F766E] text-xs font-bold rounded-full mb-2 border border-[#E2E8F0]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {t.step} {activeCardIndex + 1}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[#0F172A] leading-snug">
              {currentCard.heading}
            </h2>
          </div>

          {/* Explanation Text */}
          <div className="text-sm font-medium text-[#0F172A] bg-[#F8FAFC] p-4 rounded-[12px] border border-[#E2E8F0] leading-relaxed whitespace-pre-line">
            {currentCard.conceptText}
          </div>

          {/* Worked Example */}
          {currentCard.workedExample && (
            <div className="bg-[#F0FDFA] p-4 rounded-[12px] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F766E] uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-[#0F766E]" />
                <span>{t.workedExample}</span>
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">
                {currentCard.workedExample.problem}
              </p>
              <div className="space-y-1 pl-2 border-l-2 border-[#0F766E]">
                {currentCard.workedExample.steps.map((st, sIdx) => (
                  <div key={sIdx} className="text-xs text-[#475569] font-medium flex items-start gap-1.5">
                    <span className="font-bold text-[#0F766E]">{sIdx + 1}.</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] text-xs font-bold text-[#0F172A] flex items-center justify-between">
                <span>{t.finalAnswer}</span>
                <span className="bg-[#FFFFFF] px-2.5 py-1 rounded-md text-[#16A34A] border border-[#E2E8F0] font-mono">
                  {currentCard.workedExample.finalAnswer}
                </span>
              </div>
            </div>
          )}

          {/* Key Takeaway */}
          <div className="flex items-start gap-2 bg-[#F8FAFC] p-3 rounded-[12px] border border-[#E2E8F0] text-xs text-[#475569]">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#0F172A] font-bold">{t.keyTakeaway} </strong>
              {currentCard.keyTakeaway}
            </span>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setActiveCardIndex((prev) => prev - 1)}
              className="px-4 py-2.5 rounded-[12px] text-xs font-bold border border-[#E2E8F0] disabled:opacity-40 min-h-[48px] bg-[#FFFFFF] hover:bg-[#F8FAFC]"
            >
              ← {t.back}
            </button>

            {hasNext ? (
              <button
                type="button"
                onClick={() => setActiveCardIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-[12px] text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm min-h-[48px]"
              >
                {t.next} →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStartPracticeForTopic(activeReadingTopic.id)}
                className="px-5 py-2.5 rounded-[12px] text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm flex items-center gap-1.5 min-h-[48px]"
              >
                <Target className="w-4 h-4" />
                <span>{t.practiceNow}</span>
              </button>
            )}
          </div>
        </div>

        {/* Direct Practice Now Full Button */}
        <button
          type="button"
          onClick={() => handleStartPracticeForTopic(activeReadingTopic.id)}
          className="w-full py-3.5 px-4 rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all min-h-[48px]"
        >
          <Target className="w-5 h-5" />
          <span>{t.practiceNow}</span>
        </button>
      </div>
    );
  }

  // Vertical List of Chapters
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] p-4 rounded-[12px] border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#0F172A]">
            {t.mySyllabusTitle}
          </h2>
          <p className="text-xs text-[#475569] mt-0.5 font-medium">
            {t.gradeSubject}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-[#F0FDFA] text-[#0F766E] px-3 py-1 rounded-full border border-[#E2E8F0] font-bold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{pack.topics.length} అధ్యాయాలు</span>
        </div>
      </div>

      {/* Chapters Vertical List */}
      <div className="space-y-3">
        {pack.topics.map((topic, index) => {
          const { percent, masteredCount, totalCount } =
            PracticeEngine.computeChapterLanternGlow(pack, topic.id, skillStates);

          const isOfflineDownloaded = offlineChapters.has(topic.id);

          // Status Dot: Green #16A34A (>=70%), Amber #D97706 (>0%), Gray #94A3B8 (0%)
          const statusColor =
            percent >= 70
              ? '#16A34A'
              : percent > 0
              ? '#D97706'
              : '#94A3B8';

          const statusBg =
            percent >= 70
              ? 'bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/30'
              : percent > 0
              ? 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/30'
              : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]';

          return (
            <div
              key={topic.id}
              className="bg-[#FFFFFF] rounded-[12px] p-4 border border-[#E2E8F0] shadow-xs hover:border-[#0F766E] transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div
                  onClick={() => {
                    setActiveReadingTopic(topic);
                    setActiveCardIndex(0);
                  }}
                  className="flex-1 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {/* Status Dot */}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: statusColor }}
                    />
                    <span className="text-xs font-bold text-[#0F766E] group-hover:underline">
                      అధ్యాయం {index + 1}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-[#0F172A] leading-snug group-hover:text-[#0F766E] transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-[#475569] line-clamp-1 mt-0.5">
                    {topic.description}
                  </p>
                </div>

                {/* Compact Save Offline Download Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleChapterOffline(topic.id)}
                  title={isOfflineDownloaded ? t.savedOffline : t.saveOffline}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 shrink-0 ${
                    isOfflineDownloaded
                      ? 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/40'
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F0FDFA] hover:text-[#0F766E]'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="text-[11px]">
                    {isOfflineDownloaded ? t.savedOffline : t.saveOffline}
                  </span>
                </button>
              </div>

              {/* Progress Bar & Direct Practice Row */}
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#475569] mb-1">
                    <span>
                      {masteredCount} / {totalCount} నైపుణ్యాలు
                    </span>
                    <span style={{ color: statusColor }}>{percent}%</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden border border-[#E2E8F0]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: statusColor }}
                    />
                  </div>
                </div>

                {/* Action Buttons: Read Concept or Practice Now */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReadingTopic(topic);
                      setActiveCardIndex(0);
                    }}
                    className="p-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F0FDFA] text-[#0F766E] border border-[#E2E8F0] text-xs font-bold flex items-center gap-1 min-h-[40px]"
                  >
                    <span>చదవండి</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartPracticeForTopic(topic.id)}
                    className="p-2 px-3 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold flex items-center gap-1 min-h-[40px] shadow-xs active:scale-95"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>{t.practiceNow}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
