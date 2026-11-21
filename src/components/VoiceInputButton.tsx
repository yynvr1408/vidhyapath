import React, { useState } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { SpeechService } from '../services/speech';
import { useApp } from '../context/AppContext';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  locale?: string;
  size?: 'md' | 'giant';
  label?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  locale = 'te-IN',
  size = 'giant',
  label = 'జవాబు చెప్పండి',
}) => {
  const { lowDataMode } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const isSupported = SpeechService.isSttSupported();

  const handleStartListening = () => {
    if (lowDataMode) {
      setErrorNotice('తక్కువ డేటా మోడ్‌లో వాయిస్ నిలిపివేయబడింది. ట్యాప్ ద్వారా సమాధానం ఇవ్వండి.');
      return;
    }

    if (!navigator.onLine) {
      setErrorNotice('వాయిస్ రికగ్నిషన్‌కు ఇంటర్నెట్ అవసరం. బటన్ల ద్వారా ఎంచుకోండి.');
      return;
    }

    if (!isSupported) {
      setErrorNotice('ఈ బ్రౌజర్‌లో వాయిస్ ఇన్పుట్ అందుబాటులో లేదు.');
      return;
    }

    setErrorNotice(null);
    setIsListening(true);

    SpeechService.startListening(
      locale,
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

  if (!isSupported) {
    return (
      <div className="text-center py-2 text-xs text-[#475569] flex items-center justify-center gap-1.5 bg-[#FFFFFF] p-2.5 rounded-xl border border-[#D1E7DD]">
        <MicOff className="w-4 h-4 text-[#94A3B8]" />
        <span>వాయిస్ అందుబాటులో లేదు (ట్యాప్ ద్వారా ఎంచుకోండి)</span>
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
          aria-label={label}
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
          {isListening ? 'వింటున్నాము... మాట్లాడండి' : lowDataMode ? 'వాయిస్ నిలిపివేయబడింది (డేటా మోడ్)' : label}
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
    <div className="w-full flex flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={handleStartListening}
        disabled={lowDataMode}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm min-h-[56px] transition-all active:scale-95 border-2 ${
          lowDataMode
            ? 'bg-[#F1F5F9] text-[#94A3B8] border-[#D1E7DD] cursor-not-allowed'
            : isListening
            ? 'bg-[#DC2626] text-white border-[#DC2626] animate-pulse'
            : 'bg-[#FFFFFF] text-[#15803D] border-[#15803D] hover:bg-[#F0FDF4]'
        }`}
      >
        <Mic className="w-5 h-5 shrink-0" />
        <span>{isListening ? 'వింటున్నాము...' : label}</span>
      </button>
      {errorNotice && (
        <span className="text-[11px] text-[#DC2626] font-medium text-center">{errorNotice}</span>
      )}
    </div>
  );
};
