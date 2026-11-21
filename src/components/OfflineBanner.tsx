import React from 'react';
import { WifiOff, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, syncTick, lowDataMode } = useApp();

  return (
    <div className="w-full">
      {/* Offline Status Alert */}
      {isOffline && (
        <div className="bg-[#FEF3C7] border-b border-[#F59E0B] text-[#92400E] px-4 py-2 flex items-center justify-between text-xs shadow-xs transition-all animate-fadeIn">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse text-[#D97706]" />
            <span className="font-bold">ఇంటర్నెట్ లేదు (ఆఫ్‌లైన్ మోడ్ · జీరో డేటా)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] bg-[#FDE68A] px-2 py-0.5 rounded-md border border-[#F59E0B]/40 text-[#92400E] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
            <span>ప్రోగ్రెస్ సురక్షితం</span>
          </div>
        </div>
      )}

      {/* Sync Success Tick Toast */}
      {syncTick && (
        <div className="bg-[#DCFCE7] border-b border-[#86EFAC] text-[#15803D] px-4 py-2 flex items-center justify-center gap-2 text-xs shadow-xs transition-all animate-bounce font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>మీ ప్రోగ్రెస్ సర్వర్‌తో సేవ్ అయింది!</span>
        </div>
      )}

      {/* Low-data mode indicator badge */}
      {lowDataMode && !isOffline && (
        <div className="bg-[#F4F9F6] border-b border-[#D1E7DD] text-[#475569] px-4 py-1.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#15803D]" />
            <span>తక్కువ డేటా మోడ్ ఆన్‌లో ఉంది (వాయిస్ & చిత్రాలు ఆదా చేయబడ్డాయి)</span>
          </div>
        </div>
      )}
    </div>
  );
};
