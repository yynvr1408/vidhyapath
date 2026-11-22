// Code-gated Admin Syllabus Panel (no email/password login).
// The admin access code lives in component memory only (never localStorage).
import React, { useState } from 'react';
import { X, Lock, Loader2, BookOpen, Upload } from 'lucide-react';

interface AdminPanelModalProps {
  open: boolean;
  onClose: () => void;
}

interface SyllabusConcept {
  title: string;
  keyPoints?: string[];
}

interface SyllabusChapter {
  title: string;
  summary?: string;
  concepts?: SyllabusConcept[];
}

interface SyllabusResult {
  chapters?: SyllabusChapter[];
  chunkCount?: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_admin_code: 'Admin code expired or invalid',
  subject_required: 'Subject is required',
};

const readErrorMessage = async (res: Response): Promise<string> => {
  try {
    const data = await res.json();
    const code = typeof data?.error === 'string' ? data.error : '';
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
    return code || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
};

const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ open, onClose }) => {
  const [adminCode, setAdminCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [language, setLanguage] = useState<'te' | 'hi' | 'en'>('en');
  const [classLevel, setClassLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<SyllabusResult | null>(null);

  if (!open) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeInput.trim();
    if (!code) {
      setCodeError('Invalid admin access code');
      return;
    }
    setVerifying(true);
    setCodeError(null);
    try {
      const res = await fetch('/api/admin/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': code,
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setAdminCode(code);
        setUnlocked(true);
        setCodeInput('');
      } else {
        setCodeError('Invalid admin access code');
      }
    } catch {
      setCodeError('Invalid admin access code');
    } finally {
      setVerifying(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('language', language);
      form.append('classLevel', classLevel.trim());
      form.append('subject', subject.trim());
      if (file) {
        form.append('file', file);
      } else {
        form.append('text', text);
      }
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'x-admin-code': adminCode },
        body: form,
      });
      if (res.ok) {
        setResult((await res.json()) as SyllabusResult);
      } else {
        setUploadError(await readErrorMessage(res));
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClose = () => {
    setUnlocked(false);
    setAdminCode('');
    setCodeInput('');
    setCodeError(null);
    setResult(null);
    setUploadError(null);
    setFile(null);
    setText('');
    onClose();
  };

  const inputClass =
    'w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#0F766E] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-xl text-[#0F172A] space-y-2 leading-relaxed break-words">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!unlocked ? (
          <form onSubmit={handleUnlock} className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0F766E]" />
              <h2 className="text-lg font-extrabold">Admin Access</h2>
            </div>
            <label className="block text-xs font-bold text-[#475569]">
              Admin Access Code
              <input
                type="password"
                autoComplete="off"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </label>
            {codeError && <p className="text-xs font-semibold text-red-600">{codeError}</p>}
            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Unlock</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-extrabold">Syllabus Admin</h2>

            <form onSubmit={handleAnalyze} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block text-xs font-bold text-[#475569]">
                  Language
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'te' | 'hi' | 'en')}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="te">తెలుగు (te)</option>
                    <option value="hi">हिन्दी (hi)</option>
                    <option value="en">English (en)</option>
                  </select>
                </label>
                <label className="block text-xs font-bold text-[#475569]">
                  Class
                  <input
                    type="text"
                    placeholder="e.g. 10"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-xs font-bold text-[#475569]">
                  Subject
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-[#475569]">
                Syllabus file (.pdf, .txt, .md)
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-xs text-[#475569] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#F0FDFA] file:text-[#0F766E] file:font-bold"
                />
              </label>

              <label className="block text-xs font-bold text-[#475569]">
                Paste syllabus text
                <textarea
                  rows={5}
                  disabled={!!file}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={file ? 'File selected — text disabled' : 'Paste chapter list and topics here'}
                  className={`${inputClass} mt-1 resize-y`}
                />
              </label>

              {uploadError && <p className="text-xs font-semibold text-red-600">{uploadError}</p>}

              <button
                type="submit"
                disabled={analyzing}
                className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{analyzing ? 'Analyzing…' : 'Analyze & Publish Syllabus'}</span>
              </button>
            </form>

            {result && (
              <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0F766E]" />
                  Extracted Chapters &amp; Concepts
                </h3>
                {(result.chapters ?? []).map((chapter, ci) => (
                  <div key={ci} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2">
                    <p className="font-bold text-sm">{chapter.title}</p>
                    {chapter.summary && <p className="text-xs text-[#475569]">{chapter.summary}</p>}
                    {(chapter.concepts ?? []).length > 0 && (
                      <ul className="pl-4 space-y-1 list-disc text-xs">
                        {(chapter.concepts ?? []).map((concept, ki) => (
                          <li key={ki}>
                            <span className="font-semibold">{concept.title}</span>
                            {(concept.keyPoints ?? []).length > 0 && (
                              <ul className="pl-4 space-y-0.5 list-[circle] text-[11px] text-[#64748B]">
                                {(concept.keyPoints ?? []).map((kp, pi) => (
                                  <li key={pi}>{kp}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <p className="text-[11px] text-[#64748B]">Indexed {result.chunkCount ?? 0} chunks for AI Tutor</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanelModal;
