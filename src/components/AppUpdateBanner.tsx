// Top In-App Update Alert Notification Banner
import React from 'react';
import { Sparkles, ExternalLink, RefreshCw, X } from 'lucide-react';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';

export const AppUpdateBanner: React.FC = () => {
  const { currentLanguage } = useApp();
  const t = getTranslations(currentLanguage);

  const {
    currentVersion,
    updateInfo,
    hasUpdate,
    isPwaUpdateAvailable,
    bannerDismissed,
    dismissBanner,
    openModal,
    applyPwaUpdate,
  } = useAppUpdate();

  if (!hasUpdate || bannerDismissed) return null;

  const latestVersion = updateInfo?.latestVersion || currentVersion;

  return (
    <div className="bg-linear-to-r from-[#D97706] to-[#B45309] text-white px-3 sm:px-4 py-2 text-xs font-bold shadow-md z-40 animate-slideDown flex items-center justify-between gap-2 border-b border-white/20">
      <div className="flex items-center gap-2 min-w-0">
        <span className="p-1 rounded-full bg-white/20 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
        </span>
        <div className="truncate">
          <span className="font-extrabold mr-1">
            {t.updateAvailable}
          </span>
          <span className="text-[11px] font-mono opacity-90 hidden sm:inline">
            (v{currentVersion} → v{latestVersion})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isPwaUpdateAvailable ? (
          <button
            type="button"
            onClick={applyPwaUpdate}
            className="px-2.5 py-1 rounded-md bg-white text-[#92400E] hover:bg-[#FEF3C7] text-[11px] font-extrabold flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
          >
            <RefreshCw className="w-3 h-3 text-[#92400E]" />
            <span>{t.reloadApp}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openModal}
            className="px-2.5 py-1 rounded-md bg-white text-[#92400E] hover:bg-[#FEF3C7] text-[11px] font-extrabold flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
          >
            <ExternalLink className="w-3 h-3 text-[#92400E]" />
            <span>Release notes</span>
          </button>
        )}

        <button
          type="button"
          onClick={dismissBanner}
          className="w-6 h-6 rounded-md hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          title="Dismiss"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
