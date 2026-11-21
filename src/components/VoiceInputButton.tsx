import React, { useState } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { SpeechService, getSpeechLocale, getSpeechLangFromLocale, SPEECH_ERROR_MESSAGES } from '../services/speech';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  locale?: string;
  size?: 'md' | 'giant';
  label?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  locale: propLocale,
  size = 'giant',
  label: propLabel,
}) => {
  const { lowDataMode, currentLanguage } = useApp();
  const effectiveLocale = propLocale || getSpeechLocale(currentLanguage);
  const langKey = getSpeechLangFromLocale(effectiveLocale);
  const t = getTranslations(langKey);
  const msgs = SPEECH_ERROR_MESSAGES[langKey];

  const [isListening, setIsListening] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

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
    setIsListening(true);

    SpeechService.startListening(
      effectiveLocale,
      (text) => {
        setIsListening(false);
        onTranscript(text);
      },
      (err) => {
        setIsListening(false);
        setErrorNotice(err);
      },
      () => {
        setIsListening(false);
      }
    );
  };

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
      <div className="text-center py-2 text-xs text-[#475569] flex items-center justify-center gap-1.5 bg-[#FFFFFF] p-2.5 rounded-xl border border-[#D1E7DD]">
        <MicOff className="w-4 h-4 text-[#94A3B8]" />
        <span>{t.voiceNotSupported}</span>
      </div>
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
