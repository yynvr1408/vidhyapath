import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';

interface GuardianChild {
  id: string;
  fullName: string;
  loginCode?: string;
  classGrade?: number;
  attendancePercent?: number;
  completedTopicsCount: number;
  quizAttempts: number;
  averageQuizPercentage: number | null;
  assignmentSubmissions: number;
}

interface GuardianFamily {
  id: string;
  name: string;
}

export const GuardianDashboard: React.FC = () => {
  const { user, token } = useEnterpriseAuth();
  const [family, setFamily] = useState<GuardianFamily | null>(null);
  const [children, setChildren] = useState<GuardianChild[]>([]);
  const [studentCode, setStudentCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/family/mine', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not load your family records.');
      setFamily(data.family || null);
      setChildren(Array.isArray(data.children) ? data.children : []);
    } catch (err: any) {
      setError(err.message || 'Could not load your family records.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadFamily(); }, [loadFamily]);

  const linkStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!family || !studentCode.trim()) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/family/link-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ familyId: family.id, studentCode: studentCode.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not link this student account.');
      setStudentCode('');
      setMessage('Student account linked to your family.');
      await loadFamily();
    } catch (err: any) {
      setError(err.message || 'Could not link this student account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#FDF2F8] p-3 text-[#BE185D]"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#BE185D]">Guardian account</p>
            <h1 className="mt-1 text-2xl font-black text-[#0F172A]">Welcome, {user?.fullName || 'Guardian'}</h1>
            <p className="mt-1 text-sm text-[#64748B]">Child records appear here after you link their student login code.</p>
          </div>
        </div>
      </section>

      {family && (
        <form onSubmit={linkStudent} className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="student-login-code" className="mb-1 block text-sm font-bold text-[#334155]">Link a student account</label>
            <input id="student-login-code" value={studentCode} onChange={(event) => setStudentCode(event.target.value)} placeholder="Student login code" className="min-h-11 w-full rounded-xl border border-[#CBD5E1] px-3 text-sm focus:border-[#0F766E] focus:outline-none" />
          </div>
          <button type="submit" disabled={saving || !studentCode.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-bold text-white hover:bg-[#115E59] disabled:opacity-50"><UserPlus className="h-4 w-4" />{saving ? 'Linking…' : 'Link student'}</button>
        </form>
      )}

      {message && <p role="status" className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm text-[#166534]">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">{error}</p>}

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><h2 className="text-lg font-black text-[#0F172A]">{family?.name || 'Family learning records'}</h2><p className="mt-1 text-sm text-[#64748B]">Progress and assessments reported for linked students.</p></div>
          <button type="button" onClick={() => void loadFamily()} disabled={loading} aria-label="Refresh family records" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>

        {loading ? <p role="status" className="py-8 text-center text-sm text-[#64748B]">Loading family records…</p> : children.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[#94A3B8]" />
            <p className="mt-3 font-bold text-[#334155]">No student accounts are linked yet.</p>
            <p className="mt-1 text-sm text-[#64748B]">Enter a student's login code above to request access to their progress.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {children.map((child) => (
              <article key={child.id} className="rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-[#0F172A]">{child.fullName}</h3><p className="mt-1 text-sm text-[#64748B]">{child.classGrade ? `Class ${child.classGrade}` : 'Grade not provided'}</p></div><span className="rounded-full bg-[#F0FDFA] px-2.5 py-1 text-xs font-bold text-[#0F766E]">Linked</span></div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-[#64748B]">Topics completed</dt><dd className="mt-1 font-black text-[#0F172A]">{child.completedTopicsCount}</dd></div>
                  <div><dt className="text-[#64748B]">Quiz attempts</dt><dd className="mt-1 font-black text-[#0F172A]">{child.quizAttempts}</dd></div>
                  <div><dt className="text-[#64748B]">Average quiz score</dt><dd className="mt-1 font-black text-[#0F172A]">{child.averageQuizPercentage === null ? 'No results yet' : `${child.averageQuizPercentage}%`}</dd></div>
                  <div><dt className="text-[#64748B]">Attendance</dt><dd className="mt-1 font-black text-[#0F172A]">{child.attendancePercent === undefined ? 'Not reported' : `${child.attendancePercent}%`}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
