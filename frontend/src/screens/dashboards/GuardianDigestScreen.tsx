import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, FileText, Pause, Play, RefreshCw, Volume2 } from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';

interface GuardianChild {
  id: string;
  fullName: string;
  classGrade?: number;
  attendancePercent?: number;
  completedTopicsCount: number;
  quizAttempts: number;
  averageQuizPercentage: number | null;
  assignmentSubmissions: number;
}

interface FamilySummary {
  children: GuardianChild[];
}

interface GuardianDigestScreenProps {
  onBack?: () => void;
}

export const GuardianDigestScreen: React.FC<GuardianDigestScreenProps> = ({ onBack }) => {
  const { user, token } = useEnterpriseAuth();
  const [summary, setSummary] = useState<FamilySummary>({ children: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/family/mine', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not load your family records.');
      setSummary({ children: Array.isArray(data.children) ? data.children : [] });
    } catch (err: any) {
      setError(err.message || 'Could not load your family records.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadSummary(); }, [loadSummary]);

  const digestText = useMemo(() => {
    if (summary.children.length === 0) return 'No linked student records are available yet.';
    return summary.children.map((child) => {
      const details = [
        `${child.completedTopicsCount} topics completed`,
        `${child.quizAttempts} quiz attempts`,
        child.averageQuizPercentage === null ? 'no quiz scores recorded' : `average quiz score ${child.averageQuizPercentage} percent`,
        child.attendancePercent === undefined ? 'attendance not reported' : `attendance ${child.attendancePercent} percent`,
        `${child.assignmentSubmissions} assignments submitted`,
      ];
      return `${child.fullName}${child.classGrade ? `, class ${child.classGrade}` : ''}: ${details.join(', ')}.`;
    }).join(' ');
  }, [summary.children]);

  const toggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      setError('Audio playback is not supported in this browser.');
      return;
    }
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(digestText);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="flex items-start gap-3">
          {onBack && <button type="button" onClick={onBack} aria-label="Back to dashboard" className="rounded-xl border border-[#CBD5E1] p-2 text-[#475569] hover:bg-[#F8FAFC]"><ArrowLeft className="h-5 w-5" /></button>}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#BE185D]">Guardian account</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-[#0F172A]"><FileText className="h-6 w-6 text-[#BE185D]" />Family learning summary</h1>
            <p className="mt-1 text-sm text-[#64748B]">Summary data for {user?.fullName || 'your account'} is read from linked student records.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#64748B]"><Calendar className="h-4 w-4 text-[#BE185D]" />Updated {new Date().toLocaleDateString()}</div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">{error}</p>}

      <section className="rounded-2xl border border-[#FBCFE8] bg-gradient-to-r from-[#FDF2F8] to-[#FCE7F3] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-[#BE185D] p-3 text-white"><Volume2 className="h-5 w-5" /></div><div><h2 className="font-black text-[#0F172A]">Listen to this summary</h2><p className="text-sm text-[#475569]">Uses the progress and attendance records currently available.</p></div></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void loadSummary()} disabled={loading} aria-label="Refresh summary" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#334155] disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
            <button type="button" onClick={toggleAudio} disabled={loading || summary.children.length === 0} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#BE185D] px-4 text-sm font-bold text-white hover:bg-[#9D174D] disabled:opacity-50">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{isPlaying ? 'Pause' : 'Play'}</button>
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-[#FBCFE8] bg-white/80 p-4 text-sm leading-relaxed text-[#334155]">{loading ? 'Loading linked student records…' : digestText}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><p className="text-sm font-semibold text-[#64748B]">Linked students</p><p className="mt-2 text-3xl font-black text-[#BE185D]">{loading ? '…' : summary.children.length}</p></article>
        <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><p className="text-sm font-semibold text-[#64748B]">Topics completed</p><p className="mt-2 text-3xl font-black text-[#0F172A]">{loading ? '…' : summary.children.reduce((sum, child) => sum + child.completedTopicsCount, 0)}</p></article>
        <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><p className="text-sm font-semibold text-[#64748B]">Assessments recorded</p><p className="mt-2 text-3xl font-black text-[#0F172A]">{loading ? '…' : summary.children.reduce((sum, child) => sum + child.quizAttempts + child.assignmentSubmissions, 0)}</p></article>
      </section>

      {!loading && summary.children.length === 0 && <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-6 text-center text-sm text-[#64748B]">No students are linked yet. Open the guardian dashboard and link a student account to see their real progress here.</p>}
    </div>
  );
};
