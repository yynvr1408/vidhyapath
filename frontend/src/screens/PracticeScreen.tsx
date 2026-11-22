import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Question } from '../types';

const DEFAULT_PRACTICE_QUESTIONS: Question[] = [
  {
    id: 'q_euclid_1',
    skillId: 'euclid_division',
    difficulty: 1,
    text: 'యూక్లిడ్ భాగహార న్యాయం ప్రకారం, a = bq + r అయినప్పుడు శేషం (r) కు వర్తించే సరైన నిబంధన ఏమిటి?',
    options: [
      'A) 0 < r < b',
      'B) 0 ≤ r < b',
      'C) 0 < r ≤ b',
      'D) 0 ≤ r ≤ b',
    ],
    answer: 'B',
    acceptedForms: ['B', 'b', '0 <= r < b'],
    hintLadder: [
      'శేషం సున్నా కావచ్చు మరియు విభాజకం కంటే తక్కువగా ఉండాలి.',
      'విభాజకం b అయితే, r అనేది 0 లేదా అంతకంటే పెద్దది, కానీ b కంటే చిన్నది.',
      'సరైన సూత్రం: 0 ≤ r < b.',
    ],
    distractorMistakes: {
      A: 'శేషం సున్నా అయ్యే అవకాశాన్ని మర్చిపోయారు.',
      C: 'శేషం విభాజకానికి సమానం కాకూడదు.',
      D: 'శేషం ఎల్లప్పుడూ విభాజకం కంటే తక్కువగా ఉండాలి.',
    },
    explanation: 'యూక్లిడ్ భాగహార శేష న్యాయం ప్రకారం 0 ≤ r < b. శేషం సున్నా లేదా ధన సంఖ్య కావచ్చు, కానీ విభాజకం b కంటే తక్కువగా ఉండాలి.',
  },
  {
    id: 'q_euclid_2',
    skillId: 'hcf_by_euclid',
    difficulty: 2,
    text: 'యూక్లిడ్ భాగహార న్యాయాన్ని ఉపయోగించి 45 మరియు 15 ల గ.సా.భా (HCF) ఎంత?',
    options: ['A) 5', 'B) 10', 'C) 15', 'D) 45'],
    answer: 'C',
    acceptedForms: ['C', 'c', '15'],
    hintLadder: [
      'పెద్ద సంఖ్య 45 ను చిన్న సంఖ్య 15 తో భాగించండి: 45 = 15(q) + r.',
      '45 = 15 × 3 + 0. ఇక్కడ శేషం r = 0 వచ్చింది.',
      'శేషం 0 వచ్చినప్పుడు విభాజకమే (15) గ.సా.భా అవుతుంది.',
    ],
    distractorMistakes: {
      A: '5 ఒక సాధారణ కారణాంకమే, కానీ గరిష్ఠ సామాన్య కారణాంకం కాదు.',
      B: '10 అనేది 45 యొక్క కారణాంకం కాదు.',
      D: '45 అనేది 15 కంటే పెద్దది, గ.సా.భా సంఖ్యల కంటే పెద్దదిగా ఉండదు.',
    },
    explanation: '45 = 15 × 3 + 0. శేషం 0 కావున గ.సా.భా = 15.',
  },
  {
    id: 'q_sets_1',
    skillId: 'sets_union',
    difficulty: 1,
    text: 'A = {1, 2, 3} మరియు B = {3, 4, 5} అయితే A ∪ B (సమ్మేళనం) విలువ ఎంత?',
    options: [
      'A) {3}',
      'B) {1, 2, 3, 4, 5}',
      'C) {1, 2, 4, 5}',
      'D) {1, 2, 3, 3, 4, 5}',
    ],
    answer: 'B',
    acceptedForms: ['B', 'b'],
    hintLadder: [
      'సమ్మేళనం (∪) అంటే రెండు సమితులలోని అన్ని మూలకాలను కలపడం.',
      'ఉమ్మడిగా ఉన్న మూలకం (3) ని కేవలం ఒకసారి మాత్రమే రాయాలి.',
      'అన్ని మూలకాలు కలిపితే: {1, 2, 3, 4, 5}.',
    ],
    distractorMistakes: {
      A: 'ఇది ఛేదనం (A ∩ B), సమ్మేళనం కాదు.',
      C: 'ఉమ్మడి మూలకం 3 ని వదిలివేశారు.',
      D: 'సమితిలో మూలకాలు పునరావృతం కాకూడదు.',
    },
    explanation: 'A ∪ B లో రెండు సమితుల మూలకాలు ఉంటాయి, ఉమ్మడి మూలకాలు పునరావృతం కాకుండా రాయాలి: {1, 2, 3, 4, 5}.',
  },
  {
    id: 'q_poly_1',
    skillId: 'polynomials_degree',
    difficulty: 2,
    text: 'p(x) = 3x³ - 5x² + 7x - 2 బహుపది యొక్క పరిమాణం (Degree) ఎంత?',
    options: ['A) 1', 'B) 2', 'C) 3', 'D) -2'],
    answer: 'C',
    acceptedForms: ['C', 'c', '3'],
    hintLadder: [
      'బహుపది పరిమాణం అంటే చరరాశి యొక్క గరిష్ఠ ఘాతాంకం.',
      'ఇందులో x యొక్క ఘాతాంకాలు: 3, 2, 1, 0.',
      'వీటిలో గరిష్ఠమైనది 3.',
    ],
    distractorMistakes: {
      B: '2 గరిష్ఠ ఘాతం కాదు, అంతకంటే పెద్ద ఘాతం ఉంది.',
      D: 'ఇది స్థిరపదం, పరిమాణం కాదు.',
    },
    explanation: 'బహుపదిలోని చరరాశి గరిష్ఠ ఘాతాంకం 3 కాబట్టి ఈ బహుపది పరిమాణం 3 (ఘన బహుపది).',
  },
];

