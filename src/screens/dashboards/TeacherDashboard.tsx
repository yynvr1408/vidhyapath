// Faculty / Teacher Teaching Hub & Classroom Manager (Level 4)
import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Award,
  Video,
  FileText,
  Plus,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { Subject } from '../../types/enterprise';

interface TeacherDashboardProps {
  onOpenSubject: (subject: Subject) => void;
  onOpenAiTutor: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onOpenSubject, onOpenAiTutor }) => {
  const { user, token } = useEnterpriseAuth();
  const { subjects } = useAcademic();

  const [addResourceModal, setAddResourceModal] = useState(false);
  const [sampleGraded, setSampleGraded] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<'note' | 'pdf' | 'recorded_lecture' | 'live_class'>('note');
  const [resContent, setResContent] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle) return;

    try {
      const targetSub = subjects[0]?.id || 'subj_cs501';
      const res = await fetch(`/api/lms/subjects/${targetSub}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: resTitle,
          resourceType: resType,
          contentText: resType === 'note' ? resContent : undefined,
          fileUrl: resType === 'pdf' ? resUrl : undefined,
          videoUrl: resType === 'recorded_lecture' ? resUrl : undefined,
          meetingUrl: resType === 'live_class' ? resUrl : undefined,
          scheduledAt: resType === 'live_class' ? Date.now() + 24 * 3600 * 1000 : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionNotice(`New learning resource "${resTitle}" published to classroom!`);
        setResTitle('');
        setResContent('');
        setResUrl('');
        setAddResourceModal(false);
      }
    } catch (err: any) {
      setActionNotice('Failed to publish resource: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D] mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Faculty Management • Level 4 Teacher</span>
          </div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            Welcome, {user?.fullName || 'Prof. Anil Kumar'}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Associate Professor • Department of Computer Science &amp; Engineering
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddResourceModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Classroom Material</span>
          </button>
          <button
            type="button"
            onClick={onOpenAiTutor}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-bold text-[#0F172A] transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <span>AI Teaching Assistant</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#86EFAC] rounded-[10px] text-xs font-bold text-[#166534] flex items-center justify-between">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-[#166534] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Assigned Subjects</div>
          <div className="text-lg font-black text-[#0F766E] mt-1">2 Subjects</div>
          <div className="text-[10px] text-[#475569] font-medium mt-1">Operating Systems, Networks</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Enrolled Students</div>
          <div className="text-lg font-black text-[#2563EB] mt-1">124 Students</div>
          <div className="text-[10px] text-[#475569] font-medium mt-1">B.Tech Semester 5</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Assignment Submissions</div>
          <div className="text-lg font-black text-[#D97706] mt-1">38 Submissions</div>
          <div className="text-[10px] text-[#B45309] font-medium mt-1">Ready for grading</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Class Average Mastery</div>
          <div className="text-lg font-black text-[#16A34A] mt-1">82.4%</div>
          <div className="text-[10px] text-[#16A34A] font-bold mt-1">+14% over baseline</div>
        </div>
      </div>

      {/* ASSIGNED SUBJECTS & CLASSROOMS */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0F766E]" />
          <span>My Assigned Subjects &amp; Teaching Rooms</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((s) => (
            <div key={s.id} className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs bg-[#E0F2FE] text-[#0369A1] px-2.5 py-0.5 rounded-full">
                  {s.code}
                </span>
                <span className="text-xs text-[#64748B] font-semibold">{s.credits} Credits</span>
              </div>

              <div>
                <h4 className="font-black text-sm text-[#0F172A]">{s.name}</h4>
                <p className="text-xs text-[#475569] mt-0.5">{s.description}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#E2E8F0] text-xs">
                <span className="text-[#64748B]">{s.units?.length || 0} Units • 124 Enrolled</span>
                <button
                  type="button"
                  onClick={() => onOpenSubject(s)}
                  className="px-3 py-1.5 rounded-[6px] bg-[#0F766E] text-white font-bold flex items-center gap-1 active:scale-95"
                >
                  <span>Manage Classroom</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT STUDENT SUBMISSIONS READY FOR GRADING */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D97706]" />
            <span>Recent Student Assignment Submissions</span>
          </h4>
          <span className="text-xs text-[#0F766E] font-bold">1 New Submission</span>
        </div>

        <div className="p-3.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-extrabold text-[#0F172A]">Aditya Verma (23CS042)</div>
            <div className="text-[11px] text-[#475569] mt-0.5">
              Assignment 1: CPU Scheduling Simulator &amp; Gantt Charts
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">
              Submitted: Yesterday at 4:15 PM • Status: Submitted
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sampleGraded ? (
              <span className="px-3 py-1.5 rounded-[6px] bg-[#DCFCE7] text-[#15803D] font-bold text-xs border border-[#86EFAC]">
                ✓ Graded (19/20) · Synced
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch('/api/lms/assignments/asgn_sample/grade', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ submissionId: 'sub_sample', marksObtained: 19, feedback: 'Excellent accuracy!' }),
                    });
                  } catch (_) {}
                  setSampleGraded(true);
                }}
                className="px-3.5 py-1.5 rounded-[6px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                Grade (19/20)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ADD RESOURCE MODAL */}
      {addResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[12px] border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-extrabold text-base text-[#0F172A]">Add Learning Resource</h3>
              <button
                type="button"
                onClick={() => setAddResourceModal(false)}
                className="text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Resource Type</label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1] bg-white font-bold"
                >
                  <option value="note">Study Note / Written Handout</option>
                  <option value="pdf">Official PDF Handout Link</option>
                  <option value="recorded_lecture">Recorded Video Lecture Link</option>
                  <option value="live_class">Live Classroom Meeting URL (Jitsi / Meet)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder="e.g. Memory Management Lecture Notes"
                  className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1]"
                />
              </div>

              {resType === 'note' ? (
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Notes Content (Markdown/Text)</label>
                  <textarea
                    rows={4}
                    value={resContent}
                    onChange={(e) => setResContent(e.target.value)}
                    placeholder="Enter key concepts, equations, and worked examples..."
                    className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">URL / Link</label>
                  <input
                    type="url"
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    placeholder={resType === 'live_class' ? 'https://meet.jit.si/MyClassRoom' : 'https://...'}
                    className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1]"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddResourceModal(false)}
                  className="px-4 py-2 rounded-[8px] border border-[#CBD5E1] text-xs font-bold text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
