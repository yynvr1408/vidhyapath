// Institution Administrator Dashboard (Level 2)
import React, { useState, useEffect } from 'react';
import {
  Building,
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  Send,
  Calendar,
  Layers,
  CheckCircle2,
  FileText,
  UserPlus,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { Department, Programme, Subject } from '../../types/enterprise';

interface InstitutionAdminDashboardProps {
  onNavigateToSyllabus?: () => void;
}

export const InstitutionAdminDashboard: React.FC<InstitutionAdminDashboardProps> = ({ onNavigateToSyllabus }) => {
  const { user, token } = useEnterpriseAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherDept, setTeacherDept] = useState('');
  const [teacherDesignation, setTeacherDesignation] = useState('Assistant Professor');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const instId = user?.institutionId || 'inst_ait_hyd';

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Departments
      const deptRes = await fetch(`/api/institution/${instId}/departments`);
      if (deptRes.ok) setDepartments(await deptRes.json());

      // Programmes
      const progRes = await fetch(`/api/institution/${instId}/programmes`);
      if (progRes.ok) setProgrammes(await progRes.json());

      // Subjects
      const subjRes = await fetch('/api/academic/student-syllabus');
      if (subjRes.ok) {
        const d = await subjRes.json();
        setSubjects(d.subjects || []);
      }
    } catch (err) {
      console.warn('Institution admin fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [instId]);

  const handleInviteTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherEmail || !teacherName) return;

    try {
      const res = await fetch(`/api/institution/${instId}/invite-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: teacherEmail,
          fullName: teacherName,
          departmentId: teacherDept || departments[0]?.id || 'dept_cse',
          designation: teacherDesignation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteStatus(`Invitation email successfully dispatched to ${teacherEmail}!`);
        setTeacherEmail('');
        setTeacherName('');
        setTimeout(() => setInviteModalOpen(false), 2000);
      } else {
        setInviteStatus('Error: ' + data.error);
      }
    } catch (err: any) {
      setInviteStatus('Network error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0369A1] mb-2">
            <Building className="w-3.5 h-3.5" />
            <span>Institution Administration • Level 2 Authority</span>
          </div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            {user?.institutionName || 'Apex Institute of Engineering & Technology'}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure academic years, departments, degree programmes, onboard faculty, and manage official syllabi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Faculty</span>
          </button>
          {onNavigateToSyllabus && (
            <button
              type="button"
              onClick={onNavigateToSyllabus}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-bold text-[#0F172A] transition-all"
            >
              <FileText className="w-4 h-4 text-[#0F766E]" />
              <span>Syllabus Upload Center</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Active Academic Year</div>
          <div className="text-lg font-black text-[#0F172A] mt-1">2025-2026</div>
          <div className="text-[10px] text-[#16A34A] font-bold mt-1">Current Academic Cycle</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Academic Departments</div>
          <div className="text-lg font-black text-[#0F766E] mt-1">
            {departments.length} Departments
          </div>
          <div className="text-[10px] text-[#475569] font-medium mt-1">CSE, Mathematics & Sciences</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Programmes & Degrees</div>
          <div className="text-lg font-black text-[#2563EB] mt-1">
            {programmes.length} Programmes
          </div>
          <div className="text-[10px] text-[#475569] font-medium mt-1">B.Tech 8-Semester Curriculum</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Published Syllabi</div>
          <div className="text-lg font-black text-[#D97706] mt-1">
            {subjects.length} Subjects
          </div>
          <div className="text-[10px] text-[#B45309] font-medium mt-1">AICTE R23 Curriculum Active</div>
        </div>
      </div>

      {/* DEPARTMENTS & PROGRAMMES DIRECTORY */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0F766E]" />
              <span>Academic Departments & Head of Department (HOD)</span>
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Configured departments responsible for course curricula, syllabus completion, and faculty assignment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="p-4 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#0F172A]">{dept.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1]">
                  Code: {dept.code}
                </span>
              </div>
              <div className="text-xs text-[#475569]">
                Head of Department (HOD): <span className="font-bold text-[#0F172A]">{dept.hodName || 'Assigned'}</span>
              </div>
              <div className="text-[11px] text-[#64748B]">
                Assigned Programmes: B.Tech Computer Science & Engineering (Semesters 1 - 8)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PUBLISHED CURRICULUM SUBJECTS */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2563EB]" />
              <span>Active Curriculum Subjects (Semester 5)</span>
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Verified subjects published into the academic database, dynamically served to enrolled students.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <th className="py-2.5 px-3">Subject Name</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Credits</th>
                <th className="py-2.5 px-3">Curriculum Units</th>
                <th className="py-2.5 px-3">Syllabus Version</th>
                <th className="py-2.5 px-3">Faculty Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-3 font-bold text-[#0F172A]">{s.name}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#0F766E]">{s.code}</td>
                  <td className="py-3 px-3 text-[#475569]">{s.credits} Credits</td>
                  <td className="py-3 px-3 text-[#475569]">{s.units?.length || 0} Units</td>
                  <td className="py-3 px-3 text-[11px] font-semibold text-[#64748B]">{s.syllabusVersion}</td>
                  <td className="py-3 px-3 text-[11px] font-bold text-[#16A34A]">Prof. Anil Kumar</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FACULTY ONBOARDING MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[12px] border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-extrabold text-base text-[#0F172A]">Onboard Faculty Member</h3>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                Close
              </button>
            </div>

            {inviteStatus && (
              <div className="p-3 bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] rounded-[8px] text-xs font-bold">
                {inviteStatus}
              </div>
            )}

            <form onSubmit={handleInviteTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Faculty Full Name</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1] focus:outline-hidden focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="faculty@institution.edu"
                  className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1] focus:outline-hidden focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Department</label>
                <select
                  value={teacherDept}
                  onChange={(e) => setTeacherDept(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1] bg-white font-medium"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Designation</label>
                <input
                  type="text"
                  value={teacherDesignation}
                  onChange={(e) => setTeacherDesignation(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-[8px] border border-[#CBD5E1] text-xs font-bold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Send Invitation Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
