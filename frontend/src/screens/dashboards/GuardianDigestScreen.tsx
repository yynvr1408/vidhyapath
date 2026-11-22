// Guardian Weekly Digest & Voice Summary Screen (Parent / Guardian View)
import React, { useState } from 'react';
import {
  FileText,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';

interface GuardianDigestScreenProps {
  onBack?: () => void;
}

export const GuardianDigestScreen: React.FC<GuardianDigestScreenProps> = ({ onBack }) => {
  const { currentLanguage } = useApp();
  const { user } = useEnterpriseAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isTe = currentLanguage === 'te';
  const isHi = currentLanguage === 'hi';

  const audioSummaryText = isTe
    ? 'నమస్కారం! ఈ వారం మీ పిల్లవాడు 85% సిలబస్ టాపిక్లను పూర్తి చేశారు. యూక్లిడ్ డివిజన్ లెమ్మాలో 92% నైపుణ్యం సాధించారు. అయితే, అకరణీయ సంఖ్యల దశాంశ రూపాలలో కాస్త అదనపు సాధన అవసరం. రోజుకు 15 నిమిషాలు ప్రాక్టీస్ చేయించండి.'
    : isHi
    ? 'नमस्ते! इस सप्ताह आपके बच्चे ने 85% पाठ्यक्रम विषयों को पूरा किया है। यूक्लिड विभाजन प्रमेयिका में 92% महारत हासिल की। हालांकि, परिमेय संख्याओं के दशमलव प्रसार में अतिरिक्त अभ्यास की आवश्यकता है। दैनिक 15 मिनट का अभ्यास करवाएं।'
    : 'Hello! This week your child completed 85% of assigned course topics. Achieved 92% mastery in Euclid’s Division Lemma. However, extra practice is recommended in decimal expansion of rational numbers. 15 minutes of daily practice will ensure full mastery.';

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(audioSummaryText);
        utterance.lang = isTe ? 'te-IN' : isHi ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.95;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setIsPlayingAudio(false), 5000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#BE185D]" />
              {isTe ? 'వారపు విద్యార్థి ప్రగతి సారాంశం' : isHi ? 'साप्ताहिक छात्र प्रगति सारांश' : 'Weekly Guardian Digest & Telemetry'}
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              {isTe
                ? 'మీ పిల్లల చదువు, హాజరు మరియు బలహీన అంశాల సమగ్ర విశ్లేషణ.'
                : isHi
                ? 'अपने बच्चे की पढ़ाई, उपस्थिति और कमजोर विषयों का व्यापक विश्लेषण।'
                : 'Comprehensive weekly progress, attendance, and AI diagnostic insights for parents.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#64748B]">
          <Calendar className="w-4 h-4 text-[#BE185D]" />
          <span>Week Ending: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Hero Audio Player Card (Accessible for non-literate parents) */}
      <div className="bg-gradient-to-r from-[#FDF2F8] to-[#FCE7F3] rounded-3xl p-6 border border-[#FBCFE8] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#BE185D] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#BE185D] bg-white/80 px-2 py-0.5 rounded-md">
                Voice Telemetry
              </span>
              <h2 className="text-base font-extrabold text-[#0F172A] mt-1">
                {isTe ? 'వారపు ఆడియో సారాంశం వినండి' : isHi ? 'साप्ताहिक ऑडियो सारांश सुनें' : 'Listen to Weekly Voice Summary'}
              </h2>
              <p className="text-xs text-[#475569] font-medium">
                {isTe ? 'తెలుగు వాయిస్ సారాంశం (1 నిమిషం)' : isHi ? 'हिंदी वॉइस सारांश (1 मिनट)' : 'English Voice Summary (1 min)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleAudio}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
              isPlayingAudio
                ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                : 'bg-[#BE185D] text-white hover:bg-[#9D174D]'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-4 h-4" />
                <span>{isTe ? 'ఆపు (Stop)' : isHi ? 'रोकें (Stop)' : 'Pause Audio'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{isTe ? 'వినండి (Play Audio)' : isHi ? 'सुनें (Play Audio)' : 'Play Voice Recap'}</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-3.5 bg-white/80 rounded-2xl border border-[#FBCFE8] text-xs text-[#334155] leading-relaxed italic">
          "{audioSummaryText}"
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B]">Weekly Study Time</span>
            <Clock className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] mt-2">4h 35m</div>
          <p className="text-[11px] text-[#16A34A] font-bold mt-1">↑ 18% higher than last week</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B]">Problems Solved</span>
            <Award className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-black text-[#0F172A] mt-2">42</div>
          <p className="text-[11px] text-[#475569] font-medium mt-1">38 Correct on first attempt</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B]">Mastery Rating</span>
            <Sparkles className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-black text-[#16A34A] mt-2">88%</div>
          <p className="text-[11px] text-[#0F766E] font-bold mt-1">Class 10 Real Numbers</p>
        </div>
      </div>

      {/* Focus Areas for Parent Attention */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-3">
        <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D97706]" />
          Recommended Focus Areas for This Weekend
        </h3>

        <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
          <div className="font-extrabold">Rational Numbers & Decimal Terminators</div>
          <p className="text-[11px] text-[#78350F] leading-relaxed">
            Encourage the student to solve 5 practice questions using the Adaptive Practice Engine on the phone.
          </p>
        </div>
      </div>
    </div>
  );
};
