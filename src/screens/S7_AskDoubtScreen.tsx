import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Camera, Sparkles, Clock, HelpCircle, ThumbsUp, ThumbsDown, MessageSquare, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { AudioButton } from '../components/AudioButton';
import { OfflineBanner } from '../components/OfflineBanner';
import { TutorService, TutorResponse, extractProblemFromPhoto } from '../services/tutor';
import { compressPhotoToDataUrl, approxDataUrlBytes } from '../services/photo';
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
  const [photoKb, setPhotoKb] = useState<number>(0);
  const [photoBusy, setPhotoBusy] = useState<boolean>(false);
  const [photoNotice, setPhotoNotice] = useState<{ tone: 'gate' | 'check' | 'fail' | 'busy'; text: string } | null>(null);
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
      setPhotoNotice(null);
      await loadHistory();
      await refreshLearnerData();
    } catch (err) {
      console.error('Error asking tutor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Photo doubt: compress, send only when online and low-data mode is off, then
  // put the extracted text in the box for the learner to confirm. Never sends to the tutor.
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Gate: photo is sent only when online and low-data mode is off
    if (!navigator.onLine || lowDataMode) { // TODO native review
      setPhotoNotice({
        tone: 'gate',
        text: 'ఇంటర్నెట్ లేదు లేదా తక్కువ డేటా మోడ్ ఆన్‌లో ఉంది. దయచేసి ప్రశ్నను టైప్ చేయండి, లేదా కనెక్ట్ అయినప్పుడు ఫోటో ప్రయత్నించండి.', // TODO native review
      });
      return;
    }
    if (!pack) return;

    setPhotoBusy(true);
    setPhotoNotice({ tone: 'busy', text: 'ఫోటో చదువుతున్నాను...' }); // TODO native review
    try {
      const dataUrl = await compressPhotoToDataUrl(file);
      setPhotoPreview(dataUrl);
      setPhotoKb(Math.round(approxDataUrlBytes(dataUrl) / 1024));
      const problemText = await extractProblemFromPhoto(pack.id, dataUrl);
      if (problemText) {
        setDoubtText(problemText);
        setPhotoNotice({
          tone: 'check',
          text: 'దయచేసి వచనాన్ని తనిఖీ చేసి, తర్వాత సందేహం పంపు నొక్కండి.', // TODO native review
        });
      } else {
        setPhotoNotice({
          tone: 'fail',
          text: 'ఫోటోలోని ప్రశ్నను చదవలేకపోయాము. దయచేసి ప్రశ్నను టైప్ చేయండి.', // TODO native review
        });
      }
    } catch (err) {
      console.error('Photo doubt failed:', err);
      setPhotoNotice({
        tone: 'fail',
        text: 'ఫోటోలోని ప్రశ్నను చదవలేకపోయాము. దయచేసి ప్రశ్నను టైప్ చేయండి.', // TODO native review
      });
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col pb-8">
      {/* Header */}
      <header className="bg-indigo-brand text-white px-4 py-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen('S3_HOME')}
              className="p-2 rounded-xl bg-indigo-light hover:bg-indigo-dark text-white active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-base">సందేహం అడగండి</span>
          </div>

          {queuedDoubtsCount > 0 && (
            <div className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-full border border-amber-400/30">
              <Clock className="w-3.5 h-3.5 text-lantern" />
              <span>క్యూలో: {queuedDoubtsCount}</span>
            </div>
          )}
        </div>
      </header>

      <OfflineBanner />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col">
        {/* Topic Context Selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-indigo-brand mb-1.5">
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
                    ? 'bg-indigo-brand text-amber-300 border-indigo-brand shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Big Mic for Voice Input (Primary Voice First Principle) */}
        <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 shadow-sm flex flex-col items-center justify-center mb-4">
          <VoiceInputButton
            size="giant"
            label="మైక్ నొక్కి మీ సందేహం మాట్లాడండి"
            onTranscript={(transcript) => {
              setDoubtText(transcript);
              handleSubmitDoubt(transcript);
            }}
          />
          <span className="text-[11px] text-slate-500 mt-2">
            తెలుగులో స్పష్టంగా మాట్లాడండి
          </span>
        </div>

        {/* Text Input & Photo Option Box */}
        <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-xs mb-4">
          {photoPreview && (
            <div className="mb-2 relative">
              <img
                src={photoPreview}
                alt="Uploaded doubt"
                className="w-full h-32 object-cover rounded-xl border border-slate-200"
              />
              <span className="absolute top-2 left-2 bg-indigo-dark text-white text-[10px] px-2 py-0.5 rounded-md font-semibold">
                కంప్రెస్ చేయబడింది ({photoKb} KB)
              </span>
            </div>
          )}

          <textarea
            rows={2}
            value={doubtText}
            onChange={(e) => setDoubtText(e.target.value)}
            placeholder={pack?.uiStrings.typeDoubtPlaceholder || 'మీ సందేహాన్ని ఇక్కడ రాయండి...'}
            className="w-full text-sm text-slate-800 placeholder-slate-400 p-2 focus:outline-hidden resize-none font-medium"
          />

          {photoNotice && (
            <div
              className={`flex items-start gap-1.5 text-xs font-bold p-2 rounded-xl border mb-2 ${
                photoNotice.tone === 'check'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : photoNotice.tone === 'busy'
                    ? 'bg-cream-100 text-indigo-brand border-slate-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {photoNotice.tone === 'gate' ? (
                <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{photoNotice.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {/* Camera / Photo Doubt (Stretch) */}
            <label
              className={`p-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all ${
                lowDataMode
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-cream-100 hover:bg-cream-200 text-indigo-brand'
              }`}
            >
              <Camera className="w-4 h-4 text-lantern" />
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
              disabled={isLoading || photoBusy || !doubtText.trim()}
              className="py-2.5 px-5 rounded-xl bg-indigo-brand hover:bg-indigo-dark disabled:bg-slate-200 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              {isLoading ? (
                <span>ఆలోచిస్తున్నాను...</span>
              ) : (
                <>
                  <span>సందేహం పంపు</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Tutor Answer Card */}
        {currentAnswer && (
          <div className="bg-white rounded-3xl p-5 border-2 border-lantern shadow-md mb-5 animate-fadeIn">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-lantern" />
                <span className="font-bold text-sm text-indigo-brand">
                  ట్యూటర్ వివరణ {currentAnswer.source === 'common_doubts' ? '(ఆఫ్‌లైన్ సమాధానం)' : ''}
                </span>
              </div>
              <AudioButton text={currentAnswer.answer} label="వినండి" size="sm" />
            </div>

            <p className="text-slate-900 text-sm leading-relaxed font-medium mb-4 whitespace-pre-line">
              {currentAnswer.answer}
            </p>

            {/* "Did this help?" (Section 9 Key Flow F3) */}
            {!helpFeedbackGiven ? (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">ఈ వివరణ ఉపయోగపడిందా?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHelpFeedbackGiven(true)}
                    className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold active:scale-95"
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
                    className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold active:scale-95"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>ఇంకా స్పష్టత కావాలి</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-emerald-700 font-bold bg-emerald-50 py-1.5 rounded-xl border border-emerald-200">
                ధన్యవాదాలు! మీ ఫీడ్‌బ్యాక్ సేవ్ అయింది.
              </div>
            )}
          </div>
        )}

        {/* Precomputed Common Doubts (Instant offline tutor answers) */}
        <div className="mb-5">
          <h3 className="font-bold text-sm text-indigo-brand mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-lantern" />
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
                  className="w-full text-left bg-white hover:bg-amber-50/50 p-3 rounded-2xl border border-slate-200 shadow-2xs transition-all flex items-center justify-between group active:scale-98"
                >
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-brand">
                    {cd.q}
                  </span>
                  <span className="text-[11px] font-bold text-lantern px-2 py-0.5 rounded bg-amber-50 border border-amber-200 shrink-0 ml-2">
                    సమాధానం చూడు
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Doubt History List */}
        {doubtHistory.length > 0 && (
          <div className="mt-auto pt-4 border-t border-slate-200">
            <h4 className="font-bold text-xs text-slate-600 mb-2 uppercase tracking-wider">
              గత సందేహాలు ({doubtHistory.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {doubtHistory.map((d) => (
                <div
                  key={d.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-semibold text-indigo-brand line-clamp-1">
                      {d.question}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'answered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.status === 'answered' ? 'సమాధానం ఇవ్వబడింది' : 'క్యూలో ఉంది (ఆఫ్‌లైన్)'}
                    </span>
                  </div>
                  {d.answer && (
                    <p className="text-slate-700 text-xs line-clamp-2 mt-1">
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
