import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Target, Sparkles, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen bg-cream-100 flex flex-col pb-8">
      {/* Top Header */}
      <header className="bg-indigo-brand text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScreen('S3_HOME')}
            className="p-2 rounded-xl bg-indigo-light hover:bg-indigo-dark text-white active:scale-95"
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
                  ? 'bg-indigo-brand text-amber-300 border-indigo-brand shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-cream-50'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        {/* Card Progress Stepper */}
        {cards.length > 1 && (
          <div className="flex items-center justify-between mb-3 bg-white px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-indigo-brand">
              విషయం {currentCardIndex + 1} / {cards.length}
            </span>
            <div className="flex gap-1.5">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentCardIndex ? 'w-6 bg-lantern' : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lesson Card */}
        <div className="bg-white rounded-3xl p-5 border-2 border-indigo-100 shadow-sm flex-1 flex flex-col justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                దశ {currentCardIndex + 1}
              </span>
              <h2 className="text-base font-bold text-indigo-brand leading-tight">
                {currentCard.heading}
              </h2>
            </div>

            {/* Concept Explanation */}
            <p className="text-slate-800 leading-relaxed text-base mb-4 bg-cream-50/60 p-3.5 rounded-2xl border border-cream-200/60">
              {currentCard.conceptText}
            </p>

            {/* Worked Example with Step Highlights */}
            {currentCard.workedExample && (
              <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-200/60 mb-4">
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-brand mb-2">
                  <Sparkles className="w-4 h-4 text-lantern" />
                  <span>సాధించిన ఉదాహరణ:</span>
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-2">
                  {currentCard.workedExample.problem}
                </div>
                <div className="space-y-1.5 pl-2 border-l-2 border-indigo-300">
                  {currentCard.workedExample.steps.map((st, sIdx) => (
                    <div key={sIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="font-bold text-indigo-brand">{sIdx + 1}.</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-indigo-200 text-xs font-bold text-indigo-brand flex items-center justify-between">
                  <span>తుది జవాబు:</span>
                  <span className="bg-white px-2 py-1 rounded-md text-emerald-700 border border-emerald-200">
                    {currentCard.workedExample.finalAnswer}
                  </span>
                </div>
              </div>
            )}

            {/* Key Takeaway Note */}
            <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-lantern shrink-0 mt-0.5" />
              <span>
                <strong className="font-bold">ముఖ్య గమనిక: </strong>
                {currentCard.keyTakeaway}
              </span>
            </div>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!hasPrev}
              className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold min-h-[48px] ${
                hasPrev
                  ? 'bg-slate-100 text-indigo-brand hover:bg-slate-200 active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>వెనుకకు</span>
            </button>

            {hasNext ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-indigo-brand text-white font-bold text-sm hover:bg-indigo-dark active:scale-95 shadow-sm min-h-[48px]"
              >
                <span>ముందుకు</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartPracticeForTopic}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 text-indigo-dark font-bold text-sm hover:bg-amber-400 active:scale-95 shadow-md min-h-[48px]"
              >
                <Target className="w-5 h-5" />
                <span>సాధన మొదలుపెట్టు</span>
              </button>
            )}
          </div>
        </div>

        {/* Start Practice Direct CTA */}
        <button
          type="button"
          onClick={handleStartPracticeForTopic}
          className="w-full py-4 rounded-2xl bg-indigo-brand hover:bg-indigo-dark text-white font-bold text-base shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[56px]"
        >
          <Target className="w-5 h-5 text-lantern" />
          <span>ఈ అధ్యాయంపై 5 ప్రశ్నల సాధన చేయండి</span>
        </button>
      </main>
    </div>
  );
};
