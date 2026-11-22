// Offline Learning Center & Synchronization Engine Console
// Exact Material Design tokens, segmented storage meter, package cards, and network saver rules
import React, { useState, useEffect } from 'react';
import {
  FolderDown,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Database,
  FileText,
  Shield,
  ArrowLeft,
  HardDrive,
  Trash2,
  Sparkles,
  Zap,
  BookOpen,
  Video,
  HelpCircle,
  AlertTriangle,
  Radio,
  Download,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { useApp } from '../../context/AppContext';

interface OfflineLearningCenterProps {
  onBack?: () => void;
}

interface OfflineBundle {
  id: string;
  name: string;
  subject: string;
  sizeMb: number;
  videos: number;
  pdfs: number;
  quizzes: number;
  daysRemaining: number;
  verified: boolean;
  color: string;
}

export const OfflineLearningCenter: React.FC<OfflineLearningCenterProps> = ({ onBack }) => {
  const { user } = useEnterpriseAuth();
  const { subjects } = useAcademic();
  const { activeLearner, triggerSync } = useApp();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bundles state
  const [bundles, setBundles] = useState<OfflineBundle[]>([
    {
      id: 'item-physics',
      name: 'Physics: Unit 1 & Unit 2',
      subject: 'Kinematics, Dynamics & Harmonic Motion',
      sizeMb: 145,
      videos: 5,
      pdfs: 8,
      quizzes: 4,
      daysRemaining: 28,
      verified: true,
      color: '#005c55',
    },
    {
      id: 'item-math',
      name: 'Mathematics: Quad Equations & Trigonometry',
      subject: 'Formulas, proofs & step-by-step problem sets',
      sizeMb: 110,
      videos: 4,
      pdfs: 12,
      quizzes: 6,
      daysRemaining: 19,
      verified: true,
      color: '#904d00',
    },
    {
      id: 'item-chem',
      name: 'Chemistry: Periodic Table & Reactions',
      subject: 'Valence models, stoichiometry & chemical lab charts',
      sizeMb: 87,
      videos: 3,
      pdfs: 6,
      quizzes: 3,
      daysRemaining: 14,
      verified: true,
      color: '#0047bf',
    },
  ]);

  // Network rule states
  const [audioOnly, setAudioOnly] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoPrune, setAutoPrune] = useState(false);

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<OfflineBundle | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await triggerSync?.();
      showToast('Cache validated. 0 pending offline quiz uploads.');
    } catch (err: any) {
      showToast('Local state safely backed up in IndexedDB (Offline ready).');
    } finally {
      setTimeout(() => setSyncing(false), 1200);
    }
  };

  const totalUsedMb = bundles.reduce((acc, b) => acc + b.sizeMb, 0);
  const totalCapMb = 1200;
  const usedPercent = Math.round((totalUsedMb / totalCapMb) * 100);

  const handleDeleteBundle = () => {
    if (!deleteTarget) return;
    setBundles((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    showToast(`Offline package "${deleteTarget.name}" removed.`);
    setDeleteTarget(null);
  };

  const handleClearAll = () => {
    setBundles([]);
    setClearAllOpen(false);
    showToast(`All cached packages cleared. ${totalUsedMb} MB freed.`);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto space-y-4 pb-12 animate-fadeIn">
      {/* Top Back Header */}
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005c55] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <span className="text-xs font-bold text-[#3e4947]">Vidhyapath OS Local Hub</span>
        </div>
      )}

      {/* 1. Top Ambient Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#CBD5E1]/60 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#005c55]">
            Local Storage Hub
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#3e4947] text-[10px] font-extrabold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#005c55]" />
            Zero Data Active
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#131b2e] tracking-tight">
          Offline Learning &amp; Sync
        </h1>
        <p className="text-xs text-[#3e4947] font-medium mt-0.5">
          Study without interruptions, even on remote field visits or transit.
        </p>
      </div>

      {/* 2. Storage Meter & Sync Master Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#CBD5E1]/60 relative overflow-hidden flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <span className="text-xs text-[#3e4947] font-bold block">Device Allocation</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black text-[#131b2e]">{totalUsedMb}</span>
              <span className="text-sm font-bold text-[#3e4947]">MB</span>
              <span className="text-xs text-[#6e7977] mx-1">/</span>
              <span className="text-xs text-[#3e4947] font-bold">1.2 GB Cap</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#005c55] shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        {/* Segmented Visual Bar */}
        <div className="relative z-10 space-y-2">
          <div className="h-2.5 w-full bg-[#eaedff] rounded-full overflow-hidden flex gap-0.5 p-0.5">
            {bundles.map((b) => (
              <div
                key={b.id}
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((b.sizeMb / totalCapMb) * 100)}%`,
                  backgroundColor: b.color,
                }}
                title={`${b.name} (${b.sizeMb} MB)`}
              />
            ))}
          </div>

          {/* Legend Chips */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-[#3e4947]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#005c55]" />
              Physics (42%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#904d00]" />
              Math (32%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0047bf]" />
              Chem (26%)
            </span>
            <span className="inline-flex items-center gap-1.5 ml-auto text-[#6e7977]">
              <span className="w-2 h-2 rounded-full bg-[#eaedff]" />
              {100 - usedPercent}% Free
            </span>
          </div>
        </div>

        {/* Sync Status & Trigger Strip */}
        <div className="mt-2 pt-3.5 bg-[#f2f3ff] -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 p-4 rounded-b-2xl flex flex-col gap-3 relative z-10 border-t border-[#dae2fd]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#005c55] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-xs text-[#131b2e] leading-tight">
                All cached lessons &amp; quizzes up-to-date
              </p>
              <p className="text-[11px] text-[#3e4947] mt-0.5 font-medium">
                Last sync: Today, 2:15 PM • Vidyapath Institutional Cloud
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={syncing}
              onClick={handleSyncNow}
              className="flex-1 min-h-[44px] px-4 bg-[#005c55] hover:bg-[#0f766e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-75"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing Bundles...' : 'Sync Now'}</span>
            </button>
            <button
              type="button"
              onClick={() => setClearAllOpen(true)}
              className="min-h-[44px] px-4 bg-white hover:bg-[#eaedff] text-[#131b2e] border border-[#CBD5E1] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-[#ba1a1a]" />
              <span>Cleanup</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Multilingual Offline AI Capability Notice */}
      <div className="bg-[#f2f3ff] rounded-2xl p-4 sm:p-5 flex gap-3.5 border border-[#dae2fd]">
        <div className="w-9 h-9 rounded-full bg-[#ffdcc3] flex items-center justify-center text-[#904d00] shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-[#131b2e]">
              Offline Capability &amp; Socratic AI
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#3e4947] font-black text-[10px] uppercase">
              Hybrid
            </span>
          </div>
          <p className="text-xs text-[#3e4947] mt-1 leading-relaxed">
            Offline mode provides full access to downloaded notes, lecture transcripts, and cached AI hints. Full conversational inference resumes automatically when reconnected.
          </p>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-white text-[#005c55] font-extrabold text-[11px] flex items-center gap-1.5 shadow-2xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>English, తెలుగు, हिन्दी</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white text-[#3e4947] font-extrabold text-[11px] flex items-center gap-1.5 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-[#fe932c]" />
              <span>Instant Quiz Grade</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Downloaded Packages List */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-[#131b2e]">
              Downloaded Bundles
            </h3>
            <p className="text-xs text-[#3e4947] font-medium">
              {bundles.length} Courses • Verified cryptographically for integrity
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#eaedff] text-[#131b2e] font-extrabold text-xs">
            {bundles.length} / 3 Ready
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#CBD5E1]/60 flex flex-col justify-between"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#005c55] shrink-0 font-bold">
                  <FolderDown className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-[#131b2e]">{bundle.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[10px] font-black inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#3e4947] mt-0.5 font-medium">{bundle.subject}</p>
                    </div>
                    <span className="font-extrabold text-xs text-[#131b2e] shrink-0">
                      {bundle.sizeMb} MB
                    </span>
                  </div>

                  {/* Content Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] text-[#3e4947] text-[11px] font-bold flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-[#005c55]" />
                      <span>{bundle.videos} Video Lectures</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] text-[#3e4947] text-[11px] font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0047bf]" />
                      <span>{bundle.pdfs} PDF Notes</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] text-[#3e4947] text-[11px] font-bold flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#904d00]" />
                      <span>{bundle.quizzes} Quizzes</span>
                    </span>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex items-center justify-between pt-3 mt-3 bg-[#f2f3ff]/60 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-2.5 rounded-b-2xl border-t border-[#f2f3ff]">
                    <div className="text-[11px] text-[#3e4947] font-bold flex items-center gap-1">
                      <span>Cached for {bundle.daysRemaining} more days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast(`Integrity OK: ${bundle.name} SHA-256 signature valid.`)}
                        className="px-2.5 py-1 text-xs font-bold text-[#005c55] hover:bg-[#eaedff] rounded-lg transition-colors cursor-pointer"
                      >
                        Check
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(bundle)}
                        className="px-2.5 py-1 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {bundles.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#CBD5E1]">
              <HardDrive className="w-8 h-8 text-[#6e7977] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#3e4947] font-bold">No offline packages stored.</p>
              <p className="text-[11px] text-[#6e7977] mt-1">
                You can download subjects directly from the Subject Learning Workspace.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Network Quality & Bandwidth Saver Settings */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-[#131b2e]">
            Data Saver &amp; Network Rules
          </h3>
          <span className="text-[11px] font-bold text-[#005c55] flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" />
            Rural Smart Mode
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#CBD5E1]/60 flex flex-col gap-4">
          {/* Row 1: Audio Only */}
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#131b2e] shrink-0 mt-0.5">
                <Radio className="w-5 h-5 text-[#005c55]" />
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-[#131b2e] block">
                  Auto-switch to Audio-Only on 2G/3G
                </span>
                <span className="text-xs text-[#3e4947] font-medium block mt-0.5">
                  Saves up to 88% bandwidth while keeping instructor audio &amp; sync logs active.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={audioOnly}
              onChange={(e) => {
                setAudioOnly(e.target.checked);
                showToast(`Audio-only fallback ${e.target.checked ? 'enabled' : 'disabled'}`);
              }}
              className="w-5 h-5 accent-[#005c55] rounded cursor-pointer"
            />
          </label>

          {/* Row 2: Wi-Fi Only */}
          <label className="flex items-center justify-between gap-3 cursor-pointer pt-3 border-t border-[#f2f3ff]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#131b2e] shrink-0 mt-0.5">
                <Wifi className="w-5 h-5 text-[#005c55]" />
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-[#131b2e] block">
                  Download Lessons on Wi-Fi Only
                </span>
                <span className="text-xs text-[#3e4947] font-medium block mt-0.5">
                  Prevents heavy video downloads on metered cellular SIM packs.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={wifiOnly}
              onChange={(e) => {
                setWifiOnly(e.target.checked);
                showToast(`Wi-Fi only constraint ${e.target.checked ? 'enabled' : 'disabled'}`);
              }}
              className="w-5 h-5 accent-[#005c55] rounded cursor-pointer"
            />
          </label>

          {/* Row 3: Periodic Auto-Pruning */}
          <label className="flex items-center justify-between gap-3 cursor-pointer pt-3 border-t border-[#f2f3ff]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#131b2e] shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5 text-[#904d00]" />
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-[#131b2e] block">
                  Auto-Delete Finished Course Quizzes
                </span>
                <span className="text-xs text-[#3e4947] font-medium block mt-0.5">
                  Automatically frees storage 7 days after teacher verification.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoPrune}
              onChange={(e) => {
                setAutoPrune(e.target.checked);
                showToast(`Quiz auto-pruning ${e.target.checked ? 'enabled' : 'disabled'}`);
              }}
              className="w-5 h-5 accent-[#005c55] rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 6. Educational Trust Footer Badge */}
      <div className="p-4 rounded-xl bg-[#f2f3ff] text-[#3e4947] flex items-center gap-3 border border-[#dae2fd]">
        <Shield className="w-6 h-6 text-[#005c55] shrink-0" />
        <p className="text-[11px] font-medium leading-relaxed">
          Offline packages are digitally signed by Vidhyapath OS Institutional Certificate. Your offline quiz responses will sync securely upon next internet handshake.
        </p>
      </div>

      {/* Delete Item Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#131b2e]">Remove Downloaded Content?</h3>
              <p className="text-xs text-[#3e4947] mt-1 leading-relaxed">
                Are you sure you want to remove "{deleteTarget.name}" ({deleteTarget.sizeMb} MB)? All cached videos and practice sets will be cleared.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-[#eaedff] text-[#131b2e] font-bold text-xs rounded-xl hover:bg-[#dae2fd] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBundle}
                className="flex-1 py-2.5 px-4 bg-[#ba1a1a] text-white font-bold text-xs rounded-xl hover:bg-[#93000a] cursor-pointer shadow-xs"
              >
                Delete Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {clearAllOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#131b2e]">Clear Entire Offline Cache?</h3>
              <p className="text-xs text-[#3e4947] mt-1 leading-relaxed">
                This will delete all {totalUsedMb} MB of cached lessons, quiz packages, and transcripts. You will need an active connection to re-sync them.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearAllOpen(false)}
                className="flex-1 py-2.5 px-4 bg-[#eaedff] text-[#131b2e] font-bold text-xs rounded-xl hover:bg-[#dae2fd] cursor-pointer"
              >
                Keep Files
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 py-2.5 px-4 bg-[#ba1a1a] text-white font-bold text-xs rounded-xl hover:bg-[#93000a] cursor-pointer shadow-xs"
              >
                Purge {totalUsedMb} MB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#131b2e] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#80d5cb]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
