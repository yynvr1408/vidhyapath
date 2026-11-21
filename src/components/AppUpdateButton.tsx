import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { APP_VERSION } from '../config/version';
import { getApiBaseUrl } from '../config/api';

interface AppUpdateButtonProps {
  minimal?: boolean;
}

export const AppUpdateButton: React.FC<AppUpdateButtonProps> = ({ minimal = false }) => {
  const currentVersion = APP_VERSION;
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

  const checkUpdates = async () => {
    setChecking(true);
    setError(null);
    const apiBase = getApiBaseUrl();

    try {
      // 1. Try server check-update endpoint
      const res = await fetch(`${apiBase}/api/app/check-update?currentVersion=${currentVersion}`, {
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setUpdateInfo(data);
        return;
      }
      throw new Error(`Server status ${res.status}`);
    } catch (err: any) {
      console.warn('Backend update check failed, attempting direct GitHub check...', err);
      // 2. Direct GitHub Releases fallback if backend is offline or on native localhost
      try {
        const ghRes = await fetch('https://api.github.com/repos/yynvr1408/vidhyapath/releases/latest', {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
        });
        if (ghRes.ok) {
          const release = await ghRes.json();
          const latest = (release.tag_name || '').replace(/^v/, '');
          const apk = release.assets?.find((a: any) => typeof a.name === 'string' && a.name.endsWith('.apk'));
          
          const parseVer = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
          const [lMaj = 0, lMin = 0, lPatch = 0] = parseVer(latest);
          const [cMaj = 0, cMin = 0, cPatch = 0] = parseVer(currentVersion);
          const isNewer = lMaj > cMaj || (lMaj === cMaj && lMin > cMin) || (lMaj === cMaj && lMin === cMin && lPatch > cPatch);

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
        console.warn('Direct GitHub check also failed:', ghErr);
      }
      setError('అప్‌డేట్ తనిఖీ విఫలమైంది');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  if (checking) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
        <span>తనిఖీ చేస్తున్నాము...</span>
      </button>
    );
  }

  if (updateInfo?.hasUpdate) {
    if (minimal) {
      return (
        <a
          href={updateInfo.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`కొత్త వెర్షన్ v${updateInfo.latestVersion} సిద్ధంగా ఉంది`}
          className="relative p-2 rounded-xl bg-amber-500 text-indigo-950 hover:bg-amber-400 font-bold text-xs flex items-center justify-center min-h-[44px] min-w-[44px] shadow-md animate-bounce"
        >
          <Download className="w-5 h-5 text-indigo-950" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </a>
      );
    }

    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl p-4 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
            <div>
              <div className="text-sm font-bold text-amber-950">
                కొత్త అప్‌డేట్ సిద్ధంగా ఉంది! (v{updateInfo.latestVersion})
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                ప్రస్తుత వెర్షన్: v{currentVersion} {updateInfo.apkSizeMb ? `• సైజు: ~${updateInfo.apkSizeMb}` : ''}
              </div>
            </div>
          </div>
          <a
            href={updateInfo.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-indigo-950 font-black text-xs shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>ఇప్పుడే అప్‌డేట్ చేసుకోండి</span>
          </a>
        </div>
        {updateInfo.releaseNotes && (
          <div className="mt-2 text-[11px] text-amber-900/80 bg-white/70 p-2 rounded-lg border border-amber-200 line-clamp-2">
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
        title="అప్‌డేట్‌లు తనిఖీ చేయండి"
        className="p-2 rounded-xl bg-indigo-900/40 text-cream-100 hover:bg-indigo-900/70 border border-indigo-400/20 active:scale-95 transition-all flex items-center justify-center min-h-[44px] min-w-[44px]"
      >
        <RefreshCw className="w-4 h-4 text-emerald-400" />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <div>
          <div className="text-xs font-bold text-slate-800">యాప్ వెర్షన్ v{currentVersion}</div>
          <div className="text-[11px] text-slate-500">
            {error ? error : 'తాజా వెర్షన్ ఇన్‌స్టాల్ అయింది'}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={checkUpdates}
        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-950 font-bold text-xs flex items-center gap-1.5 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>మళ్ళీ తనిఖీ చేయి</span>
      </button>
    </div>
  );
};
