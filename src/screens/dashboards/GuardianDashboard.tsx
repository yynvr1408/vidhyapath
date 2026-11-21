// Guardian / Parent View-Only Academic Performance Portal
import React from 'react';
import {
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';

export const GuardianDashboard: React.FC = () => {
  const { user } = useEnterpriseAuth();
  const { subjects, completedTopicIds } = useAcademic();

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-xs">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDF2F8] text-[#BE185D] mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Parent / Guardian Portal • View-Only Verified Access</span>
        </div>
        <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
          Ward Academic Overview: Aditya Verma
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Apex Institute of Engineering &amp; Technology • B.Tech Computer Science (Semester 5)
        </p>
      </div>

      {/* Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Class Attendance</div>
          <div className="text-2xl font-black text-[#16A34A] mt-1">91%</div>
          <div className="text-[10px] text-[#16A34A] font-bold mt-1">Well above 75% minimum rule</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Syllabus Topics Mastered</div>
          <div className="text-2xl font-black text-[#0F766E] mt-1">
            {completedTopicIds.length} / 7
          </div>
          <div className="text-[10px] text-[#475569] font-medium mt-1">On schedule with curriculum</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Recent Assessment</div>
          <div className="text-2xl font-black text-[#2563EB] mt-1">100% (4/4)</div>
          <div className="text-[10px] text-[#2563EB] font-bold mt-1">Unit 1 Mastery Quiz Passed</div>
        </div>
      </div>

      {/* Subject Performance Breakdown */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-4">
        <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0F766E]" />
          <span>Active Subjects &amp; Conceptual Progress</span>
        </h3>

        <div className="space-y-3">
          {subjects.map((s) => (
            <div key={s.id} className="p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-[#0F172A]">{s.name}</span>
                  <span className="text-[#64748B] ml-2">({s.code})</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                  Good Standing
                </span>
              </div>
              <p className="text-[11px] text-[#475569]">
                All assignments submitted on time. Student active in problem solving discussions.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Teacher Guidance for Parents */}
      <div className="bg-[#F0FDFA] rounded-[12px] border border-[#99F6E4] p-5 space-y-2">
        <h4 className="font-extrabold text-xs text-[#0F766E] uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Faculty Advisory for Home Study</span>
        </h4>
        <p className="text-xs text-[#134E4A] leading-relaxed">
          Aditya has shown strong analytical comprehension in CPU Scheduling and Paging calculations. Encourage 30 minutes of daily quiet review of Operating Systems Banker Algorithm before the upcoming mid-term examinations.
        </p>
      </div>
    </div>
  );
};
