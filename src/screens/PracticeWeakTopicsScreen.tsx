import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Trophy,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Question, AttemptEvent } from '../types';
import { PracticeEngine } from '../engine/practiceEngine';
import { DeterministicAnswerChecker, AnswerCheckResult } from '../engine/answerChecker';
import { AudioButton } from '../components/AudioButton';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { getTranslations } from '../utils/translations';

export const PracticeWeakTopicsScreen: React.FC = () => {
  const {
    pack,
    activeLearner,
    skillStates,
    selectedTopicId,
    setScreen,
    refreshLearnerData,
    triggerSync,
    currentLanguage,
  } = useApp();

  const t = getTranslations(currentLanguage);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [activeFeedback, setActiveFeedback] = useState<AnswerCheckResult | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [sessionResults, setSessionResults] = useState<{ correct: boolean; hintsUsed: number }[]>([]);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Initialize 5 questions
  useEffect(() => {
    if (pack) {
      const selected = PracticeEngine.selectSessionQuestions(pack, skillStates, selectedTopicId || undefined);
      setQuestions(selected);
      setCurrentIndex(0);
      setHintLevel(0);
      setStartTime(Date.now());
      setSessionResults([]);
      setIsSessionFinished(false);
    }
  }, [pack, selectedTopicId]);

  if (!pack || questions.length === 0) {
    return (
      <div className="bg-[#FFFFFF] rounded-[12px] p-8 border border-[#E2E8F0] text-center font-bold text-[#0F766E]">
        ప్రశ్నలు లోడ్ అవుతున్నాయి...
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const quizStateKey = activeLearner ? `vidyapath_quiz_state_${activeLearner.id}` : null;

  const handleSelectAnswer = async (inputStr: string, inputMode: 'tap' | 'voice' = 'tap') => {
    if (!activeLearner || !currentQ || activeFeedback) return;

    const timeSpentMs = Date.now() - startTime;
    const result = DeterministicAnswerChecker.checkAnswer(currentQ, inputStr, pack);

    const attemptEvent: AttemptEvent = {
      eventId: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      learnerId: activeLearner.id,
      questionId: currentQ.id,
      skillId: currentQ.skillId,
      chosenAnswer: inputStr,
      correct: result.isCorrect,
      mistakeTag: result.mistakeTag,
      hintsUsed: hintLevel,
      timeMs: timeSpentMs,
      inputMode,
      ts: Date.now(),
    };

    await PracticeEngine.recordAttemptAndUpdateSkill(attemptEvent);
    await refreshLearnerData();

    const updatedResults = [...sessionResults, { correct: result.isCorrect, hintsUsed: hintLevel }];
    setSessionResults(updatedResults);
    setActiveFeedback(result);

    // Auto-save mid-quiz answers to local storage immediately
    if (quizStateKey) {
      try {
        localStorage.setItem(
          quizStateKey,
          JSON.stringify({
            topicId: selectedTopicId,
            currentIndex,
            questionId: currentQ.id,
            savedResults: updatedResults,
            ts: Date.now(),
          })
        );
      } catch {}
    }
  };

  const handleNextQuestion = () => {
    setActiveFeedback(null);
    setHintLevel(0);
    setStartTime(Date.now());

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      if (quizStateKey) {
        try {
          localStorage.setItem(
            quizStateKey,
            JSON.stringify({
              topicId: selectedTopicId,
              currentIndex: currentIndex + 1,
              savedResults: sessionResults,
              ts: Date.now(),
            })
          );
        } catch {}
      }
    } else {
      setIsSessionFinished(true);
      if (quizStateKey) {
        try {
          localStorage.removeItem(quizStateKey);
        } catch {}
      }
      confetti({
        particleCount: 60,
        spread: 60,
        colors: ['#0F766E', '#16A34A', '#D97706'],
      });
      triggerSync();
    }
  };

  // Completion Screen after 5 questions
  if (isSessionFinished) {
    const total = sessionResults.length;
    const correctCount = sessionResults.filter((r) => r.correct).length;
    const accuracy = Math.round((correctCount / total) * 100);

    return (
      <div className="bg-[#FFFFFF] rounded-[12px] p-6 sm:p-8 border border-[#E2E8F0] shadow-xs text-center space-y-5 animate-fadeIn w-full max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-[#F0FDFA] text-[#0F766E] border-2 border-[#0F766E] mx-auto flex items-center justify-center shadow-xs">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A]">
            {t.sessionComplete}
          </h2>
          <p className="text-xs text-[#475569] mt-1 font-medium">
            {t.sessionCompleteSub}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-4 rounded-[12px] border border-[#E2E8F0]">
          <div>
            <div className="text-xs text-[#475569] font-bold">{t.accuracy}</div>
            <div className="text-2xl font-black text-[#0F766E] mt-0.5">{accuracy}%</div>
          </div>
          <div>
            <div className="text-xs text-[#475569] font-bold">{t.correctCount}</div>
            <div className="text-2xl font-black text-[#16A34A] mt-0.5">
              {correctCount} / {total}
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs text-[#16A34A] bg-[#DCFCE7] px-3.5 py-1.5 rounded-full font-bold border border-[#16A34A]/30">
          <ShieldCheck className="w-4 h-4" />
          <span>{t.autoSavedNotice}</span>
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={() => {
              if (quizStateKey) {
                try {
                  localStorage.removeItem(quizStateKey);
                } catch {}
              }
              const selected = PracticeEngine.selectSessionQuestions(pack, skillStates, selectedTopicId || undefined);
              setQuestions(selected);
              setCurrentIndex(0);
              setHintLevel(0);
              setSessionResults([]);
              setIsSessionFinished(false);
            }}
            className="w-full py-3.5 rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.practiceMore}</span>
          </button>
          <button
            type="button"
            onClick={() => setScreen('MY_SYLLABUS')}
            className="w-full py-3 rounded-[12px] bg-[#F8FAFC] hover:bg-[#F0FDFA] text-[#0F172A] border border-[#E2E8F0] font-bold text-xs min-h-[44px]"
          >
            {t.navMySyllabus}
          </button>
        </div>
      </div>
    );
  }

  const hintTexts = currentQ.hintLadder;
  const currentHintText = hintLevel > 0 ? hintTexts[hintLevel - 1] : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn">
      {/* Subtle Auto-Saved Banner */}
      <div className="flex items-center justify-between bg-[#F0FDFA] px-3.5 py-2 rounded-[12px] border border-[#E2E8F0] text-xs text-[#0F766E] font-bold">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
          <span>{t.autoSavedNotice}</span>
        </div>
        <span className="bg-[#FFFFFF] px-2 py-0.5 rounded-md text-[11px] border border-[#E2E8F0]">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Main Question Card */}
      <div className="bg-[#FFFFFF] rounded-[12px] p-5 border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#0F766E] uppercase tracking-wide">
            {t.questionNumber} {currentIndex + 1}
          </span>
          <AudioButton
            text={`${currentQ.text}. ${currentLanguage === 'hi' ? 'विकल्प' : currentLanguage === 'en' ? 'Options' : 'ఆప్షన్లు'}: A. ${currentQ.options[0]}, B. ${currentQ.options[1]}, C. ${currentQ.options[2]}, D. ${currentQ.options[3]}`}
            label={t.listen}
            size="md"
          />
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] leading-relaxed">
          {currentQ.text}
        </h2>
      </div>

      {/* 4 Large Radio / Option Buttons (>= 48px Touch Targets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(['A', 'B', 'C', 'D'] as const).map((optKey, idx) => {
          const optText = currentQ.options[idx];
          return (
            <button
              key={optKey}
              type="button"
              disabled={!!activeFeedback}
              onClick={() => handleSelectAnswer(optKey, 'tap')}
              className="bg-[#FFFFFF] hover:bg-[#F0FDFA] hover:border-[#0F766E] border border-[#E2E8F0] rounded-[12px] p-4 flex items-center gap-3.5 text-left transition-all active:scale-98 shadow-2xs min-h-[58px] group"
            >
              <span className="w-10 h-10 rounded-[10px] bg-[#F8FAFC] group-hover:bg-[#0F766E] group-hover:text-white text-[#0F766E] border border-[#E2E8F0] font-extrabold text-base flex items-center justify-center shrink-0 transition-colors">
                {optKey}
              </span>
              <span className="font-semibold text-base text-[#0F172A] leading-snug">
                {optText}
              </span>
            </button>
          );
        })}
      </div>

      {/* Immediate Gentle Feedback View (when answered) */}
      {activeFeedback && (
        <div
          className={`p-4 rounded-[12px] border shadow-xs animate-fadeIn space-y-3 ${
            activeFeedback.isCorrect
              ? 'bg-[#DCFCE7] border-[#16A34A]/40 text-[#14532D]'
              : 'bg-[#FEE2E2] border-[#DC2626]/30 text-[#991B1B]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-base">
              {activeFeedback.isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  <span>{t.greatJob}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-[#DC2626]" />
                  <span>{t.tryAgain}</span>
                </>
              )}
            </div>
            <AudioButton
              text={
                activeFeedback.isCorrect
                  ? t.greatJob
                  : `${t.tryAgain}. ${activeFeedback.remedyText || ''}`
              }
              label=""
              size="md"
            />
          </div>

          {/* Gentle Misconception Explanation */}
          {!activeFeedback.isCorrect && (
            <div className="bg-[#FFFFFF] p-3.5 rounded-[10px] border border-[#FECACA] text-sm text-[#0F172A] font-medium leading-relaxed">
              <strong className="text-[#DC2626] font-bold block mb-1">
                {t.remedyHeading}
              </strong>
              {activeFeedback.remedyText || 'సూత్రాన్ని మరియు శేషాన్ని ఒకసారి నిశితంగా సరిచూడండి.'}
            </div>
          )}

          {/* Next Question CTA */}
          <button
            type="button"
            onClick={handleNextQuestion}
            className="w-full py-3.5 px-4 rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all min-h-[48px]"
          >
            <span>{t.nextQuestion}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* 3-Tier Hint Ladder */}
      {hintLevel > 0 && currentHintText && (
        <div className="bg-[#FEF3C7] border border-[#D97706]/30 rounded-[12px] p-4 text-sm text-[#92400E] space-y-1.5 animate-fadeIn shadow-2xs">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#D97706]" />
              <span>
                {t.hintStep} {hintLevel} / 3
              </span>
            </span>
            <AudioButton text={currentHintText} label="" size="sm" />
          </div>
          <p className="font-semibold text-base leading-relaxed text-[#0F172A]">
            {currentHintText}
          </p>
        </div>
      )}

      {/* Bottom Action Row: Hint Ladder + Voice Answer */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            if (hintLevel < 3) setHintLevel((p) => p + 1);
          }}
          disabled={hintLevel >= 3 || !!activeFeedback}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-[12px] bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] font-bold text-sm text-[#475569] hover:text-[#0F766E] disabled:opacity-40 min-h-[48px] shadow-2xs"
        >
          <Lightbulb className="w-4 h-4 text-[#D97706]" />
          <span>
            {hintLevel === 0 ? t.needHint : hintLevel < 3 ? t.nextHint : t.allHintsViewed}
          </span>
        </button>

        <div className="flex-1">
          <VoiceInputButton
            size="md"
            label={t.voiceAnswer}
            onTranscript={(trans) => handleSelectAnswer(trans, 'voice')}
          />
        </div>
      </div>
    </div>
  );
};
