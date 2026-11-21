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
      <div className="text-center py-2 text-sm text-slate-500 flex items-center justify-center gap-1.5">
        <MicOff className="w-4 h-4 text-slate-400" />
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
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : isListening
              ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-200'
              : 'bg-indigo-brand text-white hover:bg-indigo-dark ring-4 ring-indigo-100'
          }`}
        >
          {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <Mic className="w-10 h-10" />}
        </button>
        <span className="text-sm font-semibold text-indigo-brand">
          {isListening ? 'వింటున్నాము... మాట్లాడండి' : lowDataMode ? 'వాయిస్ నిలిపివేయబడింది (డేటా మోడ్)' : label}
        </span>
        {errorNotice && (
          <div className="flex items-center gap-1.5 text-xs text-coral-brand bg-coral-light px-3 py-1.5 rounded-lg max-w-xs text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>
    );
  }

  // Medium / inline button
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleStartListening}
        disabled={lowDataMode}
        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium min-h-[56px] transition-all active:scale-95 ${
          lowDataMode
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-indigo-brand text-white hover:bg-indigo-dark'
        }`}
      >
        <Mic className="w-5 h-5" />
        <span>{isListening ? 'వింటున్నాము...' : label}</span>
      </button>
      {errorNotice && (
        <span className="text-xs text-coral-brand">{errorNotice}</span>
      )}
    </div>
  );
};
