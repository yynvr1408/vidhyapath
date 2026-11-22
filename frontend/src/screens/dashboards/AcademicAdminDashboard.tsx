import React from 'react';
import { ArrowRight, BookOpen, FileText, Layers } from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';

interface AcademicAdminDashboardProps {
  onNavigateToSyllabus?: () => void;
}

export const AcademicAdminDashboard: React.FC<AcademicAdminDashboardProps> = ({ onNavigateToSyllabus }) => {
  const { user } = useEnterpriseAuth();
  const { subjects, loading } = useAcademic();
  const unitCount = subjects.reduce((total, subject) => total + (subject.units || []).length, 0);
  const teacherAssignments = subjects.reduce((total, subject) => total + (subject.assignedTeacherIds || []).length, 0);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#B45309]">Academic administration</p>
          <h1 className="mt-1 text-2xl font-black text-[#0F172A]">Welcome, {user?.fullName || 'Academic administrator'}</h1>
          <p className="mt-1 text-sm text-[#64748B]">{user?.institutionName || 'Institution curriculum and faculty overview'}</p>
        </div>
        {onNavigateToSyllabus && <button type="button" onClick={onNavigateToSyllabus} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-bold text-white hover:bg-[#115E59]"><FileText className="h-4 w-4" />Manage syllabi</button>}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><p className="text-sm font-semibold text-[#64748B]">Subjects in your scope</p><p className="mt-2 text-3xl font-black text-[#0F766E]">{loading ? '…' : subjects.length}</p></div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><p className="text-sm font-semibold text-[#64748B]">Curriculum units</p><p className="mt-2 text-3xl font-black text-[#0F172A]">{loading ? '…' : unitCount}</p></div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"><p className="text-sm font-semibold text-[#64748B]">Subject teacher assignments</p><p className="mt-2 text-3xl font-black text-[#0F172A]">{loading ? '…' : teacherAssignments}</p></div>
      </section>

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#0F172A]"><Layers className="h-5 w-5 text-[#0F766E]" />Curriculum in your scope</h2>
        {loading ? <p role="status" className="py-8 text-center text-sm text-[#64748B]">Loading curriculum…</p> : subjects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B]">No subjects are published for this account yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="border-b border-[#E2E8F0] text-xs font-bold uppercase text-[#64748B]"><th className="py-3 pr-4">Subject</th><th className="py-3 pr-4">Code</th><th className="py-3 pr-4">Units</th><th className="py-3 pr-4">Assigned teachers</th></tr></thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="py-3 pr-4 font-bold text-[#0F172A]">{subject.name}</td>
                    <td className="py-3 pr-4 font-mono text-[#475569]">{subject.code}</td>
                    <td className="py-3 pr-4 text-[#475569]">{subject.units?.length || 0}</td>
                    <td className="py-3 pr-4 text-[#475569]">{subject.assignedTeacherIds?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
