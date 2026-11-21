import React from 'react';
import { WifiOff, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, syncTick, lowDataMode } = useApp();

  return (
    <div className="w-full">
      {/* Offline Status Alert */}
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-sm shadow-inner transition-all animate-fadeIn">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span className="font-semibold">ఇంటర్నెట్ లేదు (ఆఫ్‌లైన్ మోడ్)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-amber-700/60 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
            <span>ప్రోగ్రెస్ సురక్షితం</span>
          </div>
        </div>
      )}

      {/* Sync Success Tick Toast */}
      {syncTick && (
        <div className="bg-success-brand text-white px-4 py-2 flex items-center justify-center gap-2 text-sm shadow-md transition-all animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-semibold">మీ ప్రోగ్రెస్ సర్వర్‌తో సేవ్ అయింది!</span>
        </div>
      )}

      {/* Low-data mode indicator badge */}
      {lowDataMode && !isOffline && (
        <div className="bg-indigo-900 text-indigo-100 px-4 py-1 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-lantern" />
            <span>తక్కువ డేటా మోడ్ ఆన్‌లో ఉంది (వాయిస్ & చిత్రాలు ఆదా చేయబడ్డాయి)</span>
          </div>
        </div>
      )}
    </div>
  );
};
