// Syllabus Ingestion, Structured Document Extraction & Publication Console
import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  Layers,
  ArrowRight,
  BookOpen,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';

export const SyllabusManagerScreen: React.FC = () => {
  const { user, token } = useEnterpriseAuth();
  const { refreshSyllabus } = useAcademic();

  const [rawText, setRawText] = useState(`Course Title: Cloud Computing & Virtualization
Subject Code: CS504
Credits: 3

UNIT 1: Cloud Principles & Hypervisor Virtualization
- NIST Cloud Definition and Essential Characteristics
- Service Models: IaaS, PaaS, SaaS Architectural Analysis
- Type 1 and Type 2 Virtualization, Hardware Assist

UNIT 2: Distributed Consensus & Cloud Storage
- Distributed Consensus Protocols (Raft & Paxos)
- CAP Theorem and Eventual Consistency in Cloud Databases
- Consistent Hashing and Distributed Object Stores`);

  const [semester, setSemester] = useState('5');
  const [syllabusVersion, setSyllabusVersion] = useState('R23-v2.1 (AICTE)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState<any>(null);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setPublishStatus(null);

    try {
      const res = await fetch('/api/academic/syllabus/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: rawText,
          institutionId: user?.institutionId || 'inst_ait_hyd',
          departmentId: 'dept_cse',
          programmeId: 'prog_btech_cse',
          semester: parseInt(semester, 10),
          syllabusVersion,
        }),
      });

      const data = await res.json();
      if (res.ok && data.draft) {
        setExtractedDraft(data.draft);
      }
    } catch (err: any) {
      alert('Extraction failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!extractedDraft) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/academic/syllabus/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          draft: extractedDraft,
          institutionId: user?.institutionId || 'inst_ait_hyd',
          departmentId: 'dept_cse',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPublishStatus(`Success! "${extractedDraft.subjectName}" (${extractedDraft.subjectCode}) has been officially published and is now live for all enrolled students in Semester ${semester}!`);
        await refreshSyllabus();
      } else {
        setPublishStatus('Error: ' + data.error);
      }
    } catch (err: any) {
      setPublishStatus('Publication error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-xs">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0369A1] mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>Central Academic Management • Curriculum Engineering</span>
        </div>
        <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
          Syllabus Ingestion, Structured Extraction &amp; Publication
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Upload or paste official university syllabi. The extraction engine automatically categorizes Units, Topics, Learning Outcomes, and Reference Materials before publication.
        </p>
      </div>

      {publishStatus && (
        <div className="p-4 bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] rounded-[10px] text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{publishStatus}</span>
          </div>
          <button type="button" onClick={() => setPublishStatus(null)} className="text-[#166534] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* INPUT FORM: PASTE / UPLOAD SYLLABUS */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">Target Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1] bg-white font-bold"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">Curriculum Version</label>
            <input
              type="text"
              value={syllabusVersion}
              onChange={(e) => setSyllabusVersion(e.target.value)}
              className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1] font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">Target Department</label>
            <input
              type="text"
              disabled
              value="Computer Science & Engineering"
              className="w-full text-xs p-2.5 rounded-[8px] border border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B] font-medium"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[#0F172A]">
              Syllabus Text / Document Content:
            </label>
            <span className="text-[11px] text-[#64748B]">Auto-detects Subject Code, Units &amp; Topics</span>
          </div>
          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full text-xs font-mono p-3 rounded-[8px] border border-[#CBD5E1] focus:outline-hidden focus:border-[#0F766E]"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleParse}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Process &amp; Extract Structured Units</span>
          </button>
        </div>
      </div>

      {/* EXTRACTED PREVIEW & PUBLISH STAGE */}
      {extractedDraft && (
        <div className="bg-white rounded-[12px] border-2 border-[#0F766E]/30 shadow-md p-6 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534] mb-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Structured Extraction Ready for Review</span>
              </div>
              <h3 className="font-black text-lg text-[#0F172A]">
                {extractedDraft.subjectName} ({extractedDraft.subjectCode})
              </h3>
              <p className="text-xs text-[#64748B]">
                {extractedDraft.credits} Credits • Semester {extractedDraft.semester} • {extractedDraft.units?.length} Units Extracted
              </p>
            </div>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-black shadow-sm active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Official Syllabus to Students</span>
            </button>
          </div>

          {/* Unit-wise Extracted Preview */}
          <div className="space-y-4">
            {extractedDraft.units?.map((unit: any, uIdx: number) => (
              <div key={uIdx} className="p-4 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="font-extrabold text-sm text-[#0F172A] flex items-center justify-between">
                  <span>{unit.title}</span>
                  <span className="text-[10px] font-bold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded-full border border-[#99F6E4]">
                    {unit.topics?.length} Topics
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {unit.topics?.map((topic: any, tIdx: number) => (
                    <div key={tIdx} className="p-2.5 rounded-[6px] bg-white border border-[#CBD5E1] text-xs">
                      <div className="font-bold text-[#0F172A]">
                        Topic {topic.topicNumber}: {topic.title}
                      </div>
                      <div className="text-[11px] text-[#475569] mt-0.5">{topic.description}</div>
                      {topic.learningOutcomes && (
                        <div className="text-[10px] text-[#0F766E] font-medium mt-1">
                          Outcomes: {topic.learningOutcomes.join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
