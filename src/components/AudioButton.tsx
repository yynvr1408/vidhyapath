import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { SpeechService } from '../services/speech';

interface AudioButtonProps {
  text: string;
  locale?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  locale = 'te-IN',
  size = 'md',
  label = 'వినండి',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fallbackMsg, setFallbackMsg] = useState<string | null>(null);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      SpeechService.stopSpeaking();
      setIsPlaying(false);
      return;
    }

    if (!SpeechService.isTtsSupported()) {
      setFallbackMsg('Audio not supported / అందుబాటులో లేదు');
      return;
    }

    setIsPlaying(true);
    setFallbackMsg(null);
    SpeechService.speak(
      text,
      locale,
      () => setIsPlaying(true),
      () => setIsPlaying(false),
      () => {
        setIsPlaying(false);
        setFallbackMsg('Audio unavailable / అందుబాటులో లేదు');
      }
    );
  };

  const sizeClasses = {
    sm: 'p-2 text-xs min-h-[44px] min-w-[44px]',
    md: 'px-3 py-2 text-sm min-h-[50px]',
    lg: 'px-4 py-2.5 text-base min-h-[56px]',
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleTogglePlay}
        aria-label={`${label}: ${text.substring(0, 30)}`}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95 ${
          isPlaying
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
          <Volume2 className="w-4 h-4 text-[#15803D] shrink-0" />
        )}
        {label && <span>{isPlaying ? 'ఆపు' : label}</span>}
      </button>
      {fallbackMsg && (
        <span className="text-xs text-[#DC2626] font-medium" role="status">
          {fallbackMsg}
        </span>
      )}
    </div>
  );
};
