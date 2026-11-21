// Academic Administrator / Department Head (HOD) Dashboard (Level 3)
import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  FileText,
  Calendar,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';

interface AcademicAdminDashboardProps {
  onNavigateToSyllabus?: () => void;
}

export const AcademicAdminDashboard: React.FC<AcademicAdminDashboardProps> = ({ onNavigateToSyllabus }) => {
  const { user } = useEnterpriseAuth();
  const { subjects } = useAcademic();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Academic Management • Level 3 Department Head</span>
          </div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            Department of Computer Science &amp; Engineering
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            HOD: Dr. Sunita Rao • Academic Progress &amp; Curriculum Oversight Console
          </p>
        </div>

        {onNavigateToSyllabus && (
          <button
            type="button"
            onClick={onNavigateToSyllabus}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Review &amp; Edit Syllabi</span>
          </button>
        )}
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Active Degree Programme</div>
          <div className="text-lg font-black text-[#0F172A] mt-1">B.Tech (CSE)</div>
          <div className="text-[10px] text-[#0F766E] font-medium mt-1">8 Semesters Accredited</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Faculty Strength</div>
          <div className="text-lg font-black text-[#2563EB] mt-1">18 Professors</div>
          <div className="text-[10px] text-[#475569] font-medium mt-1">100% Courses Mapped</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Department Syllabus Pace</div>
          <div className="text-lg font-black text-[#16A34A] mt-1">68.5% Done</div>
          <div className="text-[10px] text-[#16A34A] font-bold mt-1">Ahead of Mid-Term Target</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Average Student Attendance</div>
          <div className="text-lg font-black text-[#D97706] mt-1">89.2%</div>
          <div className="text-[10px] text-[#B45309] font-medium mt-1">Healthy Class Turnout</div>
        </div>
      </div>

      {/* SUBJECTS & FACULTY ASSIGNMENTS */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-4">
        <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0F766E]" />
          <span>Semester 5 Subjects &amp; Assigned Faculty</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Lead Faculty</th>
                <th className="py-2.5 px-3">Curriculum Units</th>
                <th className="py-2.5 px-3">Syllabus Completion</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-3 font-bold text-[#0F172A]">{s.name}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#0F766E]">{s.code}</td>
                  <td className="py-3 px-3 text-[#475569] font-medium">Prof. Anil Kumar</td>
                  <td className="py-3 px-3 text-[#64748B]">{s.units?.length || 0} Units</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-[#E2E8F0] rounded-full h-1.5">
                        <div className="bg-[#16A34A] h-full rounded-full" style={{ width: '70%' }} />
                      </div>
                      <span className="font-bold text-[#0F172A]">70%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                      On Schedule
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
