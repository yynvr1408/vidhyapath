import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#FFFFFF] rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center border border-[#D1E7DD]">
        <div className="flex justify-between items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-[#DCFCE7] border border-[#D1E7DD] flex items-center justify-center text-[#15803D]">
            <Lock className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full text-[#475569] hover:text-[#0F172A] min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-[#0F172A] mb-1">{title}</h3>
        <p className="text-xs text-[#475569] mb-6">మీ ప్రొఫైల్ సురక్షితంగా తెరవడానికి పిన్ ఇవ్వండి</p>

        {/* 4 PIN Dots */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all ${
                idx < pin.length
                  ? error
                    ? 'bg-[#DC2626] scale-125'
                    : 'bg-[#15803D] scale-125'
                  : 'bg-[#E2E8F0]'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-[#DC2626] font-medium mb-4 animate-shake">
            తప్పు పిన్. మళ్ళీ ప్రయత్నించండి.
          </p>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] border border-[#D1E7DD] hover:border-[#15803D] font-bold text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-14 rounded-2xl bg-[#F4F9F6] text-[#475569] hover:text-[#0F172A] border border-[#D1E7DD] text-xs font-semibold flex items-center justify-center active:scale-95"
          >
            క్లియర్
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] border border-[#D1E7DD] hover:border-[#15803D] font-bold text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-[#F4F9F6] text-[#475569] hover:text-[#0F172A] border border-[#D1E7DD] text-xs font-semibold flex items-center justify-center active:scale-95"
          >
            తొలగించు
          </button>
        </div>
      </div>
    </div>
  );
};
