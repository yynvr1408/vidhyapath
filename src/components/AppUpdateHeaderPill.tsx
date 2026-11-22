// Top Header Update Pill / Button
import React from 'react';
import { Download, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';

interface AppUpdateHeaderPillProps {
  className?: string;
}

export const AppUpdateHeaderPill: React.FC<AppUpdateHeaderPillProps> = ({ className = '' }) => {
  const { currentLanguage } = useApp();
  const t = getTranslations(currentLanguage);

  const {
    currentVersion,
    updateInfo,
    hasUpdate,
    isPwaUpdateAvailable,
    isChecking,
    openModal,
  } = useAppUpdate();

  const latestVersion = updateInfo?.latestVersion || currentVersion;

  if (hasUpdate) {
    return (
      <button
        type="button"
        onClick={openModal}
        title={t.updateAvailable}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black rounded-full border transition-all active:scale-95 bg-[#FEF3C7] hover:bg-[#FDE68A] border-[#D97706] text-[#92400E] shadow-xs animate-bounce min-h-[34px] ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B45309]"></span>
        </span>
        <Sparkles className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
        <span className="text-[11px] font-extrabold truncate max-w-[130px]">
          {currentLanguage === 'te'
            ? `అప్‌డేట్ (v${latestVersion})`
            : currentLanguage === 'hi'
            ? `अपडेट (v${latestVersion})`
            : `Update (v${latestVersion})`}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openModal}
      title={`${t.currentVersionLabel}: v${currentVersion} (${t.checkUpdates})`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border transition-all active:scale-95 bg-[#F8FAFC] hover:bg-[#F0FDFA] hover:border-[#0F766E] border-[#E2E8F0] text-[#475569] hover:text-[#0F766E] min-h-[34px] ${className}`}
    >
      <RefreshCw className={`w-3 h-3 text-[#0F766E] ${isChecking ? 'animate-spin' : ''}`} />
      <span className="text-[11px] font-mono font-bold">v{currentVersion}</span>
      <span className="text-[10px] hidden lg:inline text-[#64748B]">
        · {t.checkUpdates}
      </span>
    </button>
  );
};
