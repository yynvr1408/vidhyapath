import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, FileText, Plus, Sparkles } from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';
import type { Subject } from '../../types/enterprise';

interface TeacherDashboardProps {
  onOpenSubject: (subject: Subject) => void;
  onOpenAiTutor: () => void;
}

interface AssignmentSummary {
  id: string;
  title: string;
  submissionsCount?: number;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onOpenSubject, onOpenAiTutor }) => {
  const { user, token } = useEnterpriseAuth();
  const { subjects } = useAcademic();
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [addResourceModal, setAddResourceModal] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<'note' | 'pdf' | 'recorded_lecture' | 'live_class'>('note');
  const [resContent, setResContent] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const loadAssignments = async () => {
      setLoadingAssignments(true);
      try {
        const response = await fetch('/api/lms/assignments', { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          setAssignments(Array.isArray(data) ? data : []);
        }
      } catch {
        setAssignments([]);
      } finally {
        setLoadingAssignments(false);
      }
    };
    void loadAssignments();
  }, [token]);

  const handleCreateResource = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetSubject = subjects[0];
    if (!targetSubject) {
      setActionNotice('A subject must be assigned to your account before you can add classroom material.');
      return;
    }
    try {
      const response = await fetch(`/api/lms/subjects/${targetSubject.id}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: resTitle,
          resourceType: resType,
          contentText: resType === 'note' ? resContent : undefined,
          fileUrl: resType === 'pdf' ? resUrl : undefined,
          videoUrl: resType === 'recorded_lecture' ? resUrl : undefined,
          meetingUrl: resType === 'live_class' ? resUrl : undefined,
          scheduledAt: resType === 'live_class' ? Date.now() + 24 * 60 * 60 * 1000 : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not publish this resource.');
      setActionNotice(`“${resTitle}” was added to ${targetSubject.name}.`);
      setResTitle('');
      setResContent('');
      setResUrl('');
      setAddResourceModal(false);
    } catch (error: any) {
      setActionNotice(error.message || 'Could not publish this resource.');
    }
  };

  const submissionCount = assignments.reduce((total, assignment) => total + (assignment.submissionsCount || 0), 0);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#15803D]">Teacher workspace</p>
          <h1 className="mt-1 text-2xl font-black text-[#0F172A]">Welcome, {user?.fullName || 'Teacher'}</h1>
          <p className="mt-1 text-sm text-[#64748B]">{user?.teacherProfile?.designation || 'Faculty account'}{user?.institutionName ? ` · ${user.institutionName}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAddResourceModal(true)} disabled={subjects.length === 0} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-3 text-sm font-bold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />Add material</button>
          <button type="button" onClick={onOpenAiTutor} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD5E1] px-3 text-sm font-bold text-[#334155] hover:bg-[#F8FAFC]"><Sparkles className="h-4 w-4 text-[#D97706]" />Teaching assistant</button>
        </div>
      </section>

      {actionNotice && <p role="status" className="rounded-xl border border-[#99F6E4] bg-[#F0FDFA] p-3 text-sm text-[#115E59]">{actionNotice}</p>}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><p className="text-sm font-semibold text-[#64748B]">Assigned subjects</p><p className="mt-2 text-3xl font-black text-[#0F766E]">{subjects.length}</p></div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><p className="text-sm font-semibold text-[#64748B]">Assignments</p><p className="mt-2 text-3xl font-black text-[#0F172A]">{loadingAssignments ? '…' : assignments.length}</p></div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><p className="text-sm font-semibold text-[#64748B]">Submissions received</p><p className="mt-2 text-3xl font-black text-[#0F172A]">{loadingAssignments ? '…' : submissionCount}</p></div>
      </section>

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <h2 className="mb-4 text-lg font-black text-[#0F172A]">My classrooms</h2>
        {subjects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B]">No subjects are assigned to your account yet. Contact your institution administrator.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {subjects.map((subject) => (
              <article key={subject.id} className="rounded-xl border border-[#E2E8F0] p-4">
                <p className="font-black text-[#0F172A]">{subject.name}</p>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">{subject.code} · {subject.units?.length || 0} units</p>
                <p className="mt-3 text-sm text-[#475569]">{subject.description || 'No subject description provided.'}</p>
                <button type="button" onClick={() => onOpenSubject(subject)} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#F0FDFA] px-3 text-sm font-bold text-[#0F766E] hover:bg-[#CCFBF1]">Open classroom <ArrowRight className="h-4 w-4" /></button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-[#0F172A]"><FileText className="h-5 w-5 text-[#0F766E]" />Assignment activity</h2>
        {assignments.length === 0 ? <p className="text-sm text-[#64748B]">No assignments are available in your teaching scope.</p> : <ul className="divide-y divide-[#E2E8F0]">{assignments.map((assignment) => <li key={assignment.id} className="flex items-center justify-between gap-3 py-3"><span className="font-semibold text-[#334155]">{assignment.title}</span><span className="text-sm text-[#64748B]">{assignment.submissionsCount || 0} submissions</span></li>)}</ul>}
      </section>

      {addResourceModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-[#0F172A]">Add classroom material</h2><button type="button" onClick={() => setAddResourceModal(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-[#64748B] hover:bg-[#F1F5F9]">Close</button></div>
            <form onSubmit={handleCreateResource} className="space-y-3">
              <label className="block text-sm font-bold text-[#334155]">Subject<select className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] px-3" value={subjects[0]?.id || ''} disabled><option value={subjects[0]?.id || ''}>{subjects[0]?.name || 'No assigned subject'}</option></select></label>
              <label className="block text-sm font-bold text-[#334155]">Type<select value={resType} onChange={(event) => setResType(event.target.value as typeof resType)} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] px-3"><option value="note">Study note</option><option value="pdf">PDF link</option><option value="recorded_lecture">Recorded lecture link</option><option value="live_class">Live class link</option></select></label>
              <label className="block text-sm font-bold text-[#334155]">Title<input required value={resTitle} onChange={(event) => setResTitle(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] px-3" /></label>
              {resType === 'note' ? <label className="block text-sm font-bold text-[#334155]">Content<textarea required value={resContent} onChange={(event) => setResContent(event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2" /></label> : <label className="block text-sm font-bold text-[#334155]">Resource URL<input required type="url" value={resUrl} onChange={(event) => setResUrl(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] px-3" /></label>}
              <button type="submit" className="min-h-11 w-full rounded-xl bg-[#0F766E] font-bold text-white hover:bg-[#115E59]">Publish to classroom</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
