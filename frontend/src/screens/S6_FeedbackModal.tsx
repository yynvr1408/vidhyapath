import React from 'react';
import { CheckCircle2, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AudioButton } from '../components/AudioButton';
import { AnswerCheckResult } from '../engine/answerChecker';

interface FeedbackModalProps {
  result: AnswerCheckResult;
  hintsUsed: number;
  onNext: () => void;
  onRetrySimilar?: () => void;
}

export const S6_FeedbackModal: React.FC<FeedbackModalProps> = ({
  result,
  hintsUsed,
  onNext,
  onRetrySimilar,
}) => {
  const { pack } = useApp();
  const isCorrect = result.isCorrect;

  const isEn = pack?.language === 'en';
  const isHi = pack?.language === 'hi';

  const modalTitle = isCorrect
    ? pack?.uiStrings.greatJob ||
      (isEn ? "Great job! That's correct!" : isHi ? 'बहुत बढ़िया! सही उत्तर!' : 'చాలా బాగుంది! సరిగ్గా సమాధానం ఇచ్చారు!')
    : pack?.uiStrings.tryAgain ||
      (isEn ? "Let's inspect closely" : isHi ? 'आइए ध्यान से देखें' : 'ఒకసారి నిశితంగా పరిశీలిద్దాం');

  const subtitle = isCorrect
    ? hintsUsed === 0
      ? isEn
        ? 'Solved independently without any hints! ⭐'
        : isHi
        ? 'बिना किसी संकेत के हल किया! ⭐'
        : 'ఎలాంటి సూచనలు లేకుండా సాధించారు! ⭐'
      : isEn
      ? `Solved with the help of ${hintsUsed} hint(s).`
      : isHi
      ? `${hintsUsed} संकेत(तों) की सहायता से हल किया।`
      : `${hintsUsed} సూచనల సహాయంతో సాధించారు.`
    : isEn
    ? 'Mistakes are stepping stones to mastering concepts.'
    : isHi
    ? 'गलतियों से ही सही मार्ग समझ में आता है।'
    : 'తప్పుల ద్వారానే సరైన మార్గం తెలుస్తుంది.';

  const spokenFeedback = isCorrect
    ? isEn
      ? "Great job! That's the correct answer!"
      : isHi
      ? 'बहुत बढ़िया! आपका उत्तर सही है।'
      : 'చాలా బాగుంది! మీ సమాధానం సరైనది.'
    : `${isEn ? "Let's inspect closely. " : isHi ? 'आइए ध्यान से देखें। ' : 'ఒకసారి నిశితంగా పరిశీలిద్దాం. '}${
        result.remedyText || ''
      }`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div
        className={`w-full max-w-md bg-[#FFFFFF] rounded-3xl p-5 shadow-2xl border-2 transition-all ${
          isCorrect ? 'border-[#059669]' : 'border-[#DC2626]'
        }`}
      >
        {/* Header Icon & Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isCorrect ? 'bg-[#059669] text-white shadow-md' : 'bg-[#DC2626] text-white shadow-md'
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              ) : (
                <HelpCircle className="w-7 h-7 stroke-[2.5]" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0F172A] leading-tight">{modalTitle}</h3>
              <p className="text-xs text-[#475569] font-medium">{subtitle}</p>
            </div>
          </div>
          <AudioButton text={spokenFeedback} label="" size="sm" />
        </div>

        {/* Feedback Body */}
        {isCorrect ? (
          <div className="bg-[#DCFCE7] p-4 rounded-2xl border border-[#86EFAC] mb-5">
            <div className="flex items-center gap-2 text-[#059669] font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4 text-[#059669]" />
              <span>
                {isEn ? 'Correct Answer:' : isHi ? 'सही उत्तर:' : 'సరైన జవాబు:'}{' '}
                {result.correctAnswerKey}
              </span>
            </div>
            <div className="text-[#0F172A] text-sm font-semibold">
              {result.correctAnswerText}
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            {/* Remedy explanation on #FEF2F2 light blush surface */}
            <div className="bg-[#FEF2F2] p-4 rounded-2xl border border-[#FECACA]">
              <div className="text-xs font-bold text-[#DC2626] uppercase tracking-wider mb-1">
                {isEn
                  ? 'Key Concept to Remember (Remedy):'
                  : isHi
                  ? 'याद रखने योग्य मुख्य बात (उपाय):'
                  : 'గుర్తుంచుకోవలసిన విషయం (Remedy):'}
              </div>
              <p className="text-[#0F172A] text-sm leading-relaxed font-semibold">
                {result.remedyText ||
                  (isEn
                    ? 'Review the formula and verify your remainder.'
                    : isHi
                    ? 'सूत्र और शेषफल की पुनः जाँच करें।'
                    : 'సూత్రాన్ని మరియు శేషాన్ని సరిచూడండి.')}
              </p>
            </div>

            {/* Stored correct answer preview */}
            <div className="bg-[#F4F9F6] p-3 rounded-xl border border-[#D1E7DD] text-xs text-[#475569] flex justify-between items-center">
              <span>
                {isEn ? 'Correct Option:' : isHi ? 'सही विकल्प:' : 'సరైన ఆప్షన్:'}{' '}
                <strong className="text-[#15803D] font-bold">{result.correctAnswerKey}</strong>
              </span>
              <span className="font-semibold text-[#0F172A]">{result.correctAnswerText}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {!isCorrect && onRetrySimilar && (
            <button
              type="button"
              onClick={onRetrySimilar}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#F4F9F6] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-sm border border-[#D1E7DD] transition-all active:scale-95 min-h-[52px]"
            >
              {isEn ? 'Try Similar' : isHi ? 'समान प्रश्न पुनः हल करें' : 'మళ్ళీ ప్రయత్నించు'}
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all min-h-[52px]"
          >
            <span>
              {isCorrect
                ? pack?.uiStrings.nextStep || (isEn ? 'Next Question' : isHi ? 'अगला प्रश्न' : 'తదుపరి ప్రశ్న')
                : isEn
                ? 'Understood, Continue'
                : isHi
                ? 'समझ गया, आगे बढ़ें'
                : 'అర్థమైంది, ముందుకు సాగండి'}
            </span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
