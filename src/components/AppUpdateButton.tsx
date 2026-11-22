// In-App Update Button & Version Checker Component
import React from 'react';
import { Download, RefreshCw, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';

interface AppUpdateButtonProps {
  minimal?: boolean;
}

export const AppUpdateButton: React.FC<AppUpdateButtonProps> = ({ minimal = false }) => {
  const { currentLanguage } = useApp();
  const t = getTranslations(currentLanguage);

  const {
    currentVersion,
    updateInfo,
    isChecking,
    hasUpdate,
    error,
    openModal,
    checkForUpdates,
  } = useAppUpdate();

  const latestVersion = updateInfo?.latestVersion || currentVersion;

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#475569]">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F766E]" />
        <span>{t.checkingUpdates}</span>
      </div>
    );
  }

  if (hasUpdate) {
    if (minimal) {
      return (
        <button
          type="button"
          onClick={openModal}
          title={`${t.updateAvailable} (v${latestVersion})`}
          className="relative p-2 rounded-[10px] bg-[#D97706] text-white hover:bg-[#B45309] font-bold text-xs flex items-center justify-center min-h-[44px] min-w-[44px] shadow-sm animate-bounce"
        >
          <Download className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      );
    }

    return (
      <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-[12px] p-3 shadow-xs space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="text-xs font-extrabold text-[#78350F]">
                {t.updateAvailable} (v{latestVersion})
              </div>
              <div className="text-[11px] text-[#92400E] mt-0.5">
                {t.currentVersionLabel}: v{currentVersion}{' '}
                {updateInfo?.apkSizeMb ? `• ~${updateInfo.apkSizeMb}` : ''}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.updateNow}</span>
        </button>
        {updateInfo?.releaseNotes && (
          <div className="text-[10px] text-[#78350F] bg-white/80 p-2 rounded-md border border-[#FDE68A] line-clamp-2">
            {updateInfo.releaseNotes}
          </div>
        )}
      </div>
    );
  }

  if (minimal) {
    return (
      <button
        type="button"
        onClick={() => checkForUpdates()}
        title={t.checkUpdates}
        className="p-2 rounded-[10px] bg-[#F8FAFC] text-[#475569] hover:bg-[#F0FDFA] border border-[#E2E8F0] active:scale-95 transition-all flex items-center justify-center min-h-[44px] min-w-[44px]"
      >
        <RefreshCw className="w-4 h-4 text-[#0F766E]" />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between bg-[#F8FAFC] p-2.5 rounded-[12px] border border-[#E2E8F0]">
      <div className="flex items-center gap-2 min-w-0">
        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#0F172A] truncate">
            {t.appTitle} v{currentVersion}
          </div>
          <div className="text-[11px] text-[#64748B] truncate">
            {error ? t.updateCheckFailed : t.appUpToDate}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => checkForUpdates()}
        className="px-2.5 py-1 rounded-[8px] bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] font-bold text-[11px] flex items-center gap-1 transition-all shrink-0 active:scale-95"
      >
        <RefreshCw className="w-3 h-3 text-[#0F766E]" />
        <span>{t.checkUpdates}</span>
      </button>
    </div>
  );
};
