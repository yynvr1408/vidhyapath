import React from 'react';

interface PhoneExitToastProps {
  message: string | null;
}

export const PhoneExitToast: React.FC<PhoneExitToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A]/90 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-xl backdrop-blur-xs border border-white/10 pointer-events-none animate-fadeIn transition-all"
    >
      <span>{message}</span>
    </div>
  );
};
