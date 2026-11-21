import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AppUpdateButtonProps {
  minimal?: boolean;
}

export const AppUpdateButton: React.FC<AppUpdateButtonProps> = ({ minimal = false }) => {
  const currentVersion = '1.0.0';
  const [updateInfo, setUpdateInfo] = useState<{
    hasUpdate: boolean;
    latestVersion?: string;
    downloadUrl?: string;
    releaseNotes?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  const checkUpdates = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/app/check-update?currentVersion=${currentVersion}`);
      if (res.ok) {
        const data = await res.json();
        setUpdateInfo(data);
      }
    } catch (err) {
      console.warn('Update check failed:', err);
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
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-lantern" />
        <span>తనిఖీ చేస్తున్నాము...</span>
      </button>
    );
  }

  if (updateInfo?.hasUpdate) {
    return (
      <a
        href={updateInfo.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-indigo-950 text-xs font-bold shadow-sm animate-pulse border border-amber-300"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>కొత్త అప్‌డేట్ అందుబాటులో ఉంది (v{updateInfo.latestVersion}) — డౌన్‌లోడ్ చేయండి</span>
      </a>
    );
  }

  if (minimal) {
    return (
      <button
        type="button"
        onClick={checkUpdates}
        title="అప్‌డేట్‌లు తనిఖీ చేయండి"
        className="p-2 rounded-xl bg-indigo-light/60 text-cream-100 hover:bg-indigo-light border border-indigo-400/20 active:scale-95 transition-all flex items-center justify-center min-h-[44px] min-w-[44px]"
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
          <div className="text-[11px] text-slate-500">తాజా వెర్షన్ ఇన్‌స్టాల్ అయింది</div>
        </div>
      </div>
      <button
        type="button"
        onClick={checkUpdates}
        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-brand font-bold text-xs flex items-center gap-1.5 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>మళ్ళీ తనిఖీ చేయి</span>
      </button>
    </div>
  );
};
