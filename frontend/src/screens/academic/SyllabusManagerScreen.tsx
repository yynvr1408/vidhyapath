import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, RefreshCw, Sparkles } from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';
import type { Department, Programme } from '../../types/enterprise';

interface ExtractedSyllabusDraft {
  subjectName: string;
  subjectCode: string;
  credits: number;
  programmeId: string;
  semester: number;
  syllabusVersion: string;
  units: Array<{ unitNumber: number; title: string; description: string; topics: Array<{ topicNumber: number; title: string; description: string; learningOutcomes: string[] }> }>;
}

export const SyllabusManagerScreen: React.FC = () => {
  const { user, token } = useEnterpriseAuth();
  const { refreshSyllabus } = useAcademic();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [semester, setSemester] = useState('');
  const [syllabusVersion, setSyllabusVersion] = useState('');
  const [rawText, setRawText] = useState('');
  const [isLoadingStructure, setIsLoadingStructure] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState<ExtractedSyllabusDraft | null>(null);
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadStructure = async () => {
      if (!user?.institutionId || !token) {
        setDepartments([]);
        setProgrammes([]);
        setIsLoadingStructure(false);
        return;
      }
      setIsLoadingStructure(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [departmentResponse, programmeResponse] = await Promise.all([
          fetch(`/api/institution/${encodeURIComponent(user.institutionId)}/departments`, { headers }),
          fetch(`/api/institution/${encodeURIComponent(user.institutionId)}/programmes`, { headers }),
        ]);
        if (!departmentResponse.ok || !programmeResponse.ok) throw new Error('Could not load your institution’s academic structure.');
        const [departmentData, programmeData] = await Promise.all([departmentResponse.json(), programmeResponse.json()]);
        if (!cancelled) {
          setDepartments(Array.isArray(departmentData) ? departmentData : []);
          setProgrammes(Array.isArray(programmeData) ? programmeData : []);
        }
      } catch (error) {
        if (!cancelled) setNotice({ message: error instanceof Error ? error.message : 'Could not load academic structure.', error: true });
      } finally {
        if (!cancelled) setIsLoadingStructure(false);
      }
    };
    void loadStructure();
    return () => { cancelled = true; };
  }, [user?.institutionId, token]);

  const availableProgrammes = useMemo(() => programmes.filter((programme) => programme.departmentId === departmentId), [programmes, departmentId]);
  const selectedProgramme = availableProgrammes.find((programme) => programme.id === programmeId);
  const semesterOptions = selectedProgramme ? Array.from({ length: selectedProgramme.totalSemesters }, (_, index) => index + 1) : [];
  const canProcess = Boolean(user?.institutionId && departmentId && programmeId && semester && syllabusVersion.trim() && rawText.trim());

  const handleParse = async () => {
    if (!canProcess || !user?.institutionId || !token) return;
    setIsProcessing(true);
    setNotice(null);
    setExtractedDraft(null);
    try {
      const response = await fetch('/api/academic/syllabus/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: rawText, institutionId: user.institutionId, departmentId, programmeId, semester: Number(semester), syllabusVersion: syllabusVersion.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.draft) throw new Error(data.error || 'Could not process this syllabus.');
      setExtractedDraft(data.draft);
      setNotice({ message: 'Review the extracted subject and units, then publish when they match the official syllabus.', error: false });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : 'Could not process this syllabus.', error: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!extractedDraft || !user?.institutionId || !token) return;
    setIsProcessing(true);
    setNotice(null);
    try {
      const response = await fetch('/api/academic/syllabus/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ draft: extractedDraft, institutionId: user.institutionId, departmentId, programmeId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not publish this syllabus.');
      setNotice({ message: `${data.subject.name} (${data.subject.code}) is now published for ${selectedProgramme?.name}, semester ${semester}.`, error: false });
      setExtractedDraft(null);
      setRawText('');
      await refreshSyllabus();
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : 'Could not publish this syllabus.', error: true });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E0F2FE] px-2.5 py-1 text-xs font-bold text-[#0369A1]"><FileText className="h-3.5 w-3.5" />Academic management</div>
        <h1 className="text-xl font-black tracking-tight text-[#0F172A]">Publish a syllabus</h1>
        <p className="mt-1 text-sm text-[#64748B]">Choose a department and programme, paste the official text, review the extracted units, then publish.</p>
      </section>

      {notice && <div role={notice.error ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm ${notice.error ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'}`}>{notice.message}</div>}

      <section className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        {departments.length === 0 || programmes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">{isLoadingStructure ? 'Loading institution structure…' : 'Add a department and programme in the Institution dashboard before publishing a syllabus.'}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-bold text-[#334155]">Department<select value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setProgrammeId(''); setSemester(''); setExtractedDraft(null); }} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 font-normal"><option value="">Choose department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            <label className="text-sm font-bold text-[#334155]">Programme<select value={programmeId} onChange={(event) => { setProgrammeId(event.target.value); setSemester(''); setExtractedDraft(null); }} disabled={!departmentId} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 font-normal"><option value="">Choose programme</option>{availableProgrammes.map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}</select></label>
            <label className="text-sm font-bold text-[#334155]">Semester<select value={semester} onChange={(event) => setSemester(event.target.value)} disabled={!selectedProgramme} className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 font-normal"><option value="">Choose semester</option>{semesterOptions.map((item) => <option key={item} value={item}>Semester {item}</option>)}</select></label>
            <label className="text-sm font-bold text-[#334155]">Curriculum version<input value={syllabusVersion} onChange={(event) => setSyllabusVersion(event.target.value)} maxLength={60} placeholder="For example: 2026 revision" className="mt-1 min-h-10 w-full rounded-lg border border-[#CBD5E1] px-3 font-normal" /></label>
          </div>
        )}

        <label className="block text-sm font-bold text-[#334155]">Official syllabus text<textarea rows={10} value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder={'Course Title: Data Structures\nSubject Code: CS301\nCredits: 4\n\nUNIT 1: Foundations\n- Arrays and linked lists'} className="mt-1 w-full rounded-lg border border-[#CBD5E1] p-3 font-mono text-sm focus:border-[#0F766E] focus:outline-hidden" /></label>
        <div className="flex justify-end"><button type="button" onClick={() => void handleParse()} disabled={isProcessing || !canProcess || departments.length === 0 || programmes.length === 0} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-bold text-white hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-50">{isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Process syllabus</button></div>
      </section>

      {extractedDraft && <section className="space-y-4 rounded-2xl border-2 border-[#0F766E]/30 bg-white p-5 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] pb-3"><div><div className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-bold text-[#166534]"><CheckCircle2 className="h-3 w-3" />Review before publishing</div><h2 className="text-lg font-black text-[#0F172A]">{extractedDraft.subjectName} ({extractedDraft.subjectCode})</h2><p className="text-sm text-[#64748B]">{extractedDraft.credits} credits · Semester {extractedDraft.semester} · {extractedDraft.units.length} units</p></div><button type="button" onClick={() => void handlePublish()} disabled={isProcessing} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#15803D] px-4 text-sm font-bold text-white hover:bg-[#166534] disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Publish to students</button></div>
        <div className="space-y-3">{extractedDraft.units.map((unit) => <article key={`${unit.unitNumber}-${unit.title}`} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><h3 className="font-bold text-[#0F172A]">{unit.title}</h3>{unit.description && <p className="mt-1 text-sm text-[#64748B]">{unit.description}</p>}<ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#334155]">{unit.topics.map((topic) => <li key={`${unit.unitNumber}-${topic.topicNumber}`}>{topic.title}</li>)}</ul></article>)}</div>
      </section>}
    </div>
  );
};
