import React, { useCallback, useEffect, useState } from 'react';
import { Building, RefreshCw, Send, Users } from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import type { Department, Programme, Subject } from '../../types/enterprise';

interface InstitutionAdminDashboardProps {
  onNavigateToSyllabus?: () => void;
}

export const InstitutionAdminDashboard: React.FC<InstitutionAdminDashboardProps> = ({ onNavigateToSyllabus }) => {
  const { user, token } = useEnterpriseAuth();
  const institutionId = user?.institutionId;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('Teacher');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!institutionId) {
      setDepartments([]);
      setProgrammes([]);
      setSubjects([]);
      setLoading(false);
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [departmentResponse, programmeResponse, subjectResponse] = await Promise.all([
        fetch(`/api/institution/${institutionId}/departments`, { headers }),
        fetch(`/api/institution/${institutionId}/programmes`, { headers }),
        fetch('/api/academic/student-syllabus', { headers }),
      ]);
      if (departmentResponse.ok) setDepartments(await departmentResponse.json());
      if (programmeResponse.ok) setProgrammes(await programmeResponse.json());
      if (subjectResponse.ok) {
        const data = await subjectResponse.json();
        setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load institution data.');
    } finally {
      setLoading(false);
    }
  }, [institutionId, token]);

  useEffect(() => { void loadData(); }, [loadData]);

  const inviteTeacher = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!institutionId) return;
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/institution/${institutionId}/invite-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: teacherEmail.trim(), fullName: teacherName.trim(), departmentId: departmentId || undefined, designation }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not invite this teacher.');
      setNotice(`An invitation was sent to ${teacherEmail.trim()}.`);
      setTeacherName('');
      setTeacherEmail('');
      setInviteOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Could not invite this teacher.');
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#0369A1]">Institution workspace</p>
          <h1 className="mt-1 text-2xl font-black text-[#0F172A]">{user?.institutionName || 'Institution dashboard'}</h1>
          <p className="mt-1 text-sm text-[#64748B]">Managed by {user?.fullName || 'your administrator account'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD5E1] px-3 text-sm font-bold text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
          <button type="button" onClick={() => setInviteOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-3 text-sm font-bold text-white hover:bg-[#115E59]"><Send className="h-4 w-4" />Invite teacher</button>
          {onNavigateToSyllabus && <button type="button" onClick={onNavigateToSyllabus} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CBD5E1] px-3 text-sm font-bold text-[#334155] hover:bg-[#F8FAFC]">Manage syllabus</button>}
        </div>
      </section>

      {notice && <p role="status" className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm text-[#166534]">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><p className="text-sm font-semibold text-[#64748B]">Departments</p><p className="mt-2 text-3xl font-black text-[#0F766E]">{loading ? '…' : departments.length}</p></div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><p className="text-sm font-semibold text-[#64748B]">Programmes</p><p className="mt-2 text-3xl font-black text-[#0F172A]">{loading ? '…' : programmes.length}</p></div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><p className="text-sm font-semibold text-[#64748B]">Subjects</p><p className="mt-2 text-3xl font-black text-[#0F172A]">{loading ? '…' : subjects.length}</p></div>
      </section>

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#0F172A]"><Building className="h-5 w-5 text-[#0F766E]" />Academic structure</h2>
        {loading ? <p role="status" className="py-8 text-center text-sm text-[#64748B]">Loading institution data…</p> : departments.length === 0 && programmes.length === 0 && subjects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B]">No departments, programmes, or subjects have been added for this institution.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            <div><h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#334155]"><Users className="h-4 w-4" />Departments</h3><ul className="space-y-2">{departments.map((department) => <li key={department.id} className="rounded-lg bg-[#F8FAFC] p-3 text-sm"><span className="font-bold text-[#0F172A]">{department.name}</span><span className="ml-2 text-xs text-[#64748B]">{department.code}</span></li>)}</ul>{departments.length === 0 && <p className="text-sm text-[#64748B]">No departments added.</p>}</div>
            <div><h3 className="mb-2 text-sm font-bold text-[#334155]">Programmes</h3><ul className="space-y-2">{programmes.map((programme) => <li key={programme.id} className="rounded-lg bg-[#F8FAFC] p-3 text-sm font-semibold text-[#0F172A]">{programme.name}<span className="ml-2 text-xs text-[#64748B]">{programme.code}</span></li>)}</ul>{programmes.length === 0 && <p className="text-sm text-[#64748B]">No programmes added.</p>}</div>
            <div><h3 className="mb-2 text-sm font-bold text-[#334155]">Subjects</h3><ul className="space-y-2">{subjects.map((subject) => <li key={subject.id} className="rounded-lg bg-[#F8FAFC] p-3 text-sm"><span className="font-bold text-[#0F172A]">{subject.name}</span><span className="ml-2 text-xs text-[#64748B]">{subject.code}</span></li>)}</ul>{subjects.length === 0 && <p className="text-sm text-[#64748B]">No subjects published.</p>}</div>
          </div>
        )}
      </section>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-[#0F172A]">Invite a teacher</h2><button type="button" onClick={() => setInviteOpen(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-[#64748B] hover:bg-[#F1F5F9]">Close</button></div>
            <form onSubmit={inviteTeacher} className="space-y-3">
              <label className="block text-sm font-bold text-[#334155]">Full name<input required value={teacherName} onChange={(event) => setTeacherName(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] px-3" /></label>
              <label className="block text-sm font-bold text-[#334155]">Work email<input required type="email" value={teacherEmail} onChange={(event) => setTeacherEmail(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] px-3" /></label>
              <label className="block text-sm font-bold text-[#334155]">Department<select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] px-3"><option value="">No department selected</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
              <label className="block text-sm font-bold text-[#334155]">Designation<input value={designation} onChange={(event) => setDesignation(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] px-3" /></label>
              <button type="submit" className="min-h-11 w-full rounded-xl bg-[#0F766E] font-bold text-white hover:bg-[#115E59]">Send invitation</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
