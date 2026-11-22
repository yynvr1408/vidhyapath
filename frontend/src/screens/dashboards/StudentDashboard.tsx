import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Globe2, RefreshCw, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { useApp } from '../../context/AppContext';
import type { Subject } from '../../types/enterprise';

interface StudentDashboardProps {
  onOpenSubject: (subject: Subject) => void;
  onOpenAiTutor: (prefilledQuery?: string) => void;
  onOpenOfflineCenter: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onOpenSubject, onOpenAiTutor, onOpenOfflineCenter }) => {
  const { user } = useEnterpriseAuth();
  const { subjects, completedTopicIds, loading } = useAcademic();
  const { currentLanguage, switchLanguage, triggerSync, isOffline, syncPending } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const totalTopics = subjects.reduce((total, subject) =>
    total + (subject.units || []).reduce((unitTotal, unit) => unitTotal + (unit.topics || []).length, 0), 0);
  const completedCount = completedTopicIds.length;
  const progress = totalTopics > 0 ? Math.min(100, Math.round((completedCount / totalTopics) * 100)) : 0;
  const learnerClass = user?.studentProfile?.classGrade
    ? `Class ${user.studentProfile.classGrade}`
    : user?.studentProfile?.programmeId || 'Student account';

  const refreshSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      await triggerSync();
      setSyncMessage(isOffline ? 'Your learning stays saved on this device and will sync when the connection returns.' : syncPending ? 'Some learning activity is still waiting to sync.' : 'Sync check complete.');
    } catch {
      setSyncMessage('Your learning remains saved on this device. Try syncing again when the connection is stable.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-8">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">Student learning</p>
          <h1 className="mt-1 text-2xl font-black text-[#0F172A]">Welcome, {user?.fullName || 'Student'}</h1>
          <p className="mt-1 text-sm text-[#64748B]">{learnerClass}{user?.institutionName ? ` · ${user.institutionName}` : ''}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void switchLanguage(currentLanguage === 'en' ? 'te' : currentLanguage === 'te' ? 'hi' : 'en')}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm font-bold text-[#334155] hover:bg-[#F8FAFC]"
          >
            <Globe2 className="h-4 w-4" />
            {currentLanguage.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={refreshSync}
            disabled={syncing}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-3 text-sm font-bold text-white hover:bg-[#115E59] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Check sync
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-sm font-semibold text-[#64748B]">Subjects available</p>
          <p className="mt-2 text-3xl font-black text-[#0F766E]">{subjects.length}</p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-sm font-semibold text-[#64748B]">Topics completed</p>
          <p className="mt-2 text-3xl font-black text-[#0F172A]">{completedCount}{totalTopics > 0 ? <span className="text-lg text-[#64748B]"> / {totalTopics}</span> : null}</p>
          {totalTopics > 0 && <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E2E8F0]"><div className="h-full rounded-full bg-[#0F766E]" style={{ width: `${progress}%` }} /></div>}
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-sm font-semibold text-[#64748B]">Connection</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-black text-[#0F172A]">
            {isOffline ? <WifiOff className="h-5 w-5 text-[#D97706]" /> : <Wifi className="h-5 w-5 text-[#16A34A]" />}
            {isOffline ? 'Offline' : 'Online'}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">{syncPending ? 'Learning activity is waiting to sync.' : 'No pending sync items.'}</p>
        </div>
      </section>

      {syncMessage && <p role="status" className="rounded-xl border border-[#99F6E4] bg-[#F0FDFA] p-3 text-sm text-[#115E59]">{syncMessage}</p>}

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#0F172A]">My subjects</h2>
            <p className="mt-1 text-sm text-[#64748B]">Open a subject to continue with its syllabus and learning materials.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onOpenAiTutor()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD5E1] px-3 text-sm font-bold text-[#334155] hover:bg-[#F8FAFC]"><Sparkles className="h-4 w-4 text-[#D97706]" />Ask tutor</button>
            <button type="button" onClick={onOpenOfflineCenter} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD5E1] px-3 text-sm font-bold text-[#334155] hover:bg-[#F8FAFC]"><BookOpen className="h-4 w-4 text-[#0F766E]" />Offline content</button>
          </div>
        </div>

        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-[#64748B]">Loading your subjects…</p>
        ) : subjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[#94A3B8]" />
            <p className="mt-3 font-bold text-[#334155]">No subjects are assigned yet.</p>
            <p className="mt-1 text-sm text-[#64748B]">Your school or platform administrator can publish subjects to your account.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {subjects.map((subject) => {
              const topics = (subject.units || []).reduce((total, unit) => total + (unit.topics || []).length, 0);
              const completed = (subject.units || []).flatMap((unit) => unit.topics || []).filter((topic) => completedTopicIds.includes(topic.id)).length;
              return (
                <button key={subject.id} type="button" onClick={() => onOpenSubject(subject)} className="rounded-xl border border-[#E2E8F0] p-4 text-left transition hover:border-[#0F766E] hover:bg-[#F8FAFC]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#0F172A]">{subject.name}</p>
                      <p className="mt-1 text-xs font-semibold text-[#64748B]">{subject.code}{subject.credits ? ` · ${subject.credits} credits` : ''}</p>
                    </div>
                    <BookOpen className="h-5 w-5 shrink-0 text-[#0F766E]" />
                  </div>
                  <p className="mt-3 text-sm text-[#475569]">{subject.description || `${subject.units?.length || 0} curriculum units`}</p>
                  <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[#0F766E]"><CheckCircle2 className="h-4 w-4" />{completed} of {topics} topics complete</p>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
