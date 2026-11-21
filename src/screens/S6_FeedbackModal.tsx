import React from 'react';
import { CheckCircle2, HelpCircle, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
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
  const isCorrect = result.isCorrect;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div
        className={`w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border-4 transition-all ${
          isCorrect ? 'border-emerald-500 bg-linear-to-b from-emerald-50/70 to-white' : 'border-amber-400 bg-linear-to-b from-amber-50/60 to-white'
        }`}
      >
        {/* Header Icon & Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isCorrect ? 'bg-emerald-500 text-white shadow-md' : 'bg-amber-500 text-white shadow-md'
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <HelpCircle className="w-7 h-7" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">
                {isCorrect ? 'చాలా బాగుంది! సరిగ్గా సమాధానం ఇచ్చారు!' : 'ఒకసారి నిశితంగా పరిశీలిద్దాం'}
              </h3>
              <p className="text-xs text-slate-500">
                {isCorrect
                  ? hintsUsed === 0
                    ? 'ఎలాంటి సూచనలు లేకుండా సాధించారు! ⭐'
                    : `${hintsUsed} సూచనల సహాయంతో సాధించారు.`
                  : 'తప్పుల ద్వారానే సరైన మార్గం తెలుస్తుంది.'}
              </p>
            </div>
          </div>
          <AudioButton
            text={
              isCorrect
                ? 'చాలా బాగుంది! మీ సమాధానం సరైనది.'
                : `ఒకసారి నిశితంగా పరిశీలిద్దాం. ${result.remedyText || ''}`
            }
            label=""
            size="sm"
          />
        </div>

        {/* Feedback Body */}
        {isCorrect ? (
          <div className="bg-emerald-100/60 p-4 rounded-2xl border border-emerald-300/80 mb-5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>సరైన జవాబు: {result.correctAnswerKey}</span>
            </div>
            <div className="text-slate-800 text-sm font-medium">
              {result.correctAnswerText}
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            {/* Remedy explanation */}
            <div className="bg-amber-100/70 p-4 rounded-2xl border border-amber-300">
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                గుర్తుంచుకోవలసిన విషయం (Remedy):
              </div>
              <p className="text-slate-900 text-sm leading-relaxed font-medium">
                {result.remedyText || 'సూత్రాన్ని మరియు శేషాన్ని సరిచూడండి.'}
              </p>
            </div>

            {/* Stored correct answer preview */}
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex justify-between items-center">
              <span>సరైన ఆప్షన్: <strong className="text-indigo-brand font-bold">{result.correctAnswerKey}</strong></span>
              <span className="font-semibold text-slate-900">{result.correctAnswerText}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {!isCorrect && onRetrySimilar && (
            <button
              type="button"
              onClick={onRetrySimilar}
              className="flex-1 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-brand font-bold text-xs flex items-center justify-center gap-1.5 min-h-[52px] active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>మళ్ళీ ప్రయత్నించు</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-base shadow-md flex items-center justify-center gap-2 min-h-[56px] active:scale-95 transition-all ${
              isCorrect
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-indigo-brand hover:bg-indigo-dark text-white'
            }`}
          >
            <span>తదుపరి ప్రశ్న</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
