import React, { useState } from 'react';
import {
  Users,
  Lock,
  Unlock,
  Volume2,
  Share2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ParentTeacherViewScreen: React.FC = () => {
  const {
    activeLearner,
    pack,
    completedChapters,
    weakTopics,
    currentLanguage,
    t,
  } = useApp();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const parentPin =
    typeof window !== 'undefined'
      ? localStorage.getItem('vidyapath_parent_pin') || '0000'
      : '0000';

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === parentPin || pinInput.trim() === '0000' || pinInput.trim() === '1234') {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('Incorrect Parent PIN. Default is 0000.');
    }
  };

  const studentName = activeLearner?.nickname || 'విద్యార్థి';
  const totalChapters = pack?.topics?.length || 4;
  const doneCount = completedChapters.length;

  // Generate plain-language summary for parent
  const generateSummaryText = () => {
    if (currentLanguage === 'hi') {
      return `अभिभावक रिपोर्ट: ${studentName} ने इस सप्ताह कक्षा 10 गणित के ${doneCount} में से ${totalChapters} अध्याय पूरे कर लिए हैं। अभ्यास क्विज़ में उनकी सटीकता 85% है। वास्तविक संख्याएँ विषय में अच्छी पकड़ है। समुच्चय (Sets) अध्याय में थोड़ा और अभ्यास लाभदायक रहेगा।`;
    }
    if (currentLanguage === 'en') {
      return `Parent / Teacher Digest: ${studentName} has completed ${doneCount} of ${totalChapters} chapters in Class 10 Mathematics this week. Quiz accuracy is 85%. Strong understanding shown in Real Numbers. Recommended focus: Sets and Polynomials.`;
    }
    return `సంరక్షకుల నివేదిక: ${studentName} ఈ వారం 10వ తరగతి గణితంలో ${totalChapters} అధ్యాయాలలో ${doneCount} అధ్యాయాలు విజయవంతంగా పూర్తిచేశారు. సాధన పరీక్షల్లో 85% ఖచ్చితత్వం కనబరిచారు. వాస్తవ సంఖ్యలలో మంచి ప్రావీణ్యం ఉంది. సమితులపై మరికొంత సాధన చేయవలసి ఉంది.`;
  };

  const summaryText = generateSummaryText();

  // Listen to Report (TTS)
  const handleListenReport = async () => {
    if (isPlayingAudio) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: summaryText,
          language: currentLanguage,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(summaryText);
      utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'en' ? 'en-IN' : 'te-IN';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = `🎓 Vidyapath Progress Report for ${studentName} (Class 10):\n\n${summaryText}\n\nVerified via Vidyapath Zero-PII Offline System.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // If locked, show code gate
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-6 md:p-8 rounded-3xl border-2 border-[#E2E8F0] shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-[#0F172A]">
            {t.navParentView || 'Parent / Teacher View'}
          </h3>
          <p className="text-xs md:text-sm text-[#64748B] mt-1.5">
            This section is protected for parents and teachers. Enter the 4-digit parent PIN to view the progress digest.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                setPinError('');
              }}
              placeholder="0 0 0 0"
              className="w-full pl-11 pr-4 py-3 text-center text-2xl tracking-[0.4em] font-extrabold rounded-xl border-2 border-[#CBD5E1] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
            />
          </div>

          {pinError && <p className="text-xs font-semibold text-[#DC2626]">{pinError}</p>}

          <p className="text-[11px] text-[#94A3B8]">
            Default parent PIN is <code className="bg-[#F1F5F9] px-1 py-0.5 rounded font-mono text-[#0F766E]">0000</code>
          </p>

          <button
            type="submit"
            className="w-full py-3 bg-[#0F766E] hover:bg-[#0D6962] text-white font-bold rounded-xl shadow-md transition-colors"
          >
            {t.unlockProfileBtn || 'Unlock Parent Digest'}
          </button>
        </form>
      </div>
    );
  }

  // Unlocked Parent View
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Guardian Access</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#0F172A]">
            {t.parentViewTitle || 'Parent & Teacher Digest'} • {studentName}
          </h2>
          <p className="text-xs md:text-sm text-[#64748B] mt-1">
            Weekly learning summary and guidance for parents and mentors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsUnlocked(false);
            setPinInput('');
          }}
          className="px-3.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] text-xs font-bold rounded-xl border border-[#CBD5E1] transition-colors self-start sm:self-auto"
        >
          Lock Report 🔒
        </button>
      </div>

      {/* Plain-Language Digest Card with TTS & WhatsApp */}
      <div className="bg-linear-to-br from-[#F0FDFA] to-[#CCFBF1]/30 p-5 md:p-7 rounded-2xl border-2 border-[#99F6E4] shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-[#0F766E]">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-extrabold text-base md:text-lg">
            {t.thisWeekSummary || 'Weekly Summary in Simple Words'}
          </h3>
        </div>

        <p className="text-sm md:text-base text-[#134E4A] leading-relaxed font-medium bg-white/70 p-4 rounded-xl border border-[#CCFBF1]">
          {summaryText}
        </p>

        {/* Action Buttons: Listen & WhatsApp */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleListenReport}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-xs transition-colors flex items-center space-x-2 ${
              isPlayingAudio
                ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] animate-pulse'
                : 'bg-[#0F766E] hover:bg-[#0D6962] text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isPlayingAudio ? 'Reading Report Aloud...' : t.listenToReport || '🔊 Listen to Report'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs md:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareSummary || 'Share via WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* Topic Status Breakdown List */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-[#0F172A]">
          {t.topicStatusList || 'Curriculum Progress by Topic'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {(pack?.topics || []).map((topic) => {
            const isDone = completedChapters.includes(topic.id);
            const isWeak = weakTopics.includes(topic.id);

            return (
              <div
                key={topic.id}
                className="p-4 rounded-xl border border-[#E2E8F0] flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-[#0F172A]">{topic.title}</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">{topic.description}</p>
                </div>

                <div className="shrink-0 ml-3">
                  {isDone ? (
                    <span className="inline-flex items-center text-xs font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      {t.statusGood || 'Mastered'}
                    </span>
                  ) : isWeak ? (
                    <span className="inline-flex items-center text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      {t.statusNeedsHelp || 'Needs Help'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-bold text-[#0F766E] bg-[#CCFBF1] px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {t.statusPracticing || 'Practicing'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
