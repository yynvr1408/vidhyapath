// Dedicated LMS Subject Environment (Curriculum Units, Resources, Assignments, Quizzes)
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Video,
  Award,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Download,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Subject, LearningResource, Assignment, Quiz } from '../../types/enterprise';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';

interface SubjectEnvironmentScreenProps {
  subject: Subject;
  onBack: () => void;
  onOpenAiTutor: () => void;
}

export const SubjectEnvironmentScreen: React.FC<SubjectEnvironmentScreenProps> = ({
  subject,
  onBack,
  onOpenAiTutor,
}) => {
  const { user, token } = useEnterpriseAuth();
  const { completedTopicIds, toggleTopicCompletion } = useAcademic();

  const [activeTab, setActiveTab] = useState<'units' | 'materials' | 'assignments' | 'quizzes'>('units');
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedNote, setSelectedNote] = useState<LearningResource | null>(null);

  // Assignment submission state
  const [submissionText, setSubmissionText] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    const fetchSubjectData = async () => {
      try {
        const res = await fetch(`/api/lms/subjects/${subject.id}/overview`);
        if (res.ok) {
          const data = await res.json();
          setResources(data.resources || []);
          setAssignments(data.assignments || []);
          setQuizzes(data.quizzes || []);
        }
      } catch (err) {
        console.warn('Failed to load subject LMS data:', err);
      }
    };
    fetchSubjectData();
  }, [subject.id]);

  const handleAssignmentSubmit = async (assignmentId: string) => {
    if (!submissionText.trim()) return;
    try {
      const res = await fetch(`/api/lms/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contentText: submissionText }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmissionStatus('Assignment submitted successfully! Status: Submitted for Evaluation.');
        setSubmissionText('');
      }
    } catch (err: any) {
      setSubmissionStatus('Submission failed: ' + err.message);
    }
  };

  const handleQuizSubmit = async (quizId: string) => {
    if (!activeQuiz) return;
    const selectedArray = activeQuiz.questions.map((_, idx) => quizAnswers[idx] ?? -1);

    try {
      const res = await fetch(`/api/lms/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ selectedAnswers: selectedArray }),
      });
      const data = await res.json();
      if (data.success) {
        setQuizResult(data);
      }
    } catch (err: any) {
      console.warn('Quiz submission failed:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Navigation & Subject Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0369A1] font-mono">
                {subject.code}
              </span>
              <span className="text-xs text-[#64748B] font-semibold">{subject.credits} Credits</span>
              <span className="text-xs text-[#16A34A] font-bold">• Syllabus Version: {subject.syllabusVersion}</span>
            </div>
            <h2 className="text-xl font-black text-[#0F172A] tracking-tight">{subject.name}</h2>
            <p className="text-xs text-[#475569] mt-1 max-w-2xl">{subject.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAiTutor}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Tutor About This Subject</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] space-x-1">
        {[
          { id: 'units', label: `Curriculum Units (${subject.units?.length || 0})`, icon: <Layers className="w-4 h-4" /> },
          { id: 'materials', label: `Study Notes & Lectures (${resources.length})`, icon: <FileText className="w-4 h-4" /> },
          { id: 'assignments', label: `Assignments (${assignments.length})`, icon: <Award className="w-4 h-4" /> },
          { id: 'quizzes', label: `Mastery Quizzes (${quizzes.length})`, icon: <CheckCircle2 className="w-4 h-4" /> },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedNote(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                active
                  ? 'border-[#0F766E] text-[#0F766E]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CURRICULUM UNITS & TOPICS */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {subject.units?.map((unit) => (
            <div key={unit.id} className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">{unit.title}</h3>
                  <p className="text-xs text-[#475569] mt-0.5">{unit.description}</p>
                </div>
                <span className="text-[10px] font-bold text-[#0F766E] bg-[#F0FDFA] px-2.5 py-1 rounded-full border border-[#99F6E4]">
                  {unit.topics?.length || 0} Topics
                </span>
              </div>

              <div className="space-y-2 pt-2">
                {unit.topics?.map((topic) => {
                  const isDone = completedTopicIds.includes(topic.id);
                  return (
                    <div
                      key={topic.id}
                      className={`p-3 rounded-[8px] border text-xs flex items-start justify-between gap-3 transition-all ${
                        isDone ? 'bg-[#F0FDFA] border-[#99F6E4]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0F172A]">
                            Topic {topic.topicNumber}: {topic.title}
                          </span>
                        </div>
                        <p className="text-[#475569] text-[11px]">{topic.description}</p>
                        {topic.learningOutcomes && (
                          <div className="text-[10px] text-[#0F766E] font-medium">
                            Outcomes: {topic.learningOutcomes.join(' • ')}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleTopicCompletion(topic.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-all shrink-0 active:scale-95 ${
                          isDone
                            ? 'bg-[#0F766E] text-white shadow-xs'
                            : 'bg-white border border-[#CBD5E1] text-[#475569] hover:border-[#0F766E]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: STUDY NOTES, HANDOUTS & LIVE LECTURES */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {selectedNote ? (
            <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-6 space-y-4">
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="text-xs font-bold text-[#0F766E] hover:underline"
              >
                &larr; Back to Resource List
              </button>
              <div>
                <h3 className="font-black text-base text-[#0F172A]">{selectedNote.title}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">By {selectedNote.teacherName}</p>
              </div>
              <div className="bg-[#F8FAFC] p-4 rounded-[8px] border border-[#E2E8F0] text-xs font-mono whitespace-pre-wrap text-[#0F172A]">
                {selectedNote.contentText}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((res) => (
                <div key={res.id} className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE9FE] text-[#6D28D9] uppercase font-mono">
                        {res.resourceType.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-[#64748B]">Instructor: {res.teacherName}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#0F172A]">{res.title}</h4>
                    <p className="text-xs text-[#475569] mt-1">{res.description}</p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0]">
                    {res.resourceType === 'note' && (
                      <button
                        type="button"
                        onClick={() => setSelectedNote(res)}
                        className="w-full py-2 px-3 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Read Study Notes</span>
                      </button>
                    )}

                    {res.resourceType === 'live_class' && (
                      <a
                        href={res.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Live Session (Video Call)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {res.resourceType === 'pdf' && (
                      <button
                        type="button"
                        onClick={() => alert(`Downloading verified PDF: ${res.title}`)}
                        className="w-full py-2 px-3 rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-[#0F766E]" />
                        <span>Download Handout PDF</span>
                      </button>
                    )}

                    {res.resourceType === 'recorded_lecture' && (
                      <a
                        href={res.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-[8px] bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Watch Recorded Lecture ({res.durationMins || 20}m)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {submissionStatus && (
            <div className="p-3 bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] rounded-[8px] text-xs font-bold">
              {submissionStatus}
            </div>
          )}

          {assignments.map((assign) => (
            <div key={assign.id} className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-[#0F172A]">{assign.title}</h4>
                  <p className="text-xs text-[#475569] mt-0.5">{assign.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-2.5 py-1 rounded-full">
                    Max Marks: {assign.maxMarks}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0] text-xs text-[#475569]">
                <span className="font-bold text-[#0F172A]">Instructions:</span> {assign.instructions}
              </div>

              <div className="pt-2 space-y-2">
                <label className="block text-xs font-bold text-[#475569]">
                  Submit Your Solution (Text, Code Repository, or PDF Link):
                </label>
                <textarea
                  rows={3}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Paste your solution details, calculations, or submission link..."
                  className="w-full text-xs p-3 rounded-[8px] border border-[#CBD5E1] focus:outline-hidden focus:border-[#0F766E]"
                />
                <button
                  type="button"
                  onClick={() => handleAssignmentSubmit(assign.id)}
                  className="px-4 py-2 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
                >
                  Submit Assignment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          {activeQuiz ? (
            <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="font-black text-base text-[#0F172A]">{activeQuiz.title}</h3>
                  <p className="text-xs text-[#64748B]">Time Limit: {activeQuiz.timeLimitMinutes} Minutes • Pass Mark: {activeQuiz.passPercentage}%</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveQuiz(null);
                    setQuizResult(null);
                  }}
                  className="text-xs font-bold text-[#64748B] hover:text-[#0F172A]"
                >
                  Exit Quiz
                </button>
              </div>

              {quizResult && (
                <div
                  className={`p-4 rounded-[10px] border text-xs ${
                    quizResult.passed
                      ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]'
                      : 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]'
                  }`}
                >
                  <div className="font-extrabold text-sm">
                    {quizResult.passed ? '🎉 Congratulations! You Passed!' : 'Review Recommended'}
                  </div>
                  <div className="mt-1">
                    Score: <span className="font-bold">{quizResult.score} / {quizResult.totalQuestions}</span> ({quizResult.percentage}%)
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {activeQuiz.questions.map((q, idx) => {
                  const feedback = quizResult?.questionsFeedback?.[idx];
                  return (
                    <div key={q.id} className="p-4 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                      <div className="font-bold text-[#0F172A]">
                        Question {idx + 1}: {q.text}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const selected = quizAnswers[idx] === optIdx;
                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2 rounded-[6px] border cursor-pointer transition-all ${
                                selected
                                  ? 'bg-[#F0FDFA] border-[#0F766E] text-[#0F766E] font-bold'
                                  : 'bg-white border-[#CBD5E1] text-[#475569]'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${idx}`}
                                checked={selected}
                                onChange={() => setQuizAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                                className="accent-[#0F766E]"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      {feedback && (
                        <div className="pt-2 text-[11px] text-[#475569] bg-white p-2.5 rounded-[6px] border border-[#E2E8F0]">
                          <span className="font-bold text-[#0F766E]">Explanation:</span> {feedback.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizResult && (
                <button
                  type="button"
                  onClick={() => handleQuizSubmit(activeQuiz.id)}
                  className="w-full py-2.5 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Submit Quiz for Automatic Grading
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#0F172A]">{quiz.title}</h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      {quiz.questions?.length || 4} Multiple Choice Questions • {quiz.timeLimitMinutes} Mins
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveQuiz(quiz);
                      setQuizAnswers({});
                      setQuizResult(null);
                    }}
                    className="w-full py-2 px-3 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95"
                  >
                    Start Assessment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
