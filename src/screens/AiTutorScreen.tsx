import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Send,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  X,
  ShieldCheck,
  Lightbulb,
  Mic,
  Volume2,
  CloudCheck,
  School,
  ArrowRight,
  BrainCircuit,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TutorService, TutorResponse } from '../services/tutor';
import { DoubtItem } from '../types';
import { localDb } from '../db/indexedDb';
import { getTranslations, SupportedLang } from '../utils/translations';
import { AudioButton } from '../components/AudioButton';
import { VoiceInputButton, type VoiceInputControl } from '../components/VoiceInputButton';

export const AiTutorScreen: React.FC = () => {
  const {
    pack,
    activeLearner,
    isOffline,
    lowDataMode,
    currentLanguage,
    switchLanguage,
    refreshLearnerData,
  } = useApp();

  const t = getTranslations(currentLanguage);

  const [doubtText, setDoubtText] = useState('');
  const [activeTopicId, setActiveTopicId] = useState<string>('ch1_real_numbers');
  const [tutorMode, setTutorMode] = useState<'auto' | 'manual_offline'>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    {
      sender: 'student' | 'tutor';
      text: string;
      source?: string;
      isQueued?: boolean;
      photo?: string;
      scaffoldHint?: string;
      showDiagram?: boolean;
    }[]
  >([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Voice Interaction state
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const voiceControlRef = useRef<VoiceInputControl | null>(null);

  // Initialize with welcoming greeting from Tutor in regional language
  useEffect(() => {
    let studentDisplayName =
      activeLearner?.nickname ||
      (currentLanguage === 'te' ? 'విద్యార్థి' : currentLanguage === 'hi' ? 'विद्यार्थी' : 'Student');
    if (activeLearner?.nickname && activeLearner.nickname.includes('/')) {
      const parts = activeLearner.nickname.split('/').map((s) => s.trim());
      const teluguPart = parts.find((p) => /[\u0C00-\u0C7F]/.test(p));
      const hindiPart = parts.find((p) => /[\u0900-\u097F]/.test(p));
      const englishPart = parts.find((p) => !/[\u0C00-\u0C7F\u0900-\u097F]/.test(p));
      if (currentLanguage === 'te' && teluguPart) studentDisplayName = teluguPart;
      else if (currentLanguage === 'hi' && hindiPart) studentDisplayName = hindiPart;
      else if (englishPart) studentDisplayName = englishPart;
    }

    const greetingText =
      currentLanguage === 'en'
        ? `Hello ${studentDisplayName}! I am your Maths Tutor. Ask any doubt by tapping the Mic button below or choosing a quick question.`
        : currentLanguage === 'hi'
        ? `नमस्ते ${studentDisplayName}! मैं आपका गणित ट्यूटर हूँ। नीचे माइक दबाकर बोलें या कोई प्रश्न चुनें।`
        : `నమస్కారం ${studentDisplayName}! నేను మీ గణిత ట్యూటర్‌ని. మీ సందేహాన్ని క్రింది మైక్ బటన్ నొక్కి మాట్లాడండి లేదా టైప్ చేయండి.`;

    setMessages([
      {
        sender: 'tutor',
        text: greetingText,
        source: 'preloaded',
        scaffoldHint:
          currentLanguage === 'te'
            ? 'గురుత్వాకర్షణ లంబ దిశలో మాత్రమే పనిచేస్తుంది. క్షితిజ సమాంతర వేగం మారుతుందా?'
            : currentLanguage === 'hi'
            ? 'गुरुत्वाकर्षण केवल ऊर्ध्वाधर दिशा में कार्य करता है। क्या क्षैतिज वेग परिवर्तित होगा?'
            : 'Gravity only acts in the vertical direction. Does horizontal velocity change if air resistance is ignored?',
        showDiagram: true,
      },
    ]);
  }, [activeLearner, currentLanguage]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmitDoubt = async (queryText?: string) => {
    const query = (queryText || doubtText).trim();
    if (!query || !pack || !activeLearner) return;

    // Append student message
    const currentPhoto = photoPreview;
    setMessages((prev) => [
      ...prev,
      { sender: 'student', text: query, photo: currentPhoto || undefined },
    ]);
    setDoubtText('');
    setPhotoPreview(null);
    setIsLoading(true);

    try {
      const res: TutorResponse = await TutorService.askDoubt(
        pack,
        activeLearner.id,
        query,
        activeTopicId,
        undefined,
        isOffline,
        lowDataMode,
        tutorMode,
        currentPhoto || undefined
      );

      // Enhance with Socratic scaffold hint
      const hint =
        currentLanguage === 'te'
          ? 'గురుత్వాకర్షణ లంబ దిశలో మాత్రమే పనిచేస్తుంది. స్వతంత్ర అంశాల ఆధారంగా ఆలోచించండి.'
          : currentLanguage === 'hi'
          ? 'गुरुत्वाकर्षण केवल ऊर्ध्वाधर घटक पर कार्य करता है। स्वतंत्र घटकों का विश्लेषण करें।'
          : 'Gravity only acts in the vertical direction. Consider the two independent velocity components.';

      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: res.answer,
          source: res.source,
          isQueued: res.isQueued,
          scaffoldHint: hint,
          showDiagram: true,
        },
      ]);
      await refreshLearnerData();
    } catch (err) {
      console.error('Error asking tutor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setDoubtText(t.photoDoubtPrompt || 'Please explain this notebook diagram');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectReasoning = (text: string) => {
    setDoubtText(`My hypothesis: ${text}`);
    handleSubmitDoubt(`My hypothesis: ${text}`);
  };

  const currentTopic = pack?.topics.find((tp) => tp.id === activeTopicId) || pack?.topics[0];
  const topicTitle = currentTopic?.title || 'Kinematics & Motion';

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto space-y-3.5 pb-6">
      {/* Hidden file input for photo doubts */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* 1. Offline Cache Status Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#f2f3ff] text-[#3e4947] text-xs shadow-2xs border border-[#CBD5E1]/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#fe932c] shrink-0 animate-pulse" />
          <span className="font-bold truncate">
            {isOffline
              ? 'Offline Mode Active • Local Socratic hints loaded'
              : 'Offline Hints Cached • Full Socratic dialogue online'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#005c55] font-extrabold text-[11px] shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Synced</span>
        </div>
      </div>

      {/* 2. Socratic Session Metadata & Multilingual Selector */}
      <div className="flex flex-col gap-2 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#CBD5E1]/60 shadow-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <School className="w-4 h-4 text-[#005c55] shrink-0" />
            <span className="font-extrabold text-sm text-[#131b2e] truncate">
              Grade 10 • {topicTitle}
            </span>
          </div>

          {/* Trilingual Toggle Buttons */}
          <div className="flex items-center bg-[#eaedff] p-1 rounded-full shrink-0 gap-1">
            <button
              type="button"
              onClick={() => switchLanguage('en')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-[#005c55] text-white shadow-2xs'
                  : 'text-[#3e4947] hover:text-[#131b2e]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => switchLanguage('te')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currentLanguage === 'te'
                  ? 'bg-[#005c55] text-white shadow-2xs'
                  : 'text-[#3e4947] hover:text-[#131b2e]'
              }`}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => switchLanguage('hi')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currentLanguage === 'hi'
                  ? 'bg-[#005c55] text-white shadow-2xs'
                  : 'text-[#3e4947] hover:text-[#131b2e]'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#3e4947]">
          <span className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#005c55] font-black uppercase text-[10px] tracking-wide">
            Unit Context
          </span>
          <span className="font-medium truncate">{topicTitle} • Step-by-Step Problem Solving</span>
        </div>
      </div>

      {/* 3. Academic Policy Callout */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#eaedff] text-[#3e4947] text-xs border border-[#CBD5E1]/50">
        <ShieldCheck className="w-5 h-5 text-[#005c55] shrink-0" />
        <p className="leading-snug">
          <strong className="text-[#131b2e]">Pedagogical Guardrail:</strong> Vidhyapath AI offers step-by-step Socratic hints. Solutions are guided, never pre-solved.
        </p>
      </div>

      {/* 4. Socratic Learning Dialogue Container */}
      <div className="flex flex-col gap-4 min-h-[280px]">
        {messages.map((m, idx) => {
          if (m.sender === 'student') {
            return (
              <div key={idx} className="flex flex-col items-end gap-1 pl-8 animate-fadeIn">
                <div className="flex items-center gap-1.5 px-2">
                  <span className="text-[11px] font-bold text-[#3e4947]">You • Just now</span>
                </div>
                <div className="p-3.5 sm:p-4 rounded-2xl rounded-tr-xs bg-[#0f766e] text-white shadow-xs max-w-lg">
                  {m.photo && (
                    <img
                      src={m.photo}
                      alt="Uploaded doubt"
                      className="max-h-40 rounded-xl mb-2 object-cover border border-white/20"
                    />
                  )}
                  <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                </div>
                <div className="flex items-center gap-1 text-[#3e4947] text-[10px] px-1 font-bold">
                  <CheckCircle2 className="w-3 h-3 text-[#005c55]" />
                  <span>Delivered</span>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex flex-col items-start gap-2 pr-4 animate-fadeIn">
              <div className="flex items-center gap-2 px-1">
                <div className="w-7 h-7 rounded-full bg-[#904d00] flex items-center justify-center text-white shadow-2xs font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-xs text-[#131b2e]">Socratic Mentor</span>
                <AudioButton text={m.text} size="sm" label="Listen" />
              </div>

              {/* AI Explanation Card */}
              <div className="p-4 sm:p-5 rounded-2xl rounded-tl-xs bg-white text-[#131b2e] shadow-xs border border-[#CBD5E1]/60 space-y-3.5 max-w-2xl w-full">
                <p className="text-sm leading-relaxed font-medium">{m.text}</p>

                {/* Socratic Hint Highlight Box */}
                {m.scaffoldHint && (
                  <div className="p-3.5 rounded-xl bg-[#ffdcc3]/40 text-[#6e3900] flex gap-3 border border-[#ffdcc3]">
                    <div className="w-8 h-8 rounded-lg bg-[#904d00] flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-extrabold text-xs text-[#6e3900]">Socratic Scaffold</span>
                      <p className="text-xs leading-relaxed font-medium">{m.scaffoldHint}</p>
                    </div>
                  </div>
                )}

                {/* Interactive Diagram Visual Anchor */}
                {m.showDiagram && (
                  <div className="relative w-full h-36 rounded-xl bg-[#eaedff] overflow-hidden flex flex-col justify-end p-2.5 border border-[#dae2fd]">
                    <svg className="absolute inset-0 w-full h-full text-[#005c55]" fill="none" preserveAspectRatio="none" viewBox="0 0 320 140">
                      <path
                        className="opacity-80"
                        d="M 20 120 Q 150 15, 300 120"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        strokeWidth="2.5"
                      />
                      <line
                        markerEnd="url(#arrow-h)"
                        stroke="#904d00"
                        strokeLinecap="round"
                        strokeWidth="2"
                        x1="80"
                        x2="120"
                        y1="72"
                        y2="72"
                      />
                      <line
                        markerEnd="url(#arrow-v)"
                        stroke="#005c55"
                        strokeLinecap="round"
                        strokeWidth="2"
                        x1="80"
                        x2="80"
                        y1="72"
                        y2="35"
                      />
                      <defs>
                        <marker id="arrow-h" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="6" refY="5" viewBox="0 0 10 10">
                          <path d="M 0 1 L 8 5 L 0 9 z" fill="#904d00" />
                        </marker>
                        <marker id="arrow-v" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="6" refY="5" viewBox="0 0 10 10">
                          <path d="M 0 1 L 8 5 L 0 9 z" fill="#005c55" />
                        </marker>
                      </defs>
                    </svg>

                    <div className="relative z-10 flex items-center justify-between text-[#3e4947] text-[10px] font-bold bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                      <span className="flex items-center gap-1 text-[#904d00]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#904d00]" />
                        vₓ (Horizontal)
                      </span>
                      <span className="flex items-center gap-1 text-[#005c55]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#005c55]" />
                        vᵧ (Vertical with g)
                      </span>
                      <span>θ Launch angle</span>
                    </div>
                  </div>
                )}

                {/* Socratic Question Guidance Pills */}
                <div className="pt-1">
                  <span className="text-[11px] font-black text-[#3e4947] uppercase tracking-wider block mb-2">
                    Select your reasoning:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectReasoning('Vertical is affected by g')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd] text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#005c55]" />
                      <span>Vertical is affected by g</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectReasoning('Horizontal is constant')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd] text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-[#005c55]" />
                      <span>Horizontal is constant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectReasoning('Both change simultaneously')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd] text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#6e7977]" />
                      <span>Both change</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3.5 bg-white rounded-2xl border border-[#CBD5E1]/60 shadow-xs max-w-xs animate-pulse">
            <Sparkles className="w-4 h-4 text-[#005c55] animate-spin" />
            <span className="text-xs font-bold text-[#3e4947]">Formulating Socratic Steps...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* 5. Realtime Multilingual Voice Interaction Console */}
      <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1]/60 shadow-xs flex flex-col gap-2.5 items-center text-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[#904d00]" />
            <span className="font-extrabold text-sm text-[#131b2e]">Voice Co-Pilot</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#ffdcc3] text-[#6e3900] text-[10px] font-black uppercase">
            Trilingual Realtime
          </span>
        </div>

        {/* Dynamic Audio Waveform Indicator */}
        <div
          className={`flex items-center justify-center gap-1.5 h-8 w-full max-w-[200px] transition-opacity ${
            isVoiceActive ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <div className="w-1.5 bg-[#904d00] rounded-full h-3 animate-pulse" />
          <div className="w-1.5 bg-[#904d00] rounded-full h-6 animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 bg-[#904d00] rounded-full h-8 animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="w-1.5 bg-[#904d00] rounded-full h-4 animate-pulse" style={{ animationDelay: '75ms' }} />
          <div className="w-1.5 bg-[#904d00] rounded-full h-7 animate-pulse" style={{ animationDelay: '220ms' }} />
          <div className="w-1.5 bg-[#904d00] rounded-full h-3 animate-pulse" style={{ animationDelay: '180ms' }} />
        </div>

        {/* Push-to-Talk Mic with VoiceInputButton fallback support */}
        <div className="flex flex-col items-center gap-1">
          <VoiceInputButton
            controlRef={voiceControlRef}
            onTranscript={(text) => {
              setDoubtText(text);
              handleSubmitDoubt(text);
            }}
            size="tutor"
            label="Speak"
          />

          <span className="text-xs font-bold text-[#131b2e] mt-1">
            {currentLanguage === 'te'
              ? 'తెలుగు లేదా ఇంగ్లీషులో మాట్లాడటానికి నొక్కండి'
              : currentLanguage === 'hi'
              ? 'हिंदी या अंग्रेजी में बोलने के लिए टैप करें'
              : 'Tap to speak in English, Telugu, or Hindi'}
          </span>
          <span className="text-[11px] text-[#3e4947] font-medium">
            "నేను అర్థం చేసుకోలేదు" • "समझाओ मुझे" • "Explain intuitively"
          </span>
        </div>
      </div>

      {/* Horizontally Scrollable Quick-Tap Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          t.chipExplainSimply,
          t.chipDailyExample,
          t.chipStepByStep,
          t.chipFormulaRecall,
          t.chipExamTip,
        ].map((chip, idx) => (
          <button
            key={`qc-${idx}`}
            type="button"
            onClick={() => {
              setDoubtText(chip);
              handleSubmitDoubt(chip);
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] text-[#005c55] text-xs font-bold border border-[#CBD5E1]/60 whitespace-nowrap active:scale-95 shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>⚡</span>
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* 6. Bottom Socratic Query Field */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white border border-[#CBD5E1]/60 shadow-md flex flex-col gap-1.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitDoubt();
          }}
          className="flex items-center gap-2"
        >
          {/* Notebook / Blackboard Photo Button (Preserves test selector title="Notebook / Blackboard Photo") */}
          <button
            type="button"
            title="Notebook / Blackboard Photo"
            aria-label="Add diagram attachment"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#3e4947] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <Camera className="w-5 h-5 text-[#005c55]" />
          </button>

          <div className="flex-1 flex items-center bg-[#f2f3ff] rounded-xl px-3.5 py-2 focus-within:ring-2 focus-within:ring-[#005c55]/20">
            <input
              type="text"
              value={doubtText}
              onChange={(e) => setDoubtText(e.target.value)}
              placeholder={t.typeDoubtPlaceholder}
              className="w-full bg-transparent text-xs sm:text-sm text-[#131b2e] placeholder:text-[#6e7977] outline-none font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={!doubtText.trim() && !photoPreview}
            aria-label="Send message"
            className="w-10 h-10 rounded-full bg-[#005c55] hover:bg-[#0f766e] text-white flex items-center justify-center shadow-xs active:scale-95 transition-transform shrink-0 disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between px-2 pt-0.5 text-[11px] text-[#3e4947]">
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-[#005c55]" />
            <span className="font-bold">Formulating Socratic Steps</span>
          </div>
          <span className="font-bold text-[#6e7977]">CBSE / State Board Aligned</span>
        </div>
      </div>
    </div>
  );
};
