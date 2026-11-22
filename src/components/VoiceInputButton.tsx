import React, { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, X } from 'lucide-react';
import { SpeechService, getSpeechLocale, getSpeechLangFromLocale, SPEECH_ERROR_MESSAGES } from '../services/speech';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';

export interface VoiceInputControl {
  start: () => void;
  stop: () => void;
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  locale?: string;
  size?: 'md' | 'giant' | 'tutor';
  label?: string;
  controlRef?: React.MutableRefObject<VoiceInputControl | null>;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  locale: propLocale,
  size = 'giant',
  label: propLabel,
  controlRef,
}) => {
  const { lowDataMode, currentLanguage } = useApp();
  const effectiveLocale = propLocale || getSpeechLocale(currentLanguage);
  const langKey = getSpeechLangFromLocale(effectiveLocale);
  const t = getTranslations(langKey);
  const msgs = SPEECH_ERROR_MESSAGES[langKey];

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const stoppingRef = useRef(false);

  useEffect(() => {
    if (!errorNotice) return;
    const timer = setTimeout(() => setErrorNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [errorNotice]);

  const isSupported = SpeechService.isSttSupported();

  const handleStartListening = () => {
    if (lowDataMode) {
      setErrorNotice(t.voiceDisabledLowData);
      return;
    }

    if (!navigator.onLine) {
      setErrorNotice(t.networkRequiredVoice);
      return;
    }

    if (!isSupported) {
      setErrorNotice(t.voiceNotSupported);
      return;
    }

    setErrorNotice(null);
    setInterimTranscript('');
    setIsListening(true);
    stoppingRef.current = false;

    stopRef.current = SpeechService.startListening(
      effectiveLocale,
      (text) => {
        setIsListening(false);
        setInterimTranscript('');
        onTranscript(text);
      },
      (err) => {
        // Aborting by the student triggers an error event in some browsers; ignore it.
        if (stoppingRef.current) return;
        setIsListening(false);
        setInterimTranscript('');
        setErrorNotice(err);
      },
      () => {
        setIsListening(false);
        setInterimTranscript('');
      },
      (interim) => {
        setInterimTranscript(interim);
      }
    );
  };

  const handleStopListening = () => {
    stoppingRef.current = true;
    stopRef.current?.();
    stopRef.current = null;
    setIsListening(false);
    if (interimTranscript) {
      onTranscript(interimTranscript);
    }
    setInterimTranscript('');
  };

  // Lets the parent screen start/stop listening (e.g. from the welcome card).
  if (controlRef) {
    controlRef.current = { start: handleStartListening, stop: handleStopListening };
  }

  const defaultLabel =
    propLabel !== undefined
      ? propLabel
      : langKey === 'hi'
      ? 'उत्तर बोलें'
      : langKey === 'en'
      ? 'Speak Answer'
      : 'జవాబు చెప్పండి';

  if (!isSupported) {
    return (
      <div
        className={`text-center py-2 text-xs text-[#475569] flex items-center justify-center gap-1.5 bg-[#FFFFFF] p-2.5 rounded-xl border border-[#D1E7DD] ${
          size === 'tutor' ? 'basis-full' : ''
        }`}
      >
        <MicOff className="w-4 h-4 text-[#94A3B8]" />
        <span>{t.voiceNotSupported}</span>
      </div>
    );
  }

  if (size === 'tutor') {
    // Compact amber mic for the chat input bar (parent row must be flex-wrap).
    const tutorLabel = propLabel !== undefined ? propLabel : t.speakBtn;
    return (
      <>
        {errorNotice && (
          <div
            role="status"
            className="basis-full flex items-center justify-between gap-1.5 text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-3 py-1.5 rounded-xl font-medium"
          >
            <div className="flex items-center gap-1.5 truncate">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{errorNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorNotice(null)}
              className="p-0.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded-full shrink-0 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {isListening && (
          <div
            role="status"
            aria-live="polite"
            className="basis-full flex flex-col gap-1.5 bg-[#FEF2F2] border-2 border-[#DC2626] rounded-[12px] p-2.5 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75 animate-ping" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[#DC2626]" />
              </span>
              <span className="flex-1 min-w-0 text-sm font-extrabold text-[#991B1B]">{t.listeningNow}</span>
              <button
                type="button"
                onClick={handleStopListening}
                className="px-3 min-h-[44px] rounded-[10px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-bold shrink-0 active:scale-95"
              >
                {t.stopListening}
              </button>
            </div>
            {interimTranscript && (
              <div className="text-xs text-[#7F1D1D] bg-[#FEE2E2] px-2.5 py-1 rounded-[6px] italic font-medium truncate">
                "{interimTranscript}"
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={handleStartListening}
          disabled={lowDataMode}
          aria-label={tutorLabel}
          className={`min-h-[48px] min-w-[64px] px-3 rounded-[12px] flex flex-col items-center justify-center gap-0.5 text-xs font-bold shrink-0 transition-all active:scale-95 shadow-xs ${
            lowDataMode
              ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              : isListening
              ? 'bg-[#B45309] text-white'
              : 'bg-[#D97706] hover:bg-[#B45309] text-white'
          }`}
        >
          <Mic className="w-5 h-5 stroke-[2.2]" />
          <span>{tutorLabel}</span>
        </button>
      </>
    );
  }

  if (size === 'giant') {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleStartListening}
          disabled={lowDataMode}
          aria-label={defaultLabel || t.voiceListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
            lowDataMode
              ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed border border-[#CBD5E1]'
              : isListening
              ? 'bg-[#DC2626] text-white animate-pulse ring-8 ring-[#FECACA] shadow-red-500/20'
              : 'bg-[#15803D] text-white hover:bg-[#166534] ring-4 ring-[#86EFAC] shadow-emerald-700/20'
          }`}
        >
          {isListening ? <Mic className="w-9 h-9 stroke-[2.5] animate-bounce" /> : <Mic className="w-9 h-9 stroke-[2.5]" />}
        </button>
        <span className="text-xs font-bold text-[#0F172A]">
          {isListening ? t.voiceListening : lowDataMode ? t.voiceDisabledLowData : defaultLabel}
        </span>
        {errorNotice && (
          <div className="flex items-center gap-1.5 text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-3 py-1.5 rounded-xl max-w-xs text-center font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>
    );
  }

  // Medium / inline button (e.g. S5 practice screen)
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleStartListening}
        disabled={lowDataMode}
        aria-label={defaultLabel || t.voiceListening}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all min-h-[44px] active:scale-95 ${
          lowDataMode
            ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed border border-[#CBD5E1]'
            : isListening
            ? 'bg-[#DC2626] text-white animate-pulse ring-4 ring-[#FECACA]'
            : 'bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7] border border-[#15803D]'
        }`}
      >
        <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
        <span>{isListening ? t.voiceListening : defaultLabel}</span>
      </button>
      {errorNotice && (
        <span className="text-[11px] text-[#DC2626] font-medium" role="status">
          {errorNotice}
        </span>
      )}
    </div>
  );
};
