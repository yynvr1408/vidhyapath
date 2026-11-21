import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
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

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      SpeechService.stopSpeaking();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    SpeechService.speak(
      text,
      locale,
      () => setIsPlaying(true),
      () => setIsPlaying(false),
      () => setIsPlaying(false)
    );
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs min-h-[44px] min-w-[44px]',
    md: 'px-3 py-2 text-sm min-h-[50px]',
    lg: 'px-4 py-2.5 text-base min-h-[56px]',
  };

  return (
    <button
      type="button"
      onClick={handleTogglePlay}
      aria-label={`${label}: ${text.substring(0, 30)}`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 ${
        isPlaying
          ? 'bg-amber-100 text-amber-900 border-2 border-lantern shadow-sm'
          : 'bg-white/90 text-indigo-dark hover:bg-amber-50 border border-slate-200 shadow-xs'
      } ${sizeClasses[size]} ${className}`}
    >
      {isPlaying ? (
        <div className="flex items-end gap-0.5 h-4 w-4">
          <span className="w-1 bg-lantern audio-bar-1 rounded-full"></span>
          <span className="w-1 bg-lantern audio-bar-2 rounded-full"></span>
          <span className="w-1 bg-lantern audio-bar-3 rounded-full"></span>
        </div>
      ) : (
        <Volume2 className="w-5 h-5 text-lantern" />
      )}
      {label && <span className="font-semibold">{label}</span>}
    </button>
  );
};
