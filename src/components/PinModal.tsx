import React, { useState } from 'react';
import { Lock, X, Check } from 'lucide-react';

interface PinModalProps {
  expectedPin?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  expectedPin,
  onSuccess,
  onCancel,
  title = '4 అంకెల పిన్ నమోదు చేయండి',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (!expectedPin || nextPin === expectedPin) {
          setTimeout(onSuccess, 100);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center border-2 border-indigo-brand">
        <div className="flex justify-between items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-brand">
            <Lock className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-indigo-brand mb-2">{title}</h3>
        <p className="text-xs text-slate-500 mb-6">మీ ప్రొఫైల్ సురక్షితంగా తెరవడానికి పిన్ ఇవ్వండి</p>

        {/* 4 PIN Dots */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all ${
                idx < pin.length
                  ? error
                    ? 'bg-red-500 scale-125'
                    : 'bg-indigo-brand scale-125'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-coral-brand font-medium mb-4 animate-shake">
            తప్పు పిన్. మళ్ళీ ప్రయత్నించండి.
          </p>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-cream-100 hover:bg-cream-200 text-indigo-brand font-bold text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-14 rounded-2xl bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center active:scale-95"
          >
            క్లియర్
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-cream-100 hover:bg-cream-200 text-indigo-brand font-bold text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center active:scale-95"
          >
            తొలగించు
          </button>
        </div>
      </div>
    </div>
  );
};
