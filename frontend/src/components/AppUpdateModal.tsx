// Comprehensive In-App Update & Release Notes System
import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Sparkles,
  X,
  Globe,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Tag,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useApp } from '../context/AppContext';
import { getTranslations } from '../utils/translations';
import { VidyapathLogo } from './VidyapathLogo';
import { navigationManager } from '../services/navigationManager';
import { PRODUCT_UPDATES, ProductUpdateItem, UpdateCategory } from '../config/productUpdates';

const CATEGORY_STYLES: Record<UpdateCategory, { bg: string; text: string; border: string }> = {
  'New Features': { bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', border: 'border-[#BFDBFE]' },
  'Improvements': { bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', border: 'border-[#BBF7D0]' },
  'UI/UX Enhancements': { bg: 'bg-[#FAF5FF]', text: 'text-[#7E22CE]', border: 'border-[#E9D5FF]' },
  'AI Tutor Updates': { bg: 'bg-[#F0FDFA]', text: 'text-[#0F766E]', border: 'border-[#99F6E4]' },
  'Authentication and Security': { bg: 'bg-[#FFFBEB]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
  'Bug Fixes': { bg: 'bg-[#FEF2F2]', text: 'text-[#B91C1C]', border: 'border-[#FECACA]' },
};

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

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Phone back-button and keyboard Escape integration
  useEffect(() => {
    if (!isModalOpen) return;

    const unreg = navigationManager.registerBackHandler(() => {
      closeModal();
      return true;
    }, 110);

    return () => {
      unreg();
    };
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  const latestVersion = updateInfo?.latestVersion || currentVersion;

  // Filter product updates
  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Updates' },
    { id: 'New Features', label: 'New Features' },
    { id: 'AI Tutor Updates', label: 'AI Tutor' },
    { id: 'UI/UX Enhancements', label: 'UI/UX' },
    { id: 'Authentication and Security', label: 'Security' },
    { id: 'Bug Fixes', label: 'Bug Fixes' },
  ];

  const filteredUpdates = PRODUCT_UPDATES.filter((upd) => {
    if (selectedCategory === 'all') return true;
    return upd.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl border border-[#CBD5E1] flex flex-col animate-scaleUp">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-[#F8FAFC] to-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <VidyapathLogo size="sm" showWordmark={false} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-[#0F172A] leading-tight">
                  {currentLanguage === 'te' ? 'యాప్ అప్‌డేట్' : currentLanguage === 'hi' ? 'ऐप अपडेट' : 'App Update'}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                  v{currentVersion}
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                {currentLanguage === 'te'
                  ? 'తాజా ఫీచర్లు మరియు విడుదల సమాచారం'
                  : currentLanguage === 'hi'
                  ? 'नवीनतम सुविधाएं एवं रिलीज़ नोट्स'
                  : 'Official Product Updates & Release Notes'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="w-9 h-9 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 divide-y divide-[#F1F5F9]">
          {/* Update Status Banner */}
          <div>
            {hasUpdate ? (
              <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-xl p-3.5 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h3 className="font-extrabold text-sm text-[#92400E]">
                        {t.updateAvailable} (v{latestVersion})
                      </h3>
                    </div>
                    <p className="text-xs text-[#B45309] mt-0.5 font-medium leading-relaxed">
                      {currentLanguage === 'te'
                        ? 'కొత్త వెబ్ విడుదల అందుబాటులో ఉంది. వివరాల కోసం విడుదల గమనికలను చూడండి.'
                        : currentLanguage === 'hi'
                        ? 'नई वेब रिलीज़ उपलब्ध है। जानकारी के लिए रिलीज़ नोट देखें।'
                        : 'A newer website release is available. View its release notes for details.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#14532D]">
                    {t.appUpToDate}
                  </h3>
                  <p className="text-xs text-[#15803D] mt-0.5 font-medium">
                    {t.currentVersionLabel}: <span className="font-mono font-bold">v{currentVersion}</span> • Production Build
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Row (Update Buttons & Refresh) */}
          <div className="pt-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {isPwaUpdateAvailable && (
                <button
                  type="button"
                  onClick={applyPwaUpdate}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[42px] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.reloadApp}</span>
                </button>
              )}

              {updateInfo?.hasUpdate && updateInfo.releaseUrl && (
                <a
                  href={updateInfo.releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[42px]"
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>View release notes</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              )}

              <button
                type="button"
                onClick={() => checkForUpdates()}
                disabled={isChecking}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[42px] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#0F766E] ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? t.checkingUpdates : t.checkUpdates}</span>
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-xs text-[#DC2626] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t.updateCheckFailed}</span>
              </div>
            )}
          </div>

          {/* Product Updates & Release Notes Section (Image 1 fix) */}
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#0F766E]" />
                <span>{t.changelog} (What's New)</span>
              </div>
              <span className="text-[11px] text-[#64748B] font-medium">
                {filteredUpdates.length} updates
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Release Update Cards List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredUpdates.map((item) => {
                const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES['New Features'];
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.isUpcoming
                        ? 'bg-[#FAF5FF] border-[#E9D5FF] border-dashed'
                        : 'bg-[#FFFFFF] border-[#E2E8F0] shadow-2xs hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#64748B]">
                          {item.version}
                        </span>
                        {item.isUpcoming && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#7E22CE] text-white">
                            UPCOMING
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-[#64748B] font-medium">
                        <Calendar className="w-3 h-3 text-[#94A3B8]" />
                        <span>{item.releaseDate}</span>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-sm text-[#0F172A] leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-[#475569] font-medium mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    {item.highlights && item.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {item.highlights.map((h, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-[#334155] font-medium flex items-start gap-1.5"
                          >
                            <span className="text-[#0F766E] font-bold">✓</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Security Notice */}
        <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>
              {currentLanguage === 'te'
                ? 'ధృవీకరించబడిన సురక్షిత విడుదల · GitHub Releases'
                : currentLanguage === 'hi'
                ? 'सत्यापित सुरक्षित रिलीज़ · GitHub Releases'
                : 'Verified Release · GitHub Enterprise & PWA Engine'}
            </span>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="px-3 py-1 rounded-lg bg-white hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#0F172A] font-bold text-xs cursor-pointer"
          >
            {currentLanguage === 'te' ? 'పూర్తయింది' : currentLanguage === 'hi' ? 'पूर्ण' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
