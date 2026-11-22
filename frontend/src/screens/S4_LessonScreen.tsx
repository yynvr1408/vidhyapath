import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AudioButton } from '../components/AudioButton';
import { OfflineBanner } from '../components/OfflineBanner';
import { LessonCard, Topic } from '../types';

export const S4_LessonScreen: React.FC = () => {
  const { pack, selectedTopicId, selectTopic, setScreen } = useApp();

  // Find selected topic or default to first topic
  const initialTopic = pack?.topics.find((t) => t.id === selectedTopicId) || pack?.topics[0];
  const [currentTopic, setCurrentTopic] = useState<Topic | undefined>(initialTopic);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  if (!pack || !currentTopic) return null;

  const cards: LessonCard[] = currentTopic.cards || [];
  const currentCard = cards[currentCardIndex] || {
    id: 'placeholder',
    stepNumber: 1,
    heading: currentTopic.title,
    conceptText: currentTopic.description,
    keyTakeaway: 'ఈ భావనను అర్థం చేసుకుని సాధన చేయండి.',
  };

  const hasNext = currentCardIndex < cards.length - 1;
  const hasPrev = currentCardIndex > 0;

  const handleNext = () => {
    if (hasNext) setCurrentCardIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (hasPrev) setCurrentCardIndex((prev) => prev - 1);
  };

  const handleStartPracticeForTopic = () => {
    selectTopic(currentTopic.id);
    setScreen('S5_PRACTICE');
  };

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col pb-8">
      {/* Top Header */}
      <header className="bg-[#FFFFFF] text-[#0F172A] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs border-b border-[#D1E7DD]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScreen('S3_HOME')}
            className="p-2 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] active:scale-95 border border-[#D1E7DD]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-base line-clamp-1">{currentTopic.title}</span>
        </div>
        <AudioButton
          text={`${currentCard.heading}. ${currentCard.conceptText}. ${
            currentCard.workedExample ? 'ఉదాహరణ: ' + currentCard.workedExample.problem : ''
          }`}
          label="వినండి"
          size="sm"
        />
      </header>

      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col justify-between">
        {/* Chapter Switcher Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {pack.topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setCurrentTopic(t);
                setCurrentCardIndex(0);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                currentTopic.id === t.id
                  ? 'bg-[#15803D] text-white border-[#15803D] shadow-xs'
                  : 'bg-[#FFFFFF] text-[#475569] border-[#D1E7DD] hover:border-[#15803D]'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        {/* Card Progress Stepper */}
        {cards.length > 1 && (
          <div className="flex items-center justify-between mb-3 bg-[#FFFFFF] px-3.5 py-2 rounded-xl border border-[#D1E7DD] shadow-xs">
            <span className="text-xs font-bold text-[#15803D]">
              విషయం {currentCardIndex + 1} / {cards.length}
            </span>
            <div className="flex gap-1.5">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentCardIndex ? 'w-6 bg-[#15803D]' : 'w-2 bg-[#E2E8F0]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lesson Card */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-sm flex-1 flex flex-col justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]">
                దశ {currentCardIndex + 1}
              </span>
              <h2 className="text-base font-bold text-[#0F172A] leading-tight">
                {currentCard.heading}
              </h2>
            </div>

            {/* Concept Explanation */}
            <p className="text-[#0F172A] leading-relaxed text-sm mb-4 bg-[#F4F9F6] p-3.5 rounded-2xl border border-[#D1E7DD]">
              {currentCard.conceptText}
            </p>

            {/* Worked Example with Step Highlights */}
            {currentCard.workedExample && (
              <div className="bg-[#F4F9F6] rounded-2xl p-4 border border-[#D1E7DD] mb-4">
                <div className="flex items-center gap-2 font-bold text-sm text-[#15803D] mb-2">
                  <Sparkles className="w-4 h-4 text-[#15803D]" />
                  <span>సాధించిన ఉదాహరణ:</span>
                </div>
                <div className="text-sm font-semibold text-[#0F172A] mb-2">
                  {currentCard.workedExample.problem}
                </div>
                <div className="space-y-1.5 pl-2 border-l-2 border-[#15803D]">
                  {currentCard.workedExample.steps.map((st, sIdx) => (
                    <div key={sIdx} className="text-xs text-[#475569] flex items-start gap-1.5 font-medium">
                      <span className="font-bold text-[#15803D]">{sIdx + 1}.</span>
                      <span className="text-[#0F172A]">{st}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-[#D1E7DD] text-xs font-bold text-[#0F172A] flex items-center justify-between">
                  <span>తుది జవాబు:</span>
                  <span className="bg-[#DCFCE7] px-2.5 py-1 rounded-md text-[#059669] border border-[#86EFAC] font-mono">
                    {currentCard.workedExample.finalAnswer}
                  </span>
                </div>
              </div>
            )}

            {/* Key Takeaway Note */}
            <div className="flex items-start gap-2 bg-[#DCFCE7] p-3 rounded-xl border border-[#86EFAC] text-xs text-[#14532D]">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
              <span>
                <strong className="font-bold text-[#0F172A]">ముఖ్య గమనిక: </strong>
                {currentCard.keyTakeaway}
              </span>
            </div>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#D1E7DD]">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!hasPrev}
              className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold min-h-[48px] ${
                hasPrev
                  ? 'bg-[#F4F9F6] text-[#0F172A] hover:bg-[#DCFCE7] border border-[#D1E7DD] active:scale-95'
                  : 'text-[#94A3B8] cursor-not-allowed opacity-50'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>వెనుకకు</span>
            </button>

            {hasNext ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[#15803D] text-white font-bold text-sm hover:bg-[#166534] active:scale-95 shadow-md min-h-[48px]"
              >
                <span>ముందుకు</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartPracticeForTopic}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#15803D] text-white font-bold text-sm hover:bg-[#166534] active:scale-95 shadow-md min-h-[48px]"
              >
                <Target className="w-5 h-5 stroke-[2.5]" />
                <span>సాధన మొదలుపెట్టు</span>
              </button>
            )}
          </div>
        </div>

        {/* Start Practice Direct CTA */}
        <button
          type="button"
          onClick={handleStartPracticeForTopic}
          className="w-full py-4 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[56px]"
        >
          <Target className="w-5 h-5 stroke-[2.5]" />
          <span>ఈ అధ్యాయంపై 5 ప్రశ్నల సాధన చేయండి</span>
        </button>
      </main>
    </div>
  );
};
