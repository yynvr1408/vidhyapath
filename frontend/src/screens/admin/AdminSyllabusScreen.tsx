import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Lock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogOut,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { VidyapathLogo } from '../../components/VidyapathLogo';

interface ExtractedConcept {
  id: string;
  title: string;
  explanation: string;
  keyPoints: string[];
}

interface ExtractedChapter {
  id: string;
  title: string;
  summary: string;
  concepts: ExtractedConcept[];
}

export const AdminSyllabusScreen: React.FC = () => {
  // Admin Login State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('vidyapath_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Syllabus Upload Form State
  const [language, setLanguage] = useState<'te' | 'hi' | 'en'>('te');
  const [subject, setSubject] = useState('Mathematics');
  const [classLevel, setClassLevel] = useState('10');
  const [syllabusText, setSyllabusText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extracted Syllabus Preview
  const [extractedChapters, setExtractedChapters] = useState<ExtractedChapter[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'Admin' && password.trim() === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('vidyapath_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Use Username: Admin and Password: admin123');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('vidyapath_admin_auth');
    setUsername('');
    setPassword('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStatusMessage(null);
    }
  };

  const handleAnalyzeAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !syllabusText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please upload a syllabus file (.pdf, .txt, .md) or paste syllabus text.' });
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('username', 'Admin');
    formData.append('password', 'admin123');
    formData.append('subject', subject);
    formData.append('language', language);
    formData.append('classLevel', classLevel);

    if (selectedFile) {
      formData.append('file', selectedFile);
    } else {
      formData.append('text', syllabusText);
    }

    try {
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: {
          'x-admin-user': 'Admin',
          'x-admin-pass': 'admin123',
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && (data.success || data.chapters)) {
        setExtractedChapters(data.chapters || []);
        setStatusMessage({
          type: 'success',
          text: `Syllabus published successfully! Extracted ${data.chapters?.length || 0} chapters and ${data.chunkCount || 0} searchable RAG chunks. My Syllabus and AI Tutor have been updated live.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || data.message || 'Syllabus processing failed. Please check your text or file.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Network error while contacting the backend.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // If not logged in, show simple Admin Login Modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center p-4 font-sans text-white">
        <div className="bg-[#1E293B] rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-[#334155] shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center">
            <VidyapathLogo className="w-12 h-12 rounded-2xl shadow-md mb-3" />
            <h2 className="text-xl font-extrabold text-white">Vidyapath Admin Gateway</h2>
            <p className="text-xs text-[#94A3B8] mt-1">Syllabus-to-RAG Ingestion Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] focus:border-[#0F766E] focus:outline-none text-sm text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] focus:border-[#0F766E] focus:outline-none text-sm text-white font-medium"
              />
            </div>

            {loginError && (
              <p className="text-xs font-semibold text-[#F87171] bg-[#450A0A] p-2.5 rounded-lg border border-[#7F1D1D]">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0F766E] hover:bg-[#0D6962] text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-[#64748B]">
            Default Credentials: <code className="text-[#2DD4BF] font-mono">Admin</code> / <code className="text-[#2DD4BF] font-mono">admin123</code>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Syllabus Panel
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-[#0F172A]">
      {/* Admin Top Header */}
      <header className="px-6 py-3.5 bg-white border-b border-[#E2E8F0] shadow-xs flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <VidyapathLogo className="w-8 h-8 rounded-xl shadow-xs" />
          <div>
            <h1 className="font-extrabold text-base md:text-lg text-[#0F766E] flex items-center space-x-2">
              <span>Syllabus-to-RAG Ingestion Panel</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#CCFBF1] text-[#0F766E]">
                ADMIN
              </span>
            </h1>
            <p className="text-xs text-[#64748B]">Zero ephemeral disk writes • LLM Structured Chunking</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/"
            className="text-xs font-semibold text-[#0F766E] hover:underline hidden sm:inline"
          >
            ← View Student App
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#DC2626] hover:bg-[#FEF2F2] flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-8">
        {/* Upload Form Box */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#CCFBF1] text-[#0F766E]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0F172A]">
                Publish Curriculum to AI Tutor
              </h2>
              <p className="text-xs md:text-sm text-[#64748B]">
                Upload a state-board syllabus or paste curriculum units. The system parses chapters, concepts, and generates RAG chunks.
              </p>
            </div>
          </div>

          <form onSubmit={handleAnalyzeAndPublish} className="space-y-5">
            {/* Metadata Fields: Language, Class, Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Target Language *
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                >
                  <option value="te">తెలుగు (Telugu - Andhra Pradesh / Telangana)</option>
                  <option value="hi">हिन्दी (Hindi - CBSE / State Board)</option>
                  <option value="en">English (CBSE / Pan-India)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Class / Grade *
                </label>
                <input
                  type="text"
                  required
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Mathematics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                Upload File (.pdf, .txt, .md)
              </label>
              <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] rounded-2xl p-6 text-center bg-[#F8FAFC] transition-colors relative">
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#334155]">
                  {selectedFile ? selectedFile.name : 'Click or drag a syllabus file to upload'}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">PDF, Markdown or Plain Text (up to 10 MB in memory)</p>
              </div>
            </div>

            {/* OR Paste Textarea */}
            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                OR Paste Syllabus Text Directly
              </label>
              <textarea
                rows={5}
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                placeholder="Chapter 1: Real Numbers&#10;- Euclid's Division Lemma&#10;- Fundamental Theorem of Arithmetic&#10;&#10;Chapter 2: Sets&#10;- Union and Intersection..."
                className="w-full p-3.5 rounded-xl border border-[#CBD5E1] text-xs md:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
              />
            </div>

            {/* Status Message Alert */}
            {statusMessage && (
              <div
                className={`p-4 rounded-xl border text-xs md:text-sm flex items-start space-x-2.5 ${
                  statusMessage.type === 'success'
                    ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                    : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-[#16A34A] shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
                )}
                <span className="leading-relaxed font-medium">{statusMessage.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-3.5 bg-[#0F766E] hover:bg-[#0D6962] disabled:opacity-50 text-white font-extrabold text-sm md:text-base rounded-2xl shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>Analyzing & Generating RAG Embeddings…</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  <span>Analyze & Publish Syllabus</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Extracted Preview */}
        {extractedChapters.length > 0 && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center space-x-2 text-[#0F172A]">
                <CheckCircle className="w-5 h-5 text-[#10B981]" />
                <h3 className="font-extrabold text-base md:text-lg">
                  Published Chapters & Concepts ({extractedChapters.length})
                </h3>
              </div>
              <span className="text-xs font-bold text-[#0F766E] bg-[#CCFBF1] px-2.5 py-1 rounded-full">
                Live in AI Store
              </span>
            </div>

            <div className="space-y-4">
              {extractedChapters.map((ch, idx) => (
                <div key={ch.id || idx} className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-[#0F766E] text-white font-extrabold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-sm md:text-base text-[#0F172A]">{ch.title}</h4>
                  </div>
                  {ch.summary && <p className="text-xs text-[#64748B] pl-9">{ch.summary}</p>}

                  {/* Concepts list */}
                  <div className="pl-9 space-y-2 pt-1">
                    <h5 className="text-[11px] font-bold text-[#94A3B8] uppercase">Concepts:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ch.concepts?.map((c, cIdx) => (
                        <div key={c.id || cIdx} className="p-2.5 bg-white rounded-xl border border-[#E2E8F0] space-y-1">
                          <p className="font-bold text-xs text-[#0F766E] flex items-center space-x-1">
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span>{c.title}</span>
                          </p>
                          {c.explanation && <p className="text-[11px] text-[#475569] leading-tight">{c.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
