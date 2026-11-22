import React, { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { SpeechService, getSpeechLocale, getSpeechLangFromLocale, SPEECH_ERROR_MESSAGES } from '../services/speech';
import type { SpeechState } from '../services/speech';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';

// Identifies the AudioButton that started the current speech, so only that button shows Loading/Stop.
let activeAudioOwner: object | null = null;

interface AudioButtonProps {
  text: string;
  locale?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  locale: propLocale,
  size = 'md',
  label: propLabel,
  className = '',
}) => {
  let appLang = 'te';
  try {
    const app = useApp();
    if (app?.currentLanguage) appLang = app.currentLanguage;
  } catch (e) {
    // outside AppContext fallback
  }

  const effectiveLocale = propLocale || getSpeechLocale(appLang);
  const langKey = getSpeechLangFromLocale(effectiveLocale);
  const t = getTranslations(langKey);

  const [fallbackMsg, setFallbackMsg] = useState<string | null>(null);
  const [speech, setSpeech] = useState<SpeechState>(() => ({
    isLoading: SpeechService.isLoading,
    isSpeaking: SpeechService.isSpeaking,
  }));
  const ownerRef = useRef<object>({});

  useEffect(() => {
    return SpeechService.subscribe(setSpeech);
  }, []);

  const isOwner = activeAudioOwner === ownerRef.current;
  const isLoading = isOwner && speech.isLoading;
  const isPlaying = isOwner && speech.isSpeaking;
  const isBusy = isLoading || isPlaying;

  const defaultLabel = propLabel !== undefined ? propLabel : t.listen;
  const stopLabel = t.audioStop || (langKey === 'hi' ? 'रोकें' : langKey === 'en' ? 'Stop' : 'ఆపు');
  const errorMsg = SPEECH_ERROR_MESSAGES[langKey].ttsUnsupported;

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isBusy) {
      SpeechService.stopSpeaking();
      return;
    }

    activeAudioOwner = ownerRef.current;
    setFallbackMsg(null);
    SpeechService.speak(text, effectiveLocale, undefined, undefined, () => {
      setFallbackMsg(errorMsg);
    });
  };

  const sizeClasses = {
    sm: 'p-2 text-xs min-h-[44px] min-w-[44px]',
    md: 'px-3 py-2 text-sm min-h-[50px]',
    lg: 'px-4 py-2.5 text-base min-h-[56px]',
  };

  const displayLabel = isLoading ? '…' : isPlaying ? stopLabel : defaultLabel;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleTogglePlay}
        aria-label={`${defaultLabel}: ${text.substring(0, 30)}`}
        aria-busy={isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95 ${
          isBusy
            ? 'bg-[#DCFCE7] text-[#15803D] border-2 border-[#15803D] shadow-xs'
            : 'bg-[#FFFFFF] text-[#0F172A] hover:bg-[#F0FDF4] border border-[#D1E7DD] hover:border-[#15803D] shadow-xs'
        } ${sizeClasses[size]} ${className}`}
      >
        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-4 w-4">
            <span className="w-1 bg-[#15803D] audio-bar-1 rounded-full"></span>
            <span className="w-1 bg-[#15803D] audio-bar-2 rounded-full"></span>
            <span className="w-1 bg-[#15803D] audio-bar-3 rounded-full"></span>
          </div>
        ) : (
          <Volume2 className={`w-4 h-4 text-[#15803D] shrink-0 ${isLoading ? 'animate-pulse' : ''}`} />
        )}
        {displayLabel && <span>{displayLabel}</span>}
      </button>
      {fallbackMsg && (
        <span className="text-xs text-[#DC2626] font-medium" role="status">
          {fallbackMsg}
        </span>
      )}
    </div>
  );
};
