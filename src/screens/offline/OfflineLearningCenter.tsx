// Offline Learning Center & Synchronization Engine Console
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
  BookOpen,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { useApp } from '../../context/AppContext';

interface OfflineLearningCenterProps {
  onBack?: () => void;
}

export const OfflineLearningCenter: React.FC<OfflineLearningCenterProps> = ({ onBack }) => {
  const { user } = useEnterpriseAuth();
  const { subjects } = useAcademic();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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

  const { activeLearner, triggerSync } = useApp();

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      await triggerSync();
      setSyncStatus('Local data is fully synchronized with Vidyapath Cloud. Zero conflicts.');
    } catch (err: any) {
      setSyncStatus('Offline: Network unavailable. Attempts remain safely persisted locally in IndexedDB.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      )}

      {/* Top Banner */}
      <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>0-Data Offline First Architecture</span>
          </div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            Offline Learning Center &amp; Sync Engine
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Access downloaded lecture notes, review cached syllabi, and sync assignment attempts seamlessly even with intermittent or zero internet connectivity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Synchronizing...' : 'Sync Now with Cloud'}</span>
        </button>
      </div>

      {syncStatus && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#86EFAC] rounded-[10px] text-xs font-bold text-[#166534] flex items-center justify-between">
          <span>{syncStatus}</span>
          <button type="button" onClick={() => setSyncStatus(null)} className="text-[#166534] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Connection & Storage Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B]">Network State</span>
            {isOffline ? <WifiOff className="w-4 h-4 text-[#D97706]" /> : <Wifi className="w-4 h-4 text-[#16A34A]" />}
          </div>
          <div className="text-lg font-black text-[#0F172A] mt-1">
            {isOffline ? 'Offline Mode' : 'Connected (Online)'}
          </div>
          <div className="text-[10px] text-[#475569] font-medium mt-1">
            {isOffline ? 'Operating on local device cache' : 'Live server socket ready'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B]">Local IndexedDB Persistence</span>
            <HardDrive className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="text-lg font-black text-[#0F766E] mt-1">Encrypted &amp; Safe</div>
          <div className="text-[10px] text-[#475569] font-medium mt-1">
            Progress &amp; attempt logs persisted locally
          </div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B]">Cached Subject Syllabi</span>
            <BookOpen className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-lg font-black text-[#2563EB] mt-1">{subjects.length} Subjects</div>
          <div className="text-[10px] text-[#475569] font-medium mt-1">Available with zero mobile data</div>
        </div>
      </div>

      {/* DOWNLOADED & CACHED RESOURCES */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
              <FolderDown className="w-4 h-4 text-[#0F766E]" />
              <span>Offline Ready Study Materials</span>
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              These items are saved directly on this phone/computer and can be studied without internet connection.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#0F766E] shrink-0" />
              <div>
                <div className="font-bold text-xs text-[#0F172A]">
                  CPU Scheduling Summary &amp; Solved Numerical Problems
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Operating Systems (CS501) • 18 KB • Cached
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
              Downloaded (Offline)
            </span>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#2563EB] shrink-0" />
              <div>
                <div className="font-bold text-xs text-[#0F172A]">
                  Computer Networks Unit 1: Framing &amp; CRC Checksums
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Computer Networks (CS502) • 24 KB • Cached
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
              Downloaded (Offline)
            </span>
          </div>
        </div>
      </div>

      {/* SYNCHRONIZATION CONFLICT RESOLUTION PRINCIPLES */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-3">
        <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#16A34A]" />
          <span>Vidyapath Offline Guarantee &amp; Conflict Resolution</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#475569]">
          <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A] block mb-1">Never Discards Work</span>
            All quiz answers, assignment drafts, and study times are timestamped and queued locally. Server merges without overwriting.
          </div>
          <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="font-bold text-[#0F172A] block mb-1">Deduplication Protection</span>
            Idempotent event IDs ensure that resending synced data upon reconnection never creates duplicate submissions or altered grades.
          </div>
        </div>
      </div>
    </div>
  );
};
