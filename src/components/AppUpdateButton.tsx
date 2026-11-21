import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { APP_VERSION } from '../config/version';
import { useApp } from '../context/AppContext';

interface AppUpdateButtonProps {
  minimal?: boolean;
}

export const AppUpdateButton: React.FC<AppUpdateButtonProps> = ({ minimal = false }) => {
  const currentVersion = APP_VERSION;
  const { currentLanguage } = useApp();

  const [updateInfo, setUpdateInfo] = useState<{
    hasUpdate: boolean;
    latestVersion?: string;
    downloadUrl?: string;
    releaseNotes?: string;
    apkSizeMb?: string;
    publishedAt?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTelugu = currentLanguage === 'te';
  const isHindi = currentLanguage === 'hi';

  const labels = {
    checking: isTelugu ? 'తనిఖీ చేస్తున్నాము...' : isHindi ? 'जाँच हो रही है...' : 'Checking for updates...',
    hasUpdateTitle: isTelugu
      ? `కొత్త అప్‌డేట్ సిద్ధంగా ఉంది!`
      : isHindi
      ? `नया अपडेट उपलब्ध है!`
      : `New Update Available!`,
    currentVer: isTelugu
      ? `ప్రస్తుత వెర్షన్: v${currentVersion}`
      : isHindi
      ? `वर्तमान वर्शन: v${currentVersion}`
      : `Current version: v${currentVersion}`,
    downloadBtn: isTelugu ? 'ఇప్పుడే అప్‌డేట్ చేసుకోండి' : isHindi ? 'अभी अपडेट करें' : 'Update Now (APK)',
    upToDate: isTelugu ? 'తాజా వెర్షన్ ఇన్‌స్టాల్ అయింది' : isHindi ? 'नवीनतम वर्शन स्थापित है' : 'App is up to date',
    recheckBtn: isTelugu ? 'మళ్ళీ తనిఖీ చేయి' : isHindi ? 'पुनः जाँचें' : 'Check Updates',
    appVersion: isTelugu ? `యాప్ వెర్షన్ v${currentVersion}` : isHindi ? `ऐप वर्शन v${currentVersion}` : `App Version v${currentVersion}`,
    checkFailed: isTelugu ? 'అప్‌డేట్ తనిఖీ విఫలమైంది' : isHindi ? 'जाँच विफल रही' : 'Update check failed',
  };

  const checkUpdates = async () => {
    setChecking(true);
    setError(null);

    try {
      // 1. Try server check-update endpoint
      const res = await fetch(`/api/app/check-update?currentVersion=${encodeURIComponent(currentVersion)}`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setUpdateInfo(data);
        return;
      }
      throw new Error(`Server status ${res.status}`);
    } catch (err: any) {
      // 2. Direct GitHub Releases fallback if running standalone or backend unreachable
      try {
        const ghRes = await fetch('https://api.github.com/repos/yynvr1408/vidhyapath/releases/latest', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });
        if (ghRes.ok) {
          const release = await ghRes.json();
          const latest = (release.tag_name || '').replace(/^v/, '');
          const apk = release.assets?.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.apk'));

          const parseVer = (v: string) => v.replace(/^[^0-9]*/, '').split('.').map((n) => parseInt(n, 10) || 0);
          const [lMaj = 0, lMin = 0, lPatch = 0] = parseVer(latest);
          const [cMaj = 0, cMin = 0, cPatch = 0] = parseVer(currentVersion);
          const isNewer =
            lMaj > cMaj ||
            (lMaj === cMaj && lMin > cMin) ||
            (lMaj === cMaj && lMin === cMin && lPatch > cPatch);

          setUpdateInfo({
            hasUpdate: isNewer,
            latestVersion: latest,
            downloadUrl: apk ? apk.browser_download_url : release.html_url,
            releaseNotes: release.body || '',
            apkSizeMb: apk?.size ? (apk.size / (1024 * 1024)).toFixed(1) + ' MB' : undefined,
            publishedAt: release.published_at,
          });
          return;
        }
      } catch (ghErr: any) {
        console.warn('Direct GitHub check fallback failed:', ghErr);
      }
      setError(labels.checkFailed);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  if (checking) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#475569]">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F766E]" />
        <span>{labels.checking}</span>
      </div>
    );
  }

  if (updateInfo?.hasUpdate) {
    if (minimal) {
      return (
        <a
          href={updateInfo.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`${labels.hasUpdateTitle} (v${updateInfo.latestVersion})`}
          className="relative p-2 rounded-[10px] bg-[#D97706] text-white hover:bg-[#B45309] font-bold text-xs flex items-center justify-center min-h-[44px] min-w-[44px] shadow-sm animate-bounce"
        >
          <Download className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </a>
      );
    }

    return (
      <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-[12px] p-3 shadow-xs space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="text-xs font-extrabold text-[#78350F]">
                {labels.hasUpdateTitle} (v{updateInfo.latestVersion})
              </div>
              <div className="text-[11px] text-[#92400E] mt-0.5">
                {labels.currentVer} {updateInfo.apkSizeMb ? `• ~${updateInfo.apkSizeMb}` : ''}
              </div>
            </div>
          </div>
        </div>
        <a
          href={updateInfo.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{labels.downloadBtn}</span>
        </a>
        {updateInfo.releaseNotes && (
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
        onClick={checkUpdates}
        title={labels.recheckBtn}
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
          <div className="text-xs font-bold text-[#0F172A] truncate">{labels.appVersion}</div>
          <div className="text-[11px] text-[#64748B] truncate">
            {error ? error : labels.upToDate}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={checkUpdates}
        className="px-2.5 py-1 rounded-[8px] bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] font-bold text-[11px] flex items-center gap-1 transition-all shrink-0 active:scale-95"
      >
        <RefreshCw className="w-3 h-3 text-[#0F766E]" />
        <span>{labels.recheckBtn}</span>
      </button>
    </div>
  );
};
