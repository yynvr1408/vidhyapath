// Assignments & Quizzes Management Hub Screen (Teacher & Student Views)
import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ArrowLeft,
  RefreshCw,
  FileText,
  User,
  X,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Assignment, AssignmentSubmission } from '../../types/enterprise';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';

interface AssignmentsHubScreenProps {
  onBack?: () => void;
}

export const AssignmentsHubScreen: React.FC<AssignmentsHubScreenProps> = ({ onBack }) => {
  const { user, activeRole, token } = useEnterpriseAuth();
  const { subjects } = useAcademic();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loadingAssignmentSubmissions, setLoadingAssignmentSubmissions] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState(20);
  const [newInstructions, setNewInstructions] = useState('');
  const [creating, setCreating] = useState(false);

  // Grade AssignmentSubmission Modal (Replaces alert)
  const [gradingSub, setGradingSub] = useState<AssignmentSubmission | null>(null);
  const [marksInput, setMarksInput] = useState<number>(18);
  const [feedbackInput, setFeedbackInput] = useState('Well presented calculations and accurate steps.');
  const [grading, setGrading] = useState(false);

  const isInstructor = ['teacher', 'academic_admin', 'institution_admin', 'super_admin'].includes(activeRole);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lms/assignments');
      if (res.ok) {
        setAssignments(await res.json());
      }
    } catch (err) {
      console.warn('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    if (subjects.length > 0 && !newSubjectId) {
      setNewSubjectId(subjects[0].id);
    }
  }, [subjects]);

  const handleOpenAssignmentSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setLoadingAssignmentSubmissions(true);
    try {
      const res = await fetch(`/api/lms/assignments/${assignment.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignmentSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.warn('Failed to load submissions:', err);
    } finally {
      setLoadingAssignmentSubmissions(false);
    }
  };

  const handleGradeAssignmentSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub || !selectedAssignment) return;
    setGrading(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/lms/assignments/${selectedAssignment.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submissionId: gradingSub.id,
          marksObtained: marksInput,
          feedback: feedbackInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Graded submission ${marksInput}/${selectedAssignment.maxMarks}. Student notified.`);
        setGradingSub(null);
        // Refresh submissions
        await handleOpenAssignmentSubmissions(selectedAssignment);
        await fetchAssignments();
      } else {
        setStatusMessage(data.error || 'Failed to grade submission');
      }
    } catch (err: any) {
      setStatusMessage('Error submitting grade: ' + err.message);
    } finally {
      setGrading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/lms/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: newSubjectId || subjects[0]?.id || 'sub_general',
          title: newTitle,
          instructions: newInstructions,
          maxMarks: newMaxMarks,
          dueDate: Date.now() + 7 * 86400000,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Assignment "${newTitle}" published successfully!`);
        setShowCreateModal(false);
        setNewTitle('');
        setNewInstructions('');
        await fetchAssignments();
      } else {
        setStatusMessage(data.error || 'Failed to create assignment');
      }
    } catch (err: any) {
      setStatusMessage('Error creating assignment: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
              <Award className="w-6 h-6 text-[#0F766E]" />
              Assignments & Assessments Hub
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              {isInstructor
                ? 'Create coursework, grade student homework, and provide pedagogical feedback.'
                : 'Track your assigned homework, submit solutions, and review teacher remarks.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchAssignments}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#0F766E] hover:bg-[#F0FDFA] active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isInstructor && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold active:scale-95 transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#0F766E]/40 text-xs font-bold text-[#0F766E] flex items-center justify-between animate-fadeIn">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Assignment List */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-[#64748B]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
          <Award className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-60" />
          <h3 className="font-extrabold text-sm text-[#0F172A]">No assignments published yet</h3>
          <p className="text-xs text-[#64748B] mt-1">
            {isInstructor
              ? 'Click "Create Assignment" to post coursework for your class.'
              : 'Your teachers have not posted any active assignments.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between gap-4 hover:border-[#0F766E]/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded-md border border-[#0F766E]/20">
                      Max Marks: {assignment.maxMarks}
                    </span>
                    <h3 className="font-extrabold text-base text-[#0F172A] mt-1.5 leading-snug">
                      {assignment.title}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#64748B] flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                </div>

                {assignment.instructions && (
                  <p className="text-xs text-[#475569] mt-2 line-clamp-2 leading-relaxed">
                    {assignment.instructions}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-[#64748B]">
                  <User className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>By: <strong>{assignment.teacherName || 'Faculty Instructor'}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-xs font-bold text-[#475569]">
                  AssignmentSubmissions: <strong className="text-[#0F766E]">{assignment.submissionsCount || 0}</strong>
                </span>

                {isInstructor ? (
                  <button
                    type="button"
                    onClick={() => handleOpenAssignmentSubmissions(assignment)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] font-bold text-xs border border-[#0F766E]/30 transition-all flex items-center gap-1"
                  >
                    <span>Review & Grade</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F1F5F9] text-[#64748B]">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review AssignmentSubmissions Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-extrabold text-base text-[#0F172A]">
                  AssignmentSubmissions: {selectedAssignment.title}
                </h3>
                <span className="text-xs text-[#64748B]">
                  Max Marks: {selectedAssignment.maxMarks}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingAssignmentSubmissions ? (
                <div className="py-8 text-center text-xs font-bold text-[#64748B]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0F766E]" />
                  Loading submissions...
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  No students have submitted this assignment yet.
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#0F172A]">
                        {sub.studentName} <span className="font-mono text-xs text-[#64748B]">({(sub as any).rollNumber || sub.studentId || '23CS042'})</span>
                      </div>
                      <div className="text-[11px] text-[#475569] mt-0.5">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </div>
                      {sub.status === 'graded' ? (
                        <div className="mt-1 text-xs text-[#16A34A] font-bold">
                          ✓ Graded: {sub.marksObtained}/{selectedAssignment.maxMarks} Marks · "{sub.feedback}"
                        </div>
                      ) : (
                        <span className="inline-block mt-1 text-[10px] font-black uppercase text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                          Pending Grade
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setGradingSub(sub);
                        setMarksInput(sub.marksObtained || selectedAssignment.maxMarks - 2);
                        setFeedbackInput(sub.feedback || 'Accurate step-by-step solution.');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs shadow-2xs active:scale-95 transition-all self-start sm:self-auto"
                    >
                      {sub.status === 'graded' ? 'Update Grade' : 'Grade AssignmentSubmission'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#475569]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal (Replaces alert) */}
      {gradingSub && selectedAssignment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-extrabold text-base text-[#0F172A]">
                Grade AssignmentSubmission: {gradingSub.studentName}
              </h3>
              <button
                type="button"
                onClick={() => setGradingSub(null)}
                className="text-xs text-[#64748B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeAssignmentSubmission} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Marks Awarded (out of {selectedAssignment.maxMarks}):
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedAssignment.maxMarks}
                  required
                  value={marksInput}
                  onChange={(e) => setMarksInput(Number(e.target.value))}
                  className="w-full text-sm p-2.5 rounded-xl border border-[#CBD5E1] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Qualitative Feedback & Remarks:
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Provide constructive feedback for the student..."
                  className="w-full text-xs p-3 rounded-xl border border-[#CBD5E1] font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grading}
                  className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all"
                >
                  {grading ? 'Saving...' : 'Submit Grade & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-extrabold text-base text-[#0F172A]">Create New Course Assignment</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-[#64748B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Subject</label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-white font-bold"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                  {subjects.length === 0 && <option value="sub_maths">Class 10 Mathematics</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Euclid Lemma & Real Numbers Problem Set"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Max Marks</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  required
                  value={newMaxMarks}
                  onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Specify problem numbers, formatting rules, or references..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-2xs"
                >
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
