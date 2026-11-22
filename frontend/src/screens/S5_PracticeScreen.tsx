import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lightbulb, Flame, Trophy, Home, RotateCcw, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Question, AttemptEvent } from '../types';
import { PracticeEngine } from '../engine/practiceEngine';
import { DeterministicAnswerChecker, AnswerCheckResult } from '../engine/answerChecker';
import { AudioButton } from '../components/AudioButton';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { OfflineBanner } from '../components/OfflineBanner';
import { S6_FeedbackModal } from './S6_FeedbackModal';

export const S5_PracticeScreen: React.FC = () => {
  const {
    pack,
    activeLearner,
    skillStates,
    selectedTopicId,
    setScreen,
    refreshLearnerData,
    incrementDataUsage,
    triggerSync,
  } = useApp();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [activeFeedback, setActiveFeedback] = useState<AnswerCheckResult | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [sessionResults, setSessionResults] = useState<{ correct: boolean; hintsUsed: number }[]>([]);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Initialize 5 adaptive questions on load
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
      <div className="min-h-screen bg-[#F4F9F6] flex items-center justify-center p-4">
        <div className="text-center font-bold text-[#15803D]">
          ప్రశ్నలు లోడ్ అవుతున్నాయి...
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  // Request hint from ladder
  const handleRequestHint = () => {
    if (hintLevel < 3) {
      setHintLevel((prev) => prev + 1);
    }
  };

  // Process chosen answer
  const handleSelectAnswer = async (inputStr: string, inputMode: 'tap' | 'voice' = 'tap') => {
    if (!activeLearner || !currentQ || activeFeedback) return;

    const timeSpentMs = Date.now() - startTime;
    const result = DeterministicAnswerChecker.checkAnswer(currentQ, inputStr, pack);

    const attemptEvent: AttemptEvent = {
      eventId: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      learnerId: activeLearner.id,
      questionId: currentQ.id,
      skillId: currentQ.skillId,
      chosenAnswer: result.chosenOptionKey || inputStr,
      correct: result.isCorrect,
      mistakeTag: result.mistakeTag,
      hintsUsed: hintLevel,
      timeMs: timeSpentMs,
      inputMode,
      ts: Date.now(),
    };

    // Update locally in IndexedDB immediately (offline-first!)
    await PracticeEngine.recordAttemptAndUpdateSkill(attemptEvent);
    await refreshLearnerData();

    // Data usage: minimal ~200 bytes for telemetry event
    incrementDataUsage(200);

    // Track session stats
    setSessionResults((prev) => [...prev, { correct: result.isCorrect, hintsUsed: hintLevel }]);
    setActiveFeedback(result);
  };

  // Next question after feedback modal
  const handleNextQuestion = () => {
    setActiveFeedback(null);
    setHintLevel(0);
    setStartTime(Date.now());

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Session finished!
      setIsSessionFinished(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#15803D', '#16A34A', '#FACC15'],
      });

      // Background sync outbox
      triggerSync();
    }
  };

  // Session Summary Screen
  if (isSessionFinished) {
    const total = sessionResults.length;
    const correctCount = sessionResults.filter((r) => r.correct).length;
    const accuracy = Math.round((correctCount / total) * 100);

    return (
      <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col justify-between p-4 max-w-md mx-auto">
        <div className="text-center pt-8">
          <div className="w-24 h-24 rounded-full bg-[#15803D] text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-700/20 border-4 border-white mb-4 animate-bounce">
            <Trophy className="w-12 h-12 stroke-[2.5]" />
          </div>

          <h1 className="text-2xl font-black text-[#0F172A] mb-1">
            {pack.uiStrings.sessionComplete || 'అభినందనలు! సెషన్ పూర్తయింది'}
          </h1>
          <p className="text-xs text-[#475569] mb-6 font-medium">
            మీరు 5 ప్రశ్నల సాధన విజయవంతంగా పూర్తి చేశారు!
          </p>

          {/* Stats Card */}
          <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs mb-6">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#D1E7DD]">
              <div className="text-center">
                <div className="text-xs text-[#475569] font-medium">ఖచ్చితత్వం</div>
                <div className="text-3xl font-black text-[#0F172A] mt-0.5">
                  {accuracy}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#475569] font-medium">సరైన జవాబులు</div>
                <div className="text-3xl font-black text-[#059669] mt-0.5">
                  {correctCount} / {total}
                </div>
              </div>
            </div>

            {/* Lantern Glow Increase Notice */}
            <div className="flex items-center gap-3 pt-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] flex items-center justify-center shrink-0">
                <Flame className="w-7 h-7 fill-[#16A34A]" />
              </div>
              <div>
                <div className="font-bold text-sm text-[#0F172A]">
                  {pack.uiStrings.lanternGlowIncreased || 'మీ లాంతరు ప్రకాశం పెరిగింది!'}
                </div>
                <div className="text-xs text-[#475569]">
                  పల్లె దీపాలు మరింత దేదీప్యమానంగా వెలుగుతున్నాయి.
                </div>
              </div>
            </div>
          </div>

          {/* Saved Status Indicator */}
          <div className="inline-flex items-center gap-2 bg-[#DCFCE7] text-[#059669] text-xs font-semibold px-4 py-2 rounded-full border border-[#86EFAC]">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>{pack.uiStrings.progressSaved || 'మీ ప్రోగ్రెస్ స్థానికంగా సేవ్ అయింది'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-6 pb-2">
          <button
            type="button"
            onClick={() => {
              const selected = PracticeEngine.selectSessionQuestions(pack, skillStates, selectedTopicId || undefined);
              setQuestions(selected);
              setCurrentIndex(0);
              setHintLevel(0);
              setSessionResults([]);
              setIsSessionFinished(false);
            }}
            className="w-full py-4 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 active:scale-98 min-h-[56px]"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>మరో 5 ప్రశ్నల సాధన చేయి</span>
          </button>

          <button
            type="button"
            onClick={() => setScreen('S3_HOME')}
            className="w-full py-3.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#F0FDF4] text-[#0F172A] font-bold text-sm border border-[#D1E7DD] flex items-center justify-center gap-2 min-h-[50px] hover:border-[#15803D] shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>హోమ్‌కు వెళ్ళు</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Practice Screen
  const hintTexts = currentQ.hintLadder;
  const currentHintText = hintLevel > 0 ? hintTexts[hintLevel - 1] : null;

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col justify-between pb-4">
      {/* Top Header / Progress Tracker */}
      <header className="bg-[#FFFFFF] text-[#0F172A] px-4 py-3 shadow-xs border-b border-[#D1E7DD] sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setScreen('S3_HOME')}
            className="p-2 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] active:scale-95 border border-[#D1E7DD]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Question Stepper Indicator (3/5) */}
          <div className="flex items-center gap-2 bg-[#DCFCE7] px-3.5 py-1.5 rounded-xl border border-[#86EFAC]">
            <Flame className="w-4 h-4 text-[#16A34A] fill-[#16A34A]" />
            <span className="font-bold text-sm text-[#14532D]">
              ప్రశ్న {currentIndex + 1} / {questions.length}
            </span>
          </div>

          {/* Saved Status & Audio */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#059669] font-bold hidden sm:inline">
              సేవ్ అయింది ✓
            </span>
            <AudioButton
              text={`${currentQ.text}. ఆప్షన్లు: A. ${currentQ.options[0]}, B. ${currentQ.options[1]}, C. ${currentQ.options[2]}, D. ${currentQ.options[3]}`}
              label="వినండి"
              size="sm"
            />
          </div>
        </div>
      </header>

      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col justify-between">
        {/* Question Card */}
        <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]">
              {currentQ.difficulty === 1 ? 'సులభం' : currentQ.difficulty === 2 ? 'మధ్యస్థం' : 'క్లిష్టమైనది'}
            </span>
            <span className="text-xs text-[#475569] font-medium">గణితం · 10వ తరగతి</span>
          </div>

          <h2 className="text-lg font-bold text-[#0F172A] leading-snug mt-1">
            {currentQ.text}
          </h2>
        </div>

        {/* 4 Large Options Grid (56px+ touch target) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(['A', 'B', 'C', 'D'] as const).map((optKey, idx) => {
            const optText = currentQ.options[idx];
            return (
              <button
                key={optKey}
                type="button"
                onClick={() => handleSelectAnswer(optKey, 'tap')}
                className="bg-[#FFFFFF] hover:bg-[#F0FDF4] border-2 border-[#D1E7DD] hover:border-[#15803D] active:border-[#15803D] rounded-2xl p-4 flex flex-col justify-between text-left transition-all active:scale-95 shadow-xs min-h-[72px]"
              >
                <span className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] font-extrabold text-sm flex items-center justify-center mb-1">
                  {optKey}
                </span>
                <span className="font-semibold text-[#0F172A] text-sm leading-tight">
                  {optText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hint Ladder Card if opened */}
        {hintLevel > 0 && currentHintText && (
          <div className="bg-[#CCFBF1] border-2 border-[#14B8A6]/40 rounded-2xl p-4 mb-4 animate-fadeIn shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#0D9488] flex items-center gap-1.5 uppercase">
                <Lightbulb className="w-4 h-4 text-[#0D9488]" />
                సూచన దశ {hintLevel} / 3: {hintLevel === 1 ? 'గుర్తుచేయడం' : hintLevel === 2 ? 'పద్ధతి' : 'సాధించిన దశ'}
              </span>
              <AudioButton text={currentHintText} label="" size="sm" />
            </div>
            <p className="text-sm text-[#0F172A] leading-relaxed font-semibold">
              {currentHintText}
            </p>
          </div>
        )}

        {/* Bottom Action Row: [ hint button ] + [ voice answer ] */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {/* Hint Ladder Button */}
          <button
            type="button"
            onClick={handleRequestHint}
            disabled={hintLevel >= 3}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 font-bold text-sm min-h-[56px] transition-all active:scale-95 ${
              hintLevel >= 3
                ? 'bg-[#F1F5F9] text-[#94A3B8] border-[#D1E7DD] cursor-not-allowed opacity-50'
                : 'bg-[#FFFFFF] text-[#0D9488] border-[#0D9488]/50 hover:bg-[#F0FDFA] shadow-xs'
            }`}
          >
            <Lightbulb className="w-5 h-5 text-[#0D9488]" />
            <span>
              {hintLevel === 0 ? 'సూచన కావాలా?' : hintLevel < 3 ? 'తదుపరి సూచన' : 'అన్ని సూచనలు చూశారు'}
            </span>
          </button>

          {/* Voice Answer Button */}
          <div className="flex-1">
            <VoiceInputButton
              size="md"
              label="వాయిస్ జవాబు"
              onTranscript={(transcript) => {
                handleSelectAnswer(transcript, 'voice');
              }}
            />
          </div>
        </div>
      </main>

      {/* S6 Feedback Modal */}
      {activeFeedback && (
        <S6_FeedbackModal
          result={activeFeedback}
          hintsUsed={hintLevel}
          onNext={handleNextQuestion}
          onRetrySimilar={() => {
            setActiveFeedback(null);
            setHintLevel(0);
          }}
        />
      )}
    </div>
  );
};
