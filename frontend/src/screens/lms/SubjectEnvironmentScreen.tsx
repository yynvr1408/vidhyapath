import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, FileText, HelpCircle, Send } from 'lucide-react';
import type { Assignment, LearningResource, Quiz, Subject } from '../../types/enterprise';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';

interface SubjectEnvironmentScreenProps {
  subject: Subject;
  onBack: () => void;
  onOpenAiTutor: (query?: string) => void;
}

type SubjectOverview = { resources: LearningResource[]; assignments: Assignment[]; quizzes: Quiz[] };

export const SubjectEnvironmentScreen: React.FC<SubjectEnvironmentScreenProps> = ({ subject, onBack, onOpenAiTutor }) => {
  const { token, activeRole } = useEnterpriseAuth();
  const { completedTopicIds, toggleTopicCompletion } = useAcademic();
  const [overview, setOverview] = useState<SubjectOverview>({ resources: [], assignments: [], quizzes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'curriculum' | 'resources' | 'assignments' | 'quizzes'>('curriculum');
  const [submissionDrafts, setSubmissionDrafts] = useState<Record<string, string>>({});
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number[]>>({});
  const [quizMessage, setQuizMessage] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/lms/subjects/${encodeURIComponent(subject.id)}/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load this subject.');
      setOverview({ resources: data.resources || [], assignments: data.assignments || [], quizzes: data.quizzes || [] });
    } catch (err: any) {
      setError(err.message || 'Could not load this subject.');
    } finally {
      setLoading(false);
    }
  }, [subject.id, token]);

  useEffect(() => { void loadOverview(); }, [loadOverview]);

  const submitAssignment = async (assignmentId: string) => {
    const contentText = submissionDrafts[assignmentId]?.trim();
    if (!contentText) return;
    setSubmissionMessage(null);
    try {
      const response = await fetch(`/api/lms/assignments/${encodeURIComponent(assignmentId)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contentText }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Assignment submission failed.');
      setSubmissionDrafts((drafts) => ({ ...drafts, [assignmentId]: '' }));
      setSubmissionMessage('Assignment submitted.');
      await loadOverview();
    } catch (err: any) {
      setSubmissionMessage(err.message || 'Assignment submission failed.');
    }
  };

  const submitQuiz = async (quiz: Quiz) => {
    const selectedAnswers = quizAnswers[quiz.id] || [];
    if (selectedAnswers.length !== quiz.questions.length || selectedAnswers.some((answer) => !Number.isInteger(answer))) {
      setQuizMessage('Answer every question before submitting.');
      return;
    }
    setQuizMessage(null);
    try {
      const response = await fetch(`/api/lms/quizzes/${encodeURIComponent(quiz.id)}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ selectedAnswers }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Quiz submission failed.');
      setQuizMessage(`Quiz result: ${data.score}/${data.totalQuestions} (${data.percentage}%).`);
      await loadOverview();
    } catch (err: any) {
      setQuizMessage(err.message || 'Quiz submission failed.');
    }
  };

  const tabs = [
    ['curriculum', 'Curriculum'], ['resources', `Resources (${overview.resources.length})`],
    ['assignments', `Assignments (${overview.assignments.length})`], ['quizzes', `Quizzes (${overview.quizzes.length})`],
  ] as const;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-8">
      <section className="flex items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <button type="button" onClick={onBack} aria-label="Back to subjects" className="rounded-xl border border-[#CBD5E1] p-2 text-[#475569] hover:bg-[#F8FAFC]"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">{subject.code} · Semester {subject.semester}</p><h1 className="mt-1 text-2xl font-black text-[#0F172A]">{subject.name}</h1><p className="mt-1 text-sm text-[#64748B]">{subject.syllabusVersion || 'Published curriculum'} · {subject.credits} credits</p></div>
        <button type="button" onClick={() => onOpenAiTutor(`${subject.name}: `)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-3 text-sm font-bold text-white hover:bg-[#115E59]"><HelpCircle className="h-4 w-4" />Ask tutor</button>
      </section>

      {error && <p role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">{error}</p>}
      {submissionMessage && <p role="status" className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm text-[#166534]">{submissionMessage}</p>}
      {quizMessage && <p role="status" className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm text-[#166534]">{quizMessage}</p>}

      <nav aria-label="Subject content" className="flex flex-wrap gap-2">{tabs.map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={`min-h-10 rounded-xl px-4 text-sm font-bold ${tab === id ? 'bg-[#0F766E] text-white' : 'border border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]'}`}>{label}</button>)}</nav>

      {loading ? <p role="status" className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#64748B]">Loading subject content…</p> : (
        <div className="space-y-4">
          {tab === 'curriculum' && (subject.units?.length ? subject.units.map((unit) => (
            <section key={unit.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <h2 className="text-lg font-black text-[#0F172A]">{unit.title}</h2>
              {unit.description && <p className="mt-1 text-sm text-[#64748B]">{unit.description}</p>}
              <ul className="mt-4 divide-y divide-[#E2E8F0]">{unit.topics?.map((topic) => {
                const complete = completedTopicIds.includes(topic.id);
                return <li key={topic.id} className="flex items-start gap-3 py-3"><button type="button" onClick={() => void toggleTopicCompletion(topic.id)} aria-pressed={complete} disabled={activeRole !== 'student'} className={`mt-0.5 rounded-full p-1 ${complete ? 'text-[#15803D]' : 'text-[#94A3B8]'} disabled:cursor-default`} aria-label={`${complete ? 'Mark incomplete' : 'Mark complete'}: ${topic.title}`}><CheckCircle2 className="h-5 w-5" /></button><div><h3 className="font-bold text-[#0F172A]">{topic.topicNumber}. {topic.title}</h3>{topic.description && <p className="mt-1 text-sm text-[#64748B]">{topic.description}</p>}</div></li>;
              })}</ul>
            </section>
          )) : <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-sm text-[#64748B]">No curriculum units are published for this subject yet.</p>)}

          {tab === 'resources' && (overview.resources.length ? <div className="grid gap-3 md:grid-cols-2">{overview.resources.map((resource) => <article key={resource.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-4"><div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-[#0F766E]" /><div className="min-w-0 flex-1"><h2 className="font-bold text-[#0F172A]">{resource.title}</h2><p className="mt-1 text-xs text-[#64748B]">{resource.resourceType.replace('_', ' ')} · {resource.teacherName}</p>{resource.description && <p className="mt-2 text-sm text-[#475569]">{resource.description}</p>}{resource.contentText && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-[#F8FAFC] p-3 text-sm text-[#334155]">{resource.contentText}</p>}{resource.fileUrl && <a className="mt-3 inline-block text-sm font-bold text-[#0F766E] underline" href={resource.fileUrl} target="_blank" rel="noreferrer">Open resource</a>}</div></div></article>)}</div> : <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-sm text-[#64748B]">No resources have been added yet.</p>)}

          {tab === 'assignments' && (overview.assignments.length ? overview.assignments.map((assignment) => <article key={assignment.id} className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-5"><div><h2 className="font-black text-[#0F172A]">{assignment.title}</h2><p className="mt-1 text-sm text-[#64748B]">{assignment.description || assignment.instructions}</p><p className="mt-2 text-xs text-[#64748B]">Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'} · {assignment.maxMarks} marks</p></div>{activeRole === 'student' && <><label className="sr-only" htmlFor={`assignment-${assignment.id}`}>Submission for {assignment.title}</label><textarea id={`assignment-${assignment.id}`} value={submissionDrafts[assignment.id] || ''} onChange={(event) => setSubmissionDrafts((drafts) => ({ ...drafts, [assignment.id]: event.target.value }))} rows={4} placeholder="Write your submission" className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm" /><button type="button" onClick={() => void submitAssignment(assignment.id)} disabled={!submissionDrafts[assignment.id]?.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Submit</button></>}</article>) : <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-sm text-[#64748B]">No assignments have been added yet.</p>)}

          {tab === 'quizzes' && (overview.quizzes.length ? overview.quizzes.map((quiz) => <article key={quiz.id} className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5"><div><h2 className="font-black text-[#0F172A]">{quiz.title}</h2><p className="mt-1 text-xs text-[#64748B]">{quiz.questions.length} questions · {quiz.timeLimitMinutes} minutes · Pass score {quiz.passPercentage}%</p></div>{quiz.questions.map((question, questionIndex) => <fieldset key={question.id} className="space-y-2"><legend className="font-semibold text-[#334155]">{questionIndex + 1}. {question.text}</legend>{question.options.map((option, optionIndex) => <label key={`${question.id}-${optionIndex}`} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E2E8F0] p-3 text-sm hover:bg-[#F8FAFC]"><input type="radio" name={`${quiz.id}-${question.id}`} checked={quizAnswers[quiz.id]?.[questionIndex] === optionIndex} onChange={() => setQuizAnswers((answers) => { const next = [...(answers[quiz.id] || [])]; next[questionIndex] = optionIndex; return { ...answers, [quiz.id]: next }; })} />{option}</label>)}</fieldset>)}{activeRole === 'student' && <button type="button" onClick={() => void submitQuiz(quiz)} className="min-h-10 rounded-xl bg-[#0F766E] px-4 text-sm font-bold text-white hover:bg-[#115E59]">Submit quiz</button>}</article>) : <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-sm text-[#64748B]">No quizzes have been added yet.</p>)}
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-[#64748B]"><BookOpen className="h-4 w-4" />Content shown here comes from this published subject.</div>
    </div>
  );
};