export const PracticeScreen: React.FC = () => {
  const { pack, recordQuizAttempt, t } = useApp();

  const questions: Question[] =
    pack?.questions && pack.questions.length > 0
      ? pack.questions
      : DEFAULT_PRACTICE_QUESTIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });

  const currentQ = questions[currentIndex % questions.length];

  const handleSelectOption = (optKey: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optKey);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswerSubmitted) return;

    const isCorrect = selectedOption === currentQ.answer;
    setIsAnswerSubmitted(true);
    setSessionScore((prev) => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1,
    }));

    // Record in AppContext & localStorage
    recordQuizAttempt({
      questionId: currentQ.id,
      topicId: currentQ.skillId || 'maths_class10',
      chosenAnswer: selectedOption,
      correct: isCorrect,
      timestamp: Date.now(),
    });
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setHintIndex(-1);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handleShowHint = () => {
    if (currentQ.hintLadder && hintIndex < currentQ.hintLadder.length - 1) {
      setHintIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Session Progress & Score Header */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-extrabold text-sm shadow-xs">
            {currentIndex + 1}/{questions.length}
          </div>
          <div>
            <h3 className="font-extrabold text-sm md:text-base text-[#0F172A]">
              {t.practiceTitle || 'Adaptive Micro-Quizzes'}
            </h3>
            <p className="text-xs text-[#64748B]">Auto-saved locally • Instant Feedback</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]">
          <Award className="w-4 h-4 text-[#16A34A]" />
          <span>Score: {sessionScore.correct} / {sessionScore.total}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-5 md:p-8 rounded-2xl border-2 border-[#E2E8F0] shadow-xs space-y-6">
        {/* Question Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
              Question {currentIndex + 1}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#64748B]">
              Difficulty: {currentQ.difficulty === 1 ? 'Foundational' : currentQ.difficulty === 2 ? 'Intermediate' : 'Advanced'}
            </span>
          </div>

          <h4 className="text-base md:text-lg font-bold text-[#0F172A] leading-relaxed">
            {currentQ.text}
          </h4>
        </div>

        {/* 4 Multiple Choice Options */}
        <div className="grid grid-cols-1 gap-3">
          {currentQ.options.map((opt, idx) => {
            const optKey = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D' by position
            const isSelected = selectedOption === optKey;
            const isCorrect = isAnswerSubmitted && optKey === currentQ.answer;
            const isWrong = isAnswerSubmitted && isSelected && optKey !== currentQ.answer;

            return (
              <button
                key={opt}
                type="button"
                disabled={isAnswerSubmitted}
                onClick={() => handleSelectOption(optKey)}
                className={`w-full p-4 rounded-xl border-2 text-left font-semibold text-sm transition-all flex items-center justify-between ${
                  isCorrect
                    ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] shadow-xs'
                    : isWrong
                    ? 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]'
                    : isSelected
                    ? 'bg-[#F0FDFA] border-[#0F766E] text-[#0F766E] shadow-xs'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] text-[#334155]'
                }`}
              >
                <span>{opt}</span>
                {isCorrect && <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />}
                {isWrong && <XCircle className="w-5 h-5 text-[#EF4444] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Submit / Next / Hints */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {!isAnswerSubmitted ? (
            <>
              {currentQ.hintLadder && currentQ.hintLadder.length > 0 && (
                <button
                  type="button"
                  onClick={handleShowHint}
                  disabled={hintIndex >= currentQ.hintLadder.length - 1}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#D97706] bg-[#FEF3C7] hover:bg-[#FDE68A] disabled:opacity-40 transition-colors flex items-center space-x-1.5"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>
                    {hintIndex < 0 ? 'Need a Hint?' : `Next Hint (${hintIndex + 1}/${currentQ.hintLadder.length})`}
                  </span>
                </button>
              )}

              <button
                type="button"
                disabled={!selectedOption}
                onClick={handleSubmitAnswer}
                className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D6962] disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-xs transition-colors ml-auto"
              >
                {t.checkAnswer || 'Check Answer'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="w-full py-3 bg-[#0F766E] hover:bg-[#0D6962] text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span>{t.nextQuestion || 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hint Ladder Box */}
        {hintIndex >= 0 && currentQ.hintLadder && (
          <div className="p-4 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] space-y-1.5 text-xs md:text-sm text-[#92400E]">
            <div className="font-bold flex items-center space-x-1.5 text-[#B45309]">
              <Sparkles className="w-4 h-4" />
              <span>Hint {hintIndex + 1}:</span>
            </div>
            <p className="leading-relaxed">{currentQ.hintLadder[hintIndex]}</p>
          </div>
        )}

        {/* Explanation & Remedy on Answer Submit */}
        {isAnswerSubmitted && (
          <div
            className={`p-4 md:p-5 rounded-xl border text-xs md:text-sm space-y-2 ${
              selectedOption === currentQ.answer
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
            }`}
          >
            <div className="font-extrabold text-sm flex items-center space-x-2">
              {selectedOption === currentQ.answer ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  <span>{t.greatJob || 'Great Job! Correct Answer'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-[#DC2626]" />
                  <span>{t.tryAgain || 'Not quite! Correct Option was'} {currentQ.answer}</span>
                </>
              )}
            </div>

            {currentQ.explanation && (
              <p className="leading-relaxed pt-1">
                <strong>Explanation:</strong> {currentQ.explanation}
              </p>
            )}

            {selectedOption && currentQ.distractorMistakes?.[selectedOption] && (
              <div className="pt-2 text-xs text-[#7F1D1D] font-medium">
                <strong>Why this was tricky:</strong> {currentQ.distractorMistakes[selectedOption]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
