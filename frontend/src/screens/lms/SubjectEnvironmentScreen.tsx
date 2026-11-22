// Dedicated LMS Subject Learning Workspace (Curriculum Units, Notes & Media, Assignments, Quizzes)
// Elevated with exact Material Design tokens, interactive segmented tabs, offline toggle, and Socratic help dock
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
  ChevronDown,
  ChevronUp,
  Play,
  Lock,
  CloudSync,
  Radio,
  Check,
  ArrowRight,
  DownloadCloud,
} from 'lucide-react';
import { Subject, LearningResource, Assignment, Quiz } from '../../types/enterprise';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';

interface SubjectEnvironmentScreenProps {
  subject: Subject;
  onBack: () => void;
  onOpenAiTutor: (query?: string) => void;
}

export const SubjectEnvironmentScreen: React.FC<SubjectEnvironmentScreenProps> = ({
  subject,
  onBack,
  onOpenAiTutor,
}) => {
  const { user, token } = useEnterpriseAuth();
  const { completedTopicIds, toggleTopicCompletion } = useAcademic();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'notes' | 'assignments' | 'quizzes'>('curriculum');
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedNote, setSelectedNote] = useState<LearningResource | null>(null);

  // Unit expand/collapse state
  const [unit1Expanded, setUnit1Expanded] = useState(false);
  const [unit2Expanded, setUnit2Expanded] = useState(true);
  const [keepUnit2Offline, setKeepUnit2Offline] = useState(true);

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
        setSubmissionStatus('Assignment submitted successfully! Your instructor will verify your submission.');
        setSubmissionText('');
      } else {
        setSubmissionStatus(data.error || 'Submission failed');
      }
    } catch (err: any) {
      setSubmissionStatus(err.message || 'Submission error');
    }
  };

  const handleQuizSubmit = async (quizId: string) => {
    try {
      const formattedAnswers = Object.entries(quizAnswers).map(([qIdx, optIdx]) => ({
        questionId: activeQuiz?.questions?.[parseInt(qIdx)]?.id || `q_${qIdx}`,
        selectedOptionIndex: optIdx,
      }));

      const res = await fetch(`/api/lms/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });
      const data = await res.json();
      if (data.success) {
        setQuizResult(data);
      }
    } catch (err) {
      console.error('Quiz submit failed:', err);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto space-y-4 pb-24 animate-fadeIn relative">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005c55] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Subjects List</span>
        </button>
        <span className="text-xs font-bold text-[#3e4947]">{subject.code} Workspace</span>
      </div>

      {/* 1. Header Card: Subject Overview & Mastery */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#CBD5E1]/60 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#80d5cb]/40 text-[#00504a] text-[10px] font-black uppercase tracking-wider">
                {subject.code || 'MATH-101'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#3e4947] text-[10px] font-bold">
                CBSE • Dual Lang
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#131b2e] truncate">
              {subject.name || 'Mathematics • Grade 10'}
            </h1>
            <p className="text-xs text-[#3e4947] font-medium mt-0.5">
              Academic Track 2024–25 • Term 1 Core
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-[#80d5cb]/30 flex items-center justify-center text-[#005c55] shrink-0 font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Progress Gauge & Quick Stats */}
        <div className="mt-4 pt-3.5 bg-[#f2f3ff]/70 rounded-xl p-3 sm:p-4 border border-[#dae2fd]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-[#131b2e]">Syllabus Completion</span>
              <span className="text-xs text-[#005c55] font-black">78%</span>
            </div>
            <span className="text-[11px] font-bold text-[#3e4947]">22 of 28 Topics Mastered</span>
          </div>
          <div className="w-full bg-[#dae2fd] rounded-full h-2 overflow-hidden">
            <div className="bg-[#005c55] h-2 rounded-full transition-all duration-500" style={{ width: '78%' }} />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="p-2 bg-white rounded-xl shadow-2xs border border-[#CBD5E1]/40">
              <span className="block font-black text-sm sm:text-base text-[#131b2e]">6</span>
              <span className="text-[10px] font-bold text-[#3e4947] uppercase">Units</span>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-2xs border border-[#CBD5E1]/40">
              <span className="block font-black text-sm sm:text-base text-[#131b2e]">28</span>
              <span className="text-[10px] font-bold text-[#3e4947] uppercase">Topics</span>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-2xs border border-[#CBD5E1]/40 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-[#904d00] font-black text-sm sm:text-base">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4</span>
              </div>
              <span className="text-[10px] font-bold text-[#3e4947] uppercase">Saved Offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Segmented Navigation Tabs */}
      <div className="flex space-x-2 overflow-x-auto scrollbar-none py-1">
        <button
          type="button"
          onClick={() => setActiveTab('curriculum')}
          className={`h-10 px-4 rounded-full font-bold text-xs whitespace-nowrap shadow-2xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'curriculum'
              ? 'bg-[#005c55] text-white shadow-sm'
              : 'bg-[#f2f3ff] text-[#3e4947] hover:bg-[#eaedff]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Curriculum &amp; Topics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`h-10 px-4 rounded-full font-bold text-xs whitespace-nowrap shadow-2xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-[#005c55] text-white shadow-sm'
              : 'bg-[#f2f3ff] text-[#3e4947] hover:bg-[#eaedff]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notes &amp; Media ({resources.length || 8})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`h-10 px-4 rounded-full font-bold text-xs whitespace-nowrap shadow-2xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'assignments'
              ? 'bg-[#005c55] text-white shadow-sm'
              : 'bg-[#f2f3ff] text-[#3e4947] hover:bg-[#eaedff]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Assignments ({assignments.length || 3})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quizzes')}
          className={`h-10 px-4 rounded-full font-bold text-xs whitespace-nowrap shadow-2xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'quizzes'
              ? 'bg-[#005c55] text-white shadow-sm'
              : 'bg-[#f2f3ff] text-[#3e4947] hover:bg-[#eaedff]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Quizzes ({quizzes.length || 4})</span>
        </button>
      </div>

      {/* 3. Multilingual Voice-Ready Banner */}
      <div className="bg-[#f2f3ff] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 border border-[#dae2fd]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#dae2fd] flex items-center justify-center text-[#005c55] shrink-0 font-bold">
            <Radio className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-[#131b2e] truncate">
              Audio Lessons in Telugu &amp; Hindi Available
            </div>
            <p className="text-[11px] text-[#3e4947] truncate">Switch language from top bar anytime</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#ffdcc3] text-[#6e3900] text-[10px] font-black uppercase shrink-0">
          Voice Active
        </span>
      </div>

      {/* TAB 1: CURRICULUM & TOPICS */}
      {activeTab === 'curriculum' && (
        <div className="space-y-3.5">
          {/* Unit 1: Real Numbers & Polynomials (Completed 100%) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#CBD5E1]/60">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#80d5cb]/40 flex items-center justify-center text-[#005c55] shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#005c55] uppercase font-black tracking-wider">
                      Unit 1 • 100%
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#f2f3ff] text-[#3e4947] text-[10px] font-bold">
                      5/5 Topics
                    </span>
                  </div>
                  <h2 className="font-black text-sm sm:text-base text-[#131b2e] mt-0.5">
                    Real Numbers &amp; Polynomials
                  </h2>
                  <p className="text-xs text-[#3e4947] font-medium">
                    Euclid's algorithm, fundamental theorem of arithmetic
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUnit1Expanded(!unit1Expanded)}
                aria-label="Toggle Unit 1 details"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#3e4947] hover:bg-[#f2f3ff] shrink-0 cursor-pointer"
              >
                {unit1Expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Footer Action & Offline Stored Indicator */}
            <div className="mt-3 pt-2.5 flex items-center justify-between bg-[#f2f3ff]/60 px-3.5 py-2 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-[#005c55] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cached on Device (42 MB)</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenAiTutor('Practice flashcards on Real Numbers & Euclid lemma')}
                className="font-bold text-[#904d00] hover:underline cursor-pointer"
              >
                Review Flashcards
              </button>
            </div>
          </div>

          {/* Unit 2: Linear & Quadratic Equations (In Progress & Active) */}
          <div className="bg-white rounded-2xl shadow-xs p-4 sm:p-5 border-2 border-[#005c55]/40 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#ffdcc3] flex items-center justify-center text-[#904d00] shrink-0 mt-0.5 font-bold text-xs">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#904d00] font-black tracking-wider uppercase">
                      Unit 2 • In Progress
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#f2f3ff] text-[#3e4947] text-[10px] font-bold">
                      3 of 4 Done
                    </span>
                  </div>
                  <h2 className="font-black text-sm sm:text-base text-[#131b2e] mt-0.5">
                    Linear &amp; Quadratic Equations
                  </h2>
                  <p className="text-xs text-[#3e4947] font-medium">
                    Methods of solving, discriminant, word problems
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUnit2Expanded(!unit2Expanded)}
                aria-label="Collapse Unit 2"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#131b2e] shrink-0 hover:bg-[#f2f3ff] cursor-pointer"
              >
                {unit2Expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {/* Unit Offline Toggle Bar */}
            <div className="flex items-center justify-between p-3 bg-[#f2f3ff] rounded-xl text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <CloudSync className="w-5 h-5 text-[#904d00] shrink-0" />
                <div className="min-w-0">
                  <span className="font-extrabold text-[#131b2e] block truncate">Keep Unit Offline</span>
                  <span className="text-[11px] text-[#3e4947] font-medium block">
                    38.4 MB of 52 MB downloaded
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={keepUnit2Offline}
                  onChange={(e) => setKeepUnit2Offline(e.target.checked)}
                  className="w-5 h-5 accent-[#005c55] rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Topics Breakdown (Hierarchy Level 2) */}
            {unit2Expanded && (
              <div className="space-y-2.5 pt-1">
                {/* Topic 2.1 */}
                <div className="bg-[#f2f3ff]/70 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#80d5cb]/40 flex items-center justify-center text-[#005c55] shrink-0 font-bold text-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#131b2e] truncate block">Topic 2.1: Standard Form</span>
                      <span className="text-[10px] text-[#3e4947] block">Interactive Module • 8 min read</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[#3e4947] text-[10px] font-black shrink-0">
                    Done
                  </span>
                </div>

                {/* Topic 2.2 */}
                <div className="bg-[#f2f3ff]/70 rounded-xl p-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#80d5cb]/40 flex items-center justify-center text-[#005c55] shrink-0 mt-0.5 font-bold text-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#131b2e] block">Topic 2.2: Quadratic Formula</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-[#005c55]">
                        <span className="inline-flex items-center gap-1">
                          <Video className="w-3 h-3" /> 12m Video
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#3e4947]">
                          <FileText className="w-3 h-3" /> PDF Notes
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[#3e4947] text-[10px] font-black shrink-0">
                    Done
                  </span>
                </div>

                {/* Topic 2.3: In-Progress / Urgent Target with Direct Actions */}
                <div className="bg-white rounded-xl p-3.5 shadow-xs border border-[#CBD5E1]/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#ffdcc3] flex items-center justify-center text-[#904d00] shrink-0 mt-0.5">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-[#131b2e]">Topic 2.3: Word Problems</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[10px] font-black uppercase">
                            Next Up
                          </span>
                        </div>
                        <p className="text-[11px] text-[#3e4947] mt-0.5">
                          Speed, time, age, and geometric word formulations
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Embedded Media Snapshot */}
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[#eaedff]">
                    <img
                      className="w-full h-full object-cover"
                      alt="Student workspace with chalkboard equations"
                      src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onOpenAiTutor('Explain quadratic word problems with step-by-step video breakdown')}
                        aria-label="Play video lesson"
                        className="w-12 h-12 rounded-full bg-[#005c55] hover:bg-[#0f766e] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                      16:40 mins
                    </span>
                  </div>

                  {/* Action Buttons Matrix */}
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenAiTutor('How to set up equations for quadratic word problems')}
                        className="flex-1 h-10 px-3 rounded-xl bg-[#005c55] hover:bg-[#0f766e] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Study with AI Tutor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('quizzes')}
                        className="h-10 px-4 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4 text-[#904d00]" />
                        <span>Practice Quiz</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert('Topic 2.3 downloaded to local offline storage (18.2 MB)')}
                      className="w-full h-9 px-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#3e4947] text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <DownloadCloud className="w-4 h-4 text-[#005c55]" />
                        <span>Download Topic for Offline</span>
                      </span>
                      <span className="text-[10px] font-bold text-[#6e7977]">18.2 MB</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Unit 3: Locked / Upcoming */}
          <div className="bg-[#f2f3ff] rounded-2xl p-4 sm:p-5 opacity-80 border border-[#dae2fd]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#dae2fd] flex items-center justify-center text-[#6e7977] shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#6e7977] uppercase font-bold">Unit 3 • Locked</span>
                    <span className="text-[10px] text-[#6e7977] font-medium">Starts Oct 14</span>
                  </div>
                  <h2 className="font-extrabold text-sm sm:text-base text-[#131b2e] mt-0.5">
                    Arithmetic Progressions
                  </h2>
                  <p className="text-xs text-[#3e4947]">General terms, sum of n-terms, pattern recognition</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white text-[#3e4947] text-[10px] font-bold shrink-0">
                4 Topics
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOTES & MEDIA */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {resources.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-[#CBD5E1]/60 shadow-xs p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f2f3ff] text-[#005c55] uppercase">
                      {res.resourceType.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-[#3e4947]">Verified</span>
                  </div>
                  <h4 className="font-black text-sm text-[#131b2e] line-clamp-1">{res.title}</h4>
                  <p className="text-xs text-[#3e4947] mt-1 line-clamp-2 leading-relaxed">
                    {res.description || 'Verified course handouts and lecture annotations.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#f2f3ff] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedNote(res)}
                    className="text-xs font-bold text-[#005c55] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Notes</span>
                  </button>
                  {(res.fileUrl || res.videoUrl) && (
                    <a
                      href={res.fileUrl || res.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#3e4947] hover:text-[#131b2e] flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedNote && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <h3 className="font-black text-base text-[#131b2e]">{selectedNote.title}</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedNote(null)}
                    className="p-1 rounded-lg text-[#6e7977] hover:bg-[#f2f3ff] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs leading-relaxed text-[#3e4947] space-y-2 whitespace-pre-wrap">
                  {selectedNote.contentText || 'No preview available. You may download this resource directly.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-2xl border border-[#CBD5E1]/60 shadow-xs p-5 space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-base text-[#131b2e]">{assignment.title}</h4>
                  <p className="text-xs text-[#3e4947] mt-1 leading-relaxed">{assignment.description}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#ffdcc3] text-[#6e3900] text-[10px] font-black uppercase">
                  Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Soon'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#f2f3ff] space-y-2">
                <textarea
                  rows={3}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your assignment solution or problem formulation..."
                  className="w-full text-xs p-3 rounded-xl bg-[#f2f3ff] border border-[#dae2fd] focus:outline-hidden font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleAssignmentSubmit(assignment.id)}
                  className="py-2.5 px-4 rounded-xl bg-[#005c55] hover:bg-[#0f766e] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Submit Solution
                </button>
              </div>
            </div>
          ))}

          {submissionStatus && (
            <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-xs font-bold text-[#15803D] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submissionStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          {activeQuiz ? (
            <div className="bg-white rounded-2xl border border-[#CBD5E1]/60 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="font-black text-base text-[#131b2e]">{activeQuiz.title}</h3>
                  <p className="text-xs text-[#3e4947]">
                    Time Limit: {activeQuiz.timeLimitMinutes} Mins • Pass Mark: {activeQuiz.passPercentage}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveQuiz(null);
                    setQuizResult(null);
                  }}
                  className="text-xs font-bold text-[#6e7977] hover:text-[#131b2e] cursor-pointer"
                >
                  Exit Quiz
                </button>
              </div>

              {quizResult && (
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    quizResult.passed
                      ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]'
                      : 'bg-[#ffdad6] border-[#fecaca] text-[#ba1a1a]'
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

              <div className="space-y-3.5">
                {activeQuiz.questions.map((q, idx) => {
                  const feedback = quizResult?.questionsFeedback?.[idx];
                  return (
                    <div key={q.id} className="p-4 rounded-xl bg-[#f2f3ff] border border-[#dae2fd] space-y-2 text-xs">
                      <div className="font-bold text-[#131b2e]">
                        Question {idx + 1}: {q.text}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const selected = quizAnswers[idx] === optIdx;
                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                                selected
                                  ? 'bg-[#80d5cb]/30 border-[#005c55] text-[#005c55] font-bold'
                                  : 'bg-white border-[#CBD5E1] text-[#3e4947]'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${idx}`}
                                checked={selected}
                                onChange={() => setQuizAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                                className="accent-[#005c55]"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      {feedback && (
                        <div className="pt-2 text-[11px] text-[#3e4947] bg-white p-2.5 rounded-lg border border-[#dae2fd]">
                          <span className="font-bold text-[#005c55]">Explanation:</span> {feedback.explanation}
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
                  className="w-full py-3 rounded-xl bg-[#005c55] hover:bg-[#0f766e] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Submit Quiz for Automatic Grading
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-2xl border border-[#CBD5E1]/60 shadow-xs p-5 space-y-3">
                  <div>
                    <h4 className="font-black text-sm text-[#131b2e]">{quiz.title}</h4>
                    <p className="text-xs text-[#3e4947] mt-1">
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
                    className="w-full py-2.5 px-3 rounded-xl bg-[#005c55] hover:bg-[#0f766e] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    Start Assessment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Fast Socratic Help Floating Docked CTA */}
      <div className="fixed bottom-6 left-4 right-4 z-30 max-w-md mx-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-[#CBD5E1]/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#904d00] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs text-[#131b2e] block truncate">Stuck on Unit 2?</span>
              <span className="text-[11px] text-[#3e4947] block truncate">Ask Socratic AI in Hindi, Telugu or English</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenAiTutor('I am working on Unit 2 Linear & Quadratic Equations and need a Socratic hint')}
            className="h-10 px-4 rounded-xl bg-[#904d00] hover:bg-[#6e3900] text-white font-extrabold text-xs whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
          >
            <span>Ask AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
