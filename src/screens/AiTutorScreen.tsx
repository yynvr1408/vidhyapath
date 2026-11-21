import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Camera,
  Send,
  Sparkles,
  HelpCircle,
  Volume2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TutorService, TutorResponse } from '../services/tutor';
import { DoubtItem } from '../types';
import { localDb } from '../db/indexedDb';
import { getTranslations } from '../utils/translations';
import { AudioButton } from '../components/AudioButton';
import { VoiceInputButton } from '../components/VoiceInputButton';

export const AiTutorScreen: React.FC = () => {
  const {
    pack,
    activeLearner,
    isOffline,
    lowDataMode,
    currentLanguage,
    refreshLearnerData,
  } = useApp();

  const t = getTranslations(currentLanguage);

  const [doubtText, setDoubtText] = useState('');
  const [activeTopicId, setActiveTopicId] = useState<string>('ch1_real_numbers');
  const [tutorMode, setTutorMode] = useState<'auto' | 'manual_offline'>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    { sender: 'student' | 'tutor'; text: string; source?: string; isQueued?: boolean; photo?: string }[]
  >([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize with welcoming greeting from Tutor in regional language
  useEffect(() => {
    const greetingText =
      currentLanguage === 'en'
        ? `Hello ${activeLearner?.nickname || 'Student'}! I am your Maths Tutor. Ask any doubt by tapping the Mic button below or choosing a quick question.`
        : currentLanguage === 'hi'
        ? `नमस्ते ${activeLearner?.nickname || 'विद्यार्थी'}! मैं आपका गणित ट्यूटर हूँ। नीचे माइक दबाकर बोलें या कोई प्रश्न चुनें।`
        : `నమస్కారం ${activeLearner?.nickname || 'విద్యార్థి'}! నేను మీ గణిత ట్యూటర్‌ని. మీ సందేహాన్ని క్రింది మైక్ బటన్ నొక్కి మాట్లాడండి లేదా టైప్ చేయండి.`;

    setMessages([
      {
        sender: 'tutor',
        text: greetingText,
        source: 'preloaded',
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

      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: res.answer,
          source: res.source,
          isQueued: res.isQueued,
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
      setDoubtText(t.photoDoubtPrompt);
    };
    reader.readAsDataURL(file);
  };

  const quickChips = [
    t.chipExplainSimply,
    t.chipDailyExample,
    t.chipStepByStep,
    t.chipFormulaRecall,
    t.chipExamTip,
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] justify-between bg-[#FFFFFF] rounded-[12px] border border-[#E2E8F0] shadow-xs overflow-hidden">
      {/* Header with Chapter Selector & Mode Switcher */}
      <div className="bg-[#F8FAFC] p-3 border-b border-[#E2E8F0] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0F766E]" />
            <span className="font-extrabold text-sm text-[#0F172A]">
              {t.aiTutorTitle}
            </span>
          </div>

          {/* Chapter Context Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#475569] font-medium hidden sm:inline">
              {t.chapterLabel}
            </span>
            <select
              value={activeTopicId}
              onChange={(e) => setActiveTopicId(e.target.value)}
              className="text-xs bg-[#FFFFFF] text-[#0F172A] font-bold px-2 py-1 rounded-[8px] border border-[#E2E8F0] focus:outline-hidden"
            >
              {pack?.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Tutor Auto Fallback vs Manual Offline Mode & Lantern Mastery */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E2E8F0]/60">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTutorMode('auto')}
              className={`py-1 px-2.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                tutorMode === 'auto'
                  ? 'bg-[#0F766E] text-white shadow-2xs'
                  : 'bg-white text-[#475569] border border-[#E2E8F0] hover:text-[#0F172A]'
              }`}
              title="Automatically uses live AI when online, seamless offline pedagogical hints when disconnected"
            >
              <Sparkles className="w-3 h-3" />
              <span>{t.autoFallbackBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setTutorMode('manual_offline')}
              className={`py-1 px-2.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                tutorMode === 'manual_offline'
                  ? 'bg-[#D97706] text-white shadow-2xs'
                  : 'bg-white text-[#475569] border border-[#E2E8F0] hover:text-[#0F172A]'
              }`}
              title="Forces 100% textbook pedagogical hints with zero internet data consumption"
            >
              <span>{t.manualOfflineBtn}</span>
            </button>
          </div>

          {/* Chapter Lantern Village Mastery Glow */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FEF3C7] text-[#92400E] text-[11px] font-bold rounded-full border border-[#FDE68A]">
            <span>{t.lanternActiveBadge}</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Scrollable Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]/50">
        {messages.map((msg, index) => {
          const isStudent = msg.sender === 'student';
          return (
            <div
              key={index}
              className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              {/* Optional Attached Photo */}
              {msg.photo && (
                <div className="mb-1.5 max-w-xs">
                  <img
                    src={msg.photo}
                    alt="Problem attachment"
                    className="w-48 h-32 object-cover rounded-[12px] border border-[#E2E8F0] shadow-xs"
                  />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-md p-3.5 rounded-[12px] shadow-2xs ${
                  isStudent
                    ? 'bg-[#0F766E] text-white rounded-br-xs'
                    : 'bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0] rounded-bl-xs'
                }`}
              >
                {!isStudent && (
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#E2E8F0]/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F766E]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.tutorReplyHeader}</span>
                      {msg.source === 'common_doubts' && (
                        <span className="text-[10px] bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded-md font-bold">
                          {currentLanguage === 'hi' ? '📖 सामान्य प्रश्न' : currentLanguage === 'en' ? '📖 Curated FAQ' : '📖 తరచుగా అడిగే ప్రశ్నలు'}
                        </span>
                      )}
                      {msg.source === 'offline_pedagogy' && (
                        <span className="text-[10px] bg-[#DCFCE7] text-[#166534] px-1.5 py-0.5 rounded-md font-bold">
                          {currentLanguage === 'hi' ? '🛡️ ऑफ़लाइन संकेत' : currentLanguage === 'en' ? '🛡️ Offline Pedagogical Hint' : '🛡️ ఆఫ్‌లైన్ సూచన'}
                        </span>
                      )}
                      {msg.source === 'ai_model' && (
                        <span className="text-[10px] bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] px-1.5 py-0.5 rounded-md font-bold">
                          {currentLanguage === 'hi' ? '⚡ AI ट्यूटर' : currentLanguage === 'en' ? '⚡ AI Tutor' : '⚡ AI ట్యూటర్'}
                        </span>
                      )}
                    </div>
                    {/* TTS Speaker Listen Button */}
                    <AudioButton text={msg.text} label="" size="sm" />
                  </div>
                )}

                <div className="text-sm font-medium leading-relaxed whitespace-pre-line">
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E] bg-[#F0FDFA] p-3 rounded-[12px] border border-[#E2E8F0] max-w-xs animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{t.thinking}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Pre-Loaded Instant Common Doubts Pills */}
      {pack?.commonDoubts && pack.commonDoubts.length > 0 && (
        <div className="bg-[#FFFFFF] px-3 py-2 border-t border-[#E2E8F0]">
          <div className="text-[11px] font-bold text-[#475569] mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>{t.frequentDoubtsHeader}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {pack.commonDoubts
              .filter((cd) => cd.topicId === activeTopicId)
              .map((cd) => (
                <button
                  key={cd.id}
                  type="button"
                  onClick={() => handleSubmitDoubt(cd.q)}
                  className="px-3 py-1.5 rounded-full bg-[#F8FAFC] hover:bg-[#F0FDFA] hover:text-[#0F766E] text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] whitespace-nowrap active:scale-95 shrink-0"
                >
                  {cd.q}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Horizontally Scrollable Quick-Tap Prompt Chips */}
      <div className="bg-[#FFFFFF] px-3 py-2 border-t border-[#E2E8F0] flex gap-2 overflow-x-auto no-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setDoubtText(chip);
              handleSubmitDoubt(chip);
            }}
            className="px-3 py-1.5 rounded-full bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] text-xs font-bold border border-[#E2E8F0] whitespace-nowrap active:scale-95 shrink-0 transition-colors"
          >
            ⚡ {chip}
          </button>
        ))}
      </div>

      {/* Prominent Bottom Input Bar: Large Mic (#D97706) + Camera + Text */}
      <div className="bg-[#FFFFFF] p-3 border-t border-[#E2E8F0] flex items-center gap-2">
        {/* Large Primary Voice Mic Button (#D97706) */}
        <VoiceInputButton
          size="md"
          label=""
          onTranscript={(transcript) => {
            setDoubtText(transcript);
            handleSubmitDoubt(transcript);
          }}
        />

        {/* Camera / Photo Upload Button */}
        <label
          title={t.photoUploadTitle}
          className="w-12 h-12 rounded-[12px] bg-[#F8FAFC] hover:bg-[#F0FDFA] text-[#0F766E] border border-[#E2E8F0] flex items-center justify-center cursor-pointer active:scale-95 shrink-0 transition-all"
        >
          <Camera className="w-5 h-5 stroke-[2.2]" />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>

        {/* Text Input Box */}
        <input
          type="text"
          value={doubtText}
          onChange={(e) => setDoubtText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmitDoubt();
          }}
          placeholder={t.typeDoubtPlaceholder}
          className="flex-1 text-sm text-[#0F172A] placeholder-[#94A3B8] p-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden font-medium min-h-[48px]"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSubmitDoubt()}
          disabled={!doubtText.trim() && !photoPreview}
          className="w-12 h-12 rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-40 text-white flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-xs"
        >
          <Send className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
