// Student Personal Academic Dashboard (Level 5)
import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  FolderDown,
  ArrowRight,
  TrendingUp,
  FileText,
  Video,
  Sparkles,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { Subject } from '../../types/enterprise';

interface StudentDashboardProps {
  onOpenSubject: (subject: Subject) => void;
  onOpenAiTutor: () => void;
  onOpenOfflineCenter: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenSubject,
  onOpenAiTutor,
  onOpenOfflineCenter,
}) => {
  const { user } = useEnterpriseAuth();
  const { subjects, completedTopicIds, toggleTopicCompletion } = useAcademic();
  const [quickDoubt, setQuickDoubt] = useState('');

  const profile = user?.studentProfile;

  // Calculate overall syllabus completion
  let totalTopics = 0;
  subjects.forEach((s) => {
    s.units?.forEach((u) => {
      totalTopics += u.topics?.length || 0;
    });
  });
  const completedCount = completedTopicIds.length;
  const overallProgress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 40;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Verified Academic Profile Banner */}
      <div className="bg-gradient-to-r from-[#0F766E] to-[#115E59] text-white p-6 rounded-[14px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white mb-2 backdrop-blur-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Institutional Profile • Level 5 Student</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Welcome back, {user?.fullName || 'Student'}!
          </h2>
          <p className="text-xs text-white/90 font-medium mt-1">
            {user?.institutionName} • B.Tech Computer Science &amp; Engineering
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-white/90">
            <span className="bg-white/10 px-2.5 py-1 rounded-md font-mono">
              Roll: {profile?.rollNumber || '23CS042'}
            </span>
            <span className="bg-white/10 px-2.5 py-1 rounded-md font-bold">
              Semester: {profile?.semester || 5} (Batch {profile?.admissionYear || '2023'})
            </span>
            <span className="bg-[#DCFCE7] text-[#166534] px-2.5 py-1 rounded-md font-bold">
              Attendance: {profile?.attendancePercent || 91}%
            </span>
          </div>
        </div>

        {/* Syllabus Progress Card */}
        <div className="bg-white/10 p-4 rounded-[12px] border border-white/20 text-center min-w-[180px]">
          <div className="text-[11px] font-bold text-white/80">Semester Syllabus Progress</div>
          <div className="text-3xl font-black mt-1 text-white">{overallProgress}%</div>
          <div className="text-[10px] text-white/80 mt-0.5">
            {completedCount} of {totalTopics || 7} Topics Mastered
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-[#4ADE80] h-full rounded-full" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            if (subjects.length > 0) onOpenSubject(subjects[0]);
          }}
          className="p-4 rounded-[12px] bg-white border border-[#E2E8F0] hover:border-[#0F766E] shadow-2xs hover:shadow-xs transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-[#0F172A] group-hover:text-[#0F766E]">
                Classroom LMS
              </div>
              <div className="text-[11px] text-[#64748B]">Units, Notes, Quizzes</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-all" />
        </button>

        <button
          type="button"
          onClick={onOpenAiTutor}
          className="p-4 rounded-[12px] bg-white border border-[#E2E8F0] hover:border-[#D97706] shadow-2xs hover:shadow-xs transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#FFFBEB] text-[#D97706] flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-[#0F172A] group-hover:text-[#D97706]">
                Socratic AI Tutor
              </div>
              <div className="text-[11px] text-[#64748B]">Syllabus-Grounded Help</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#D97706] transition-all" />
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.hash = '#mascots';
          }}
          className="p-4 rounded-[12px] bg-white border border-[#E2E8F0] hover:border-[#7C3AED] shadow-2xs hover:shadow-xs transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-[#0F172A] group-hover:text-[#7C3AED]">
                Class 10 Mascots
              </div>
              <div className="text-[11px] text-[#64748B]">Cheetah, Elephant, Lion</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#7C3AED] transition-all" />
        </button>

        <button
          type="button"
          onClick={onOpenOfflineCenter}
          className="p-4 rounded-[12px] bg-white border border-[#E2E8F0] hover:border-[#2563EB] shadow-2xs hover:shadow-xs transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-[#0F172A] group-hover:text-[#2563EB]">
                Offline Learning
              </div>
              <div className="text-[11px] text-[#64748B]">0-Data Downloaded Notes</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] transition-all" />
        </button>
      </div>

      {/* DYNAMICALLY MATCHED CURRICULUM SUBJECTS (SEMESTER 5) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-[#0F172A]">
              My Semester {profile?.semester || 5} Subjects &amp; Curricula
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Automatically fetched based on your verified department and semester enrollment.
            </p>
          </div>
          <span className="text-xs font-bold text-[#0F766E] bg-[#F0FDFA] px-3 py-1 rounded-full border border-[#99F6E4]">
            {subjects.length} Subjects Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const unitCount = subject.units?.length || 0;
            let subTopics = 0;
            let subCompleted = 0;
            subject.units?.forEach((u) => {
              u.topics?.forEach((t) => {
                subTopics += 1;
                if (completedTopicIds.includes(t.id)) subCompleted += 1;
              });
            });
            const subProgress = subTopics > 0 ? Math.round((subCompleted / subTopics) * 100) : 50;

            return (
              <div
                key={subject.id}
                className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs hover:border-[#0F766E] p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1] font-mono">
                      {subject.code}
                    </span>
                    <span className="text-[11px] font-semibold text-[#64748B]">
                      {subject.credits} Credits
                    </span>
                  </div>

                  <h4 className="font-black text-sm text-[#0F172A] mt-2 line-clamp-1">
                    {subject.name}
                  </h4>
                  <p className="text-xs text-[#475569] mt-1 line-clamp-2">
                    {subject.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B] font-medium">Syllabus Progress</span>
                      <span className="font-extrabold text-[#0F172A]">{subProgress}%</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#0F766E] h-full rounded-full transition-all"
                        style={{ width: `${subProgress}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-[#64748B] flex items-center justify-between">
                      <span>{unitCount} Units</span>
                      <span>{subCompleted}/{subTopics} Topics Mastered</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => onOpenSubject(subject)}
                    className="w-full py-2.5 px-3 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs"
                  >
                    <span>Enter Subject Classroom</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEADLINES & UPCOMING ACADEMIC EVENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Assignments & Quizzes */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D97706]" />
              <span>Pending Academic Submissions</span>
            </h4>
            <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
              Due This Week
            </span>
          </div>

          <div className="p-3 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#0F172A]">
                Assignment 1: CPU Scheduling Simulator
              </span>
              <span className="text-[10px] font-bold text-[#DC2626]">In 5 Days</span>
            </div>
            <p className="text-[11px] text-[#78350F]">
              Operating Systems (CS501) • Max Marks: 20 • PDF / Code link required.
            </p>
          </div>

          <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#0F172A]">
                Unit 1 Mastery Quiz (CPU Scheduling)
              </span>
              <span className="text-[10px] font-bold text-[#16A34A]">Completed 100%</span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Score: 4/4 • Passed with Distinction • Solutions available.
            </p>
          </div>
        </div>

        {/* Live Classes & Important Dates */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              <span>Scheduled Live Sessions &amp; Exams</span>
            </h4>
          </div>

          <div className="p-3 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#1E3A8A] flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Live OS Problem Solving Session</span>
              </span>
              <span className="text-[10px] font-bold text-[#2563EB]">In 2 Days</span>
            </div>
            <p className="text-[11px] text-[#1E40AF]">
              Prof. Anil Kumar • Jitsi Meet Link available in Subject Room • 10:00 AM IST
            </p>
          </div>

          <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#0F172A]">
                Semester 5 Mid-Term Examinations
              </span>
              <span className="text-[10px] font-bold text-[#64748B]">Dec 1, 2026</span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Official hall tickets and syllabus coverage published in Institutional Notices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
