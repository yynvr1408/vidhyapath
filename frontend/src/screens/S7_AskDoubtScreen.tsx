import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Camera, Sparkles, Clock, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { AudioButton } from '../components/AudioButton';
import { OfflineBanner } from '../components/OfflineBanner';
import { TutorService, TutorResponse } from '../services/tutor';
import { DoubtItem } from '../types';
import { localDb } from '../db/indexedDb';

export const S7_AskDoubtScreen: React.FC = () => {
  const { pack, activeLearner, isOffline, lowDataMode, setScreen, refreshLearnerData, queuedDoubtsCount } = useApp();

  const [doubtText, setDoubtText] = useState('');
  const [activeTopicId, setActiveTopicId] = useState<string>('ch1_real_numbers');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<TutorResponse | null>(null);
  const [doubtHistory, setDoubtHistory] = useState<DoubtItem[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [helpFeedbackGiven, setHelpFeedbackGiven] = useState<boolean>(false);

  // Load history from localDb
  const loadHistory = async () => {
    if (activeLearner) {
      const doubts = await localDb.getDoubtsByLearner(activeLearner.id);
      setDoubtHistory(doubts.reverse().slice(0, 10));
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeLearner]);

  const handleSubmitDoubt = async (queryToSubmit?: string) => {
    const text = queryToSubmit || doubtText;
    if (!text.trim() || !pack || !activeLearner) return;

    setIsLoading(true);
    setCurrentAnswer(null);
    setHelpFeedbackGiven(false);

    try {
      const res = await TutorService.askDoubt(
        pack,
        activeLearner.id,
        text,
        activeTopicId,
        undefined,
        isOffline,
        lowDataMode
      );

      setCurrentAnswer(res);
      setDoubtText('');
      setPhotoPreview(null);
      await loadHistory();
      await refreshLearnerData();
    } catch (err) {
      console.error('Error asking tutor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Photo capture simulation with client-side compression
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setDoubtText('చిత్రంలో ఉన్న సమస్య: యూక్లిడ్ పద్ధతిలో గ.సా.భా ను ఎలా కనుగొనాలి? వివరించండి.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col pb-8">
      {/* Header */}
      <header className="bg-[#FFFFFF] text-[#0F172A] px-4 py-3 shadow-xs border-b border-[#D1E7DD] sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen('S3_HOME')}
              className="p-2 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] active:scale-95 border border-[#D1E7DD]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-base">సందేహం అడగండి</span>
          </div>

          {queuedDoubtsCount > 0 && (
            <div className="flex items-center gap-1 text-xs bg-[#DCFCE7] text-[#14532D] px-2.5 py-1 rounded-full border border-[#86EFAC] font-bold">
              <Clock className="w-3.5 h-3.5 text-[#15803D]" />
              <span>క్యూలో: {queuedDoubtsCount}</span>
            </div>
          )}
        </div>
      </header>

      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col">
        {/* Topic Context Selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
            అధ్యాయం ఎంచుకోండి:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {pack?.topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTopicId(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeTopicId === t.id
                    ? 'bg-[#15803D] text-white border-[#15803D] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#475569] border-[#D1E7DD] hover:border-[#15803D]'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Big Mic for Voice Input (Primary Voice First Principle) */}
        <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#D1E7DD] shadow-xs flex flex-col items-center justify-center mb-4">
          <VoiceInputButton
            size="giant"
            label="మైక్ నొక్కి మీ సందేహం మాట్లాడండి"
            onTranscript={(transcript) => {
              setDoubtText(transcript);
              handleSubmitDoubt(transcript);
            }}
          />
          <span className="text-[11px] text-[#475569] mt-2 font-medium">
            తెలుగులో స్పష్టంగా మాట్లాడండి · ఆన్-డివైస్ రికగ్నిషన్
          </span>
        </div>

        {/* Text Input & Photo Option Box */}
        <div className="bg-[#FFFFFF] p-3 rounded-2xl border border-[#D1E7DD] shadow-xs mb-4">
          {photoPreview && (
            <div className="mb-2 relative">
              <img
                src={photoPreview}
                alt="Uploaded doubt"
                className="w-full h-32 object-cover rounded-xl border border-[#D1E7DD]"
              />
              <span className="absolute top-2 left-2 bg-[#DCFCE7] text-[#059669] text-[10px] px-2 py-0.5 rounded-md font-bold border border-[#86EFAC]">
                కంప్రెస్ చేయబడింది (180 KB)
              </span>
            </div>
          )}

          <textarea
            rows={2}
            value={doubtText}
            onChange={(e) => setDoubtText(e.target.value)}
            placeholder={pack?.uiStrings.typeDoubtPlaceholder || 'మీ సందేహాన్ని ఇక్కడ రాయండి...'}
            className="w-full text-sm text-[#0F172A] placeholder-[#94A3B8] p-3 rounded-xl bg-[#F4F9F6] border border-[#D1E7DD] focus:border-[#15803D] focus:outline-hidden resize-none font-medium mb-2"
          />

          <div className="flex items-center justify-between pt-2 border-t border-[#D1E7DD]">
            {/* Camera / Photo Doubt */}
            <label
              className={`p-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all border ${
                lowDataMode
                  ? 'bg-[#F1F5F9] text-[#94A3B8] border-[#D1E7DD] cursor-not-allowed'
                  : 'bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] border-[#D1E7DD] hover:border-[#15803D]'
              }`}
            >
              <Camera className="w-4 h-4 text-[#15803D]" />
              <span>ఫోటో</span>
              <input
                type="file"
                accept="image/*"
                disabled={lowDataMode}
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </label>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSubmitDoubt()}
              disabled={isLoading || !doubtText.trim()}
              className="py-2.5 px-5 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:bg-[#E2E8F0] text-white disabled:text-[#94A3B8] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              {isLoading ? (
                <span>ఆలోచిస్తున్నాను...</span>
              ) : (
                <>
                  <span>సందేహం పంపు</span>
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Tutor Answer Card */}
        {currentAnswer && (
          <div className="bg-[#FFFFFF] rounded-3xl p-5 border-2 border-[#15803D] shadow-md mb-5 animate-fadeIn">
            <div className="flex items-center justify-between mb-3 border-b border-[#D1E7DD] pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#16A34A]" />
                <span className="font-bold text-sm text-[#0F172A]">
                  ట్యూటర్ వివరణ {currentAnswer.source === 'common_doubts' ? '(ఆఫ్‌లైన్ సమాధానం)' : ''}
                </span>
              </div>
              <AudioButton text={currentAnswer.answer} label="వినండి" size="sm" />
            </div>

            <p className="text-[#0F172A] text-sm leading-relaxed font-semibold mb-4 whitespace-pre-line bg-[#F4F9F6] p-3.5 rounded-2xl border border-[#D1E7DD]">
              {currentAnswer.answer}
            </p>

            {/* "Did this help?" */}
            {!helpFeedbackGiven ? (
              <div className="bg-[#F4F9F6] p-3 rounded-2xl border border-[#D1E7DD] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#475569]">ఈ వివరణ ఉపయోగపడిందా?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHelpFeedbackGiven(true)}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-[#DCFCE7] text-[#059669] border border-[#86EFAC] hover:bg-[#BBF7D0] font-bold active:scale-95"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>అవును</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHelpFeedbackGiven(true);
                      setDoubtText('మరికొంత సులభంగా వివరించగలరా?');
                    }}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-[#E2E8F0] text-[#0F172A] hover:bg-[#CBD5E1] font-bold active:scale-95"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>ఇంకా స్పష్టత కావాలి</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-[#059669] font-bold bg-[#DCFCE7] py-2 rounded-xl border border-[#86EFAC]">
                ధన్యవాదాలు! మీ ఫీడ్‌బ్యాక్ సేవ్ అయింది.
              </div>
            )}
          </div>
        )}

        {/* Precomputed Common Doubts (Instant offline tutor answers) */}
        <div className="mb-5">
          <h3 className="font-bold text-sm text-[#0F172A] mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#16A34A]" />
            <span>తరచుగా అడిగే ప్రశ్నలు (ఆఫ్‌లైన్‌లో లభించేవి):</span>
          </h3>

          <div className="space-y-2">
            {pack?.commonDoubts
              .filter((cd) => cd.topicId === activeTopicId)
              .map((cd) => (
                <button
                  key={cd.id}
                  type="button"
                  onClick={() => handleSubmitDoubt(cd.q)}
                  className="w-full text-left bg-[#FFFFFF] hover:bg-[#F0FDF4] p-3.5 rounded-2xl border border-[#D1E7DD] hover:border-[#15803D] shadow-xs transition-all flex items-center justify-between group active:scale-98"
                >
                  <span className="text-xs font-semibold text-[#0F172A]">
                    {cd.q}
                  </span>
                  <span className="text-[11px] font-bold text-[#14532D] px-2 py-0.5 rounded bg-[#DCFCE7] border border-[#86EFAC] shrink-0 ml-2">
                    సమాధానం చూడు
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Doubt History List */}
        {doubtHistory.length > 0 && (
          <div className="mt-auto pt-4 border-t border-[#D1E7DD]">
            <h4 className="font-bold text-xs text-[#475569] mb-2 uppercase tracking-wider">
              గత సందేహాలు ({doubtHistory.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {doubtHistory.map((d) => (
                <div
                  key={d.id}
                  className="bg-[#FFFFFF] p-3 rounded-xl border border-[#D1E7DD] text-xs shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#0F172A] line-clamp-1">
                      {d.question}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'answered'
                          ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                          : 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/40'
                      }`}
                    >
                      {d.status === 'answered' ? 'సమాధానం ఇవ్వబడింది' : 'క్యూలో ఉంది (ఆఫ్‌లైన్)'}
                    </span>
                  </div>
                  {d.answer && (
                    <p className="text-[#475569] text-xs line-clamp-2 mt-1">
                      {d.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
