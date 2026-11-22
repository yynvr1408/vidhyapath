import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LearningPackSummary {
  id: string;
  version: string;
  language: string;
  languageName: string;
  class: number;
  subject: string;
  board: string;
}

interface OfflineLearningCenterProps {
  onBack?: () => void;
}

export const OfflineLearningCenter: React.FC<OfflineLearningCenterProps> = ({ onBack }) => {
  const { pack, isOffline, syncPending, queuedDoubtsCount, triggerSync, switchPack } = useApp();
  const [packs, setPacks] = useState<LearningPackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadPacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/packs');
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error(data.error || 'Could not load learning packs.');
      setPacks(data);
    } catch (err: any) {
      setError(err.message || 'Could not load learning packs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPacks(); }, [loadPacks]);

  const selectPack = async (packId: string) => {
    setSwitching(packId);
    setNotice(null);
    try {
      await switchPack(packId);
      setNotice('Learning pack opened. This browser can reuse cached pack content when offline.');
    } catch (err: any) {
      setError(err.message || 'Could not open this learning pack.');
    } finally {
      setSwitching(null);
    }
  };

  const sync = async () => {
    setNotice(null);
    try {
      await triggerSync();
      setNotice(isOffline ? 'You are offline. Pending activity will sync when the connection returns.' : 'Sync check complete.');
    } catch (err: any) {
      setError(err.message || 'Could not sync learning activity.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="flex items-start gap-3">{onBack && <button type="button" onClick={onBack} aria-label="Back to dashboard" className="rounded-xl border border-[#CBD5E1] p-2 text-[#475569] hover:bg-[#F8FAFC]"><ArrowLeft className="h-5 w-5" /></button>}<div><p className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">Browser learning</p><h1 className="mt-1 text-2xl font-black text-[#0F172A]">Learning packs and sync</h1><p className="mt-1 text-sm text-[#64748B]">Open published lessons and check the activity saved in this browser.</p></div></div>
        <div className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-bold ${isOffline ? 'border-[#FCD34D] bg-[#FFFBEB] text-[#92400E]' : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'}`}>{isOffline ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}{isOffline ? 'Offline' : 'Online'}</div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm text-[#166534]">{notice}</p>}

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-[#0F172A]">Published packs</h2><p className="mt-1 text-sm text-[#64748B]">Pack details are loaded from the deployed content catalog.</p></div><button type="button" onClick={() => void loadPacks()} disabled={loading} aria-label="Refresh learning packs" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#CBD5E1] px-3 text-sm font-bold text-[#334155] disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button></div>
        {loading ? <p role="status" className="py-8 text-center text-sm text-[#64748B]">Loading published packs…</p> : packs.length === 0 ? <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B]">No learning packs are currently published.</p> : <div className="grid gap-3 md:grid-cols-2">{packs.map((item) => {
          const active = pack?.id === item.id;
          return <article key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] p-4"><div className="flex min-w-0 items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#0F766E]" /><div className="min-w-0"><h3 className="font-bold text-[#0F172A]">{item.subject} · Class {item.class}</h3><p className="mt-1 text-xs text-[#64748B]">{item.languageName} · {item.board} · v{item.version}</p><p className="mt-1 truncate font-mono text-[11px] text-[#94A3B8]">{item.id}</p></div></div><button type="button" onClick={() => void selectPack(item.id)} disabled={active || switching !== null} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-[#0F766E] px-3 text-sm font-bold text-white disabled:cursor-default disabled:bg-[#E2E8F0] disabled:text-[#475569]">{active ? <><CheckCircle2 className="h-4 w-4" />Open</> : switching === item.id ? 'Loading…' : 'Open'}</button></article>;
        })}</div>}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><div><h2 className="font-black text-[#0F172A]">Learning activity sync</h2><p className="mt-1 text-sm text-[#64748B]">{syncPending || queuedDoubtsCount ? `${queuedDoubtsCount} doubt${queuedDoubtsCount === 1 ? '' : 's'} waiting to sync.` : 'No pending activity is reported.'}</p></div><button type="button" onClick={() => void sync()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-bold text-white hover:bg-[#115E59]"><RefreshCw className="h-4 w-4" />Check sync</button></section>
    </div>
  );
};
