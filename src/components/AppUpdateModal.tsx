// Comprehensive In-App Update Modal
import React from 'react';
import {
  Download,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  X,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';
import { VidyapathLogo } from './VidyapathLogo';
import { navigationManager } from '../services/navigationManager';

export const AppUpdateModal: React.FC = () => {
  const { currentLanguage } = useApp();
  const t = getTranslations(currentLanguage);

  const {
    currentVersion,
    updateInfo,
    isChecking,
    isPwaUpdateAvailable,
    hasUpdate,
    error,
    isModalOpen,
    closeModal,
    checkForUpdates,
    applyPwaUpdate,
  } = useAppUpdate();

  React.useEffect(() => {
    if (!isModalOpen) return;
    return navigationManager.registerBackHandler(() => {
      closeModal();
      return true;
    }, 110);
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  const latestVersion = updateInfo?.latestVersion || currentVersion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#0F766E] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <VidyapathLogo size="sm" showWordmark={false} />
            <div>
              <h2 className="font-extrabold text-sm leading-tight">
                {currentLanguage === 'te'
                  ? 'యాప్ అప్‌డేట్ & వెర్షన్'
                  : currentLanguage === 'hi'
                  ? 'ऐप अपडेट और वर्शन'
                  : 'App Version & Updates'}
              </h2>
              <p className="text-[11px] text-[#CCFBF1] font-medium leading-none mt-0.5">
                {t.appTitle} · v{currentVersion}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Box */}
          {hasUpdate ? (
            <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-xl p-4 space-y-2 animate-pulse">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm text-[#92400E]">
                    {t.updateAvailable} (v{latestVersion})
                  </h3>
                  <p className="text-xs text-[#B45309] mt-0.5 font-medium">
                    {currentLanguage === 'te'
                      ? 'తాజా ఫీచర్లు, మరింత వేగవంతమైన పనితీరు మరియు భద్రతా మెరుగుదలలు సిద్ధంగా ఉన్నాయి.'
                      : currentLanguage === 'hi'
                      ? 'नवीनतम सुविधाएं, तेज प्रदर्शन और सुरक्षा सुधार उपलब्ध हैं।'
                      : 'Latest features, faster performance, and security enhancements are ready to install.'}
                  </p>
                </div>
              </div>

              {updateInfo?.apkSizeMb && (
                <div className="text-[11px] font-bold text-[#78350F] bg-white/70 px-2.5 py-1 rounded-md inline-block">
                  APK Size: ~{updateInfo.apkSizeMb}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#14532D]">
                  {t.appUpToDate}
                </h3>
                <p className="text-xs text-[#15803D] mt-0.5 font-medium">
                  {t.currentVersionLabel}: <span className="font-mono font-bold">v{currentVersion}</span>
                </p>
              </div>
            </div>
          )}

          {/* Version Specs Card */}
          <div className="grid grid-cols-2 gap-2.5 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
            <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] text-center">
              <div className="text-[10px] font-extrabold uppercase text-[#64748B]">
                {t.currentVersionLabel}
              </div>
              <div className="text-sm font-black font-mono text-[#0F172A] mt-0.5">
                v{currentVersion}
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] text-center">
              <div className="text-[10px] font-extrabold uppercase text-[#64748B]">
                {t.latestVersionLabel}
              </div>
              <div className={`text-sm font-black font-mono mt-0.5 ${hasUpdate ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
                v{latestVersion}
              </div>
            </div>
          </div>

          {/* Release Notes / Changelog */}
          {updateInfo?.releaseNotes && (
            <div className="space-y-1.5">
              <div className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>{t.changelog}:</span>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl text-xs text-[#475569] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap font-medium">
                {updateInfo.releaseNotes}
              </div>
            </div>
          )}

          {/* Error notice if check failed */}
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-xs text-[#DC2626] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t.updateCheckFailed}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* PWA Web Reload Button if service worker updated */}
            {isPwaUpdateAvailable && (
              <button
                type="button"
                onClick={applyPwaUpdate}
                className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.reloadApp}</span>
              </button>
            )}

            {/* Android APK Download Button */}
            {updateInfo?.hasUpdate && updateInfo.downloadUrl && (
              <a
                href={updateInfo.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[44px]"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{t.updateNow} (APK)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}

            {/* Manual Check for Updates Button */}
            <button
              type="button"
              onClick={() => checkForUpdates()}
              disabled={isChecking}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[42px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0F766E] ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? t.checkingUpdates : t.checkUpdates}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>
              {currentLanguage === 'te'
                ? 'ధృవీకరించబడిన సురక్షిత విడుదల · GitHub Releases'
                : currentLanguage === 'hi'
                ? 'सत्यापित सुरक्षित रिलीज़ · GitHub Releases'
                : 'Verified Secure Release · GitHub Releases'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
