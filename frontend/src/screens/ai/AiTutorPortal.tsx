// Responsible Socratic AI Tutor Portal with Multi-Tier Safety Guardrails
import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Shield,
  HelpCircle,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { TutorLocalCache } from '../../services/tutorCache';

interface Message {
  sender: 'user' | 'tutor';
  text: string;
  flagged?: boolean;
  isSocraticNudge?: boolean;
  timestamp: number;
}

interface AiTutorPortalProps {
  onBack?: () => void;
}

export const AiTutorPortal: React.FC<AiTutorPortalProps> = ({ onBack }) => {
  const { user, token } = useEnterpriseAuth();
  const { subjects, activeSubject } = useAcademic();

  const [query, setQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeSubject?.id || subjects[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'tutor',
      text: `Hello ${user?.fullName || 'Student'}! I am your Vidyapath Pedagogical AI Tutor. I can help explain difficult academic concepts, guide you step-by-step through problems, and prepare for your assessments. What concept would you like to explore today?`,
      timestamp: Date.now(),
    },
  ]);

  const currentSub = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q || loading) return;

    const userMsg: Message = { sender: 'user', text: q, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');

    // Check local semantic cache before network call (0ms, 0 tokens)
    const cached = TutorLocalCache.get(q, selectedSubjectId);
    if (cached) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: cached.answer,
          flagged: cached.flagged,
          isSocraticNudge: cached.isSocraticNudge,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: q,
          subjectId: selectedSubjectId,
          unitTitle: currentSub?.units?.[0]?.title,
        }),
      });

      const data = await res.json();
      const tutorMsg: Message = {
        sender: 'tutor',
        text: data.answer || 'Let’s explore this step-by-step. What is the fundamental concept behind this problem?',
        flagged: data.flagged,
        isSocraticNudge: data.isSocraticNudge,
        timestamp: Date.now(),
      };

      // Cache response for future instant lookup
      TutorLocalCache.set(q, {
        answer: tutorMsg.text,
        flagged: tutorMsg.flagged,
        isSocraticNudge: tutorMsg.isSocraticNudge,
      }, selectedSubjectId);

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: 'Offline Educational Guidance: Consider breaking this problem into smaller sub-questions. Identify what is given in the problem statement and which formula connects the variables.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Explain CPU scheduling Gantt chart with an example',
    'What is the difference between counting semaphore and binary mutex?',
    'How does the Banker algorithm verify a safe state?',
    'Give me the exam answers right now (Test Guardrail)',
  ];

  return (
    <div className="space-y-4 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      )}

      <div className="bg-white p-5 rounded-[12px] border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534] inline-flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Pedagogical Socratic AI • Active</span>
            </span>
            <span className="text-[10px] text-[#64748B] font-bold">
              Powered by Groq Cloud LLaMA 3.3 70B
            </span>
          </div>
          <h2 className="text-lg font-black text-[#0F172A] tracking-tight">
            Socratic Academic Assistant &amp; Doubt Solver
          </h2>
          <p className="text-xs text-[#64748B]">
            All explanations are strictly grounded in your official university curriculum and subject syllabi.
          </p>
        </div>

        {/* Subject Filter Dropdown */}
        <div className="shrink-0">
          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
            Grounded Subject Context
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs font-bold bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-2 text-[#0F172A] max-w-xs cursor-pointer"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Guardrail Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="p-2.5 bg-white rounded-[8px] border border-[#E2E8F0] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
          <span className="font-semibold text-[#0F172A]">Exam Guard: Active</span>
        </div>
        <div className="p-2.5 bg-white rounded-[8px] border border-[#E2E8F0] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
          <span className="font-semibold text-[#0F172A]">Prompt Defense: Active</span>
        </div>
        <div className="p-2.5 bg-white rounded-[8px] border border-[#E2E8F0] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
          <span className="font-semibold text-[#0F172A]">PII Protection: Active</span>
        </div>
        <div className="p-2.5 bg-white rounded-[8px] border border-[#E2E8F0] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
          <span className="font-semibold text-[#0F172A]">Socratic Grounding: On</span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-4 min-h-[380px] max-h-[480px] overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-[12px] p-3.5 text-xs ${
                m.sender === 'user'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : m.flagged
                  ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                  : m.isSocraticNudge
                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                  : 'bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]'
              }`}
            >
              {m.sender === 'tutor' && (
                <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] opacity-80">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {m.flagged
                      ? 'Academic Integrity Guardrail Notice'
                      : m.isSocraticNudge
                      ? 'Pedagogical Socratic Guidance'
                      : 'Vidyapath Socratic AI Tutor'}
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[12px] text-xs font-semibold text-[#64748B] flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F766E]" />
              <span>Analyzing curriculum concepts and constructing Socratic guidance...</span>
            </div>
          </div>
        )}
      </div>

      {/* Sample Prompts Pills */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[11px] font-bold text-[#64748B] self-center">Try a prompt:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(p)}
            className="text-[11px] font-medium bg-white hover:bg-[#F0FDFA] border border-[#CBD5E1] hover:border-[#0F766E] text-[#0F172A] px-2.5 py-1 rounded-full transition-all text-left"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask a question about your subject, concepts, or problem..."
          className="flex-1 text-xs p-3 rounded-[10px] border border-[#CBD5E1] bg-white focus:outline-hidden focus:border-[#0F766E] shadow-2xs"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="px-5 py-3 rounded-[10px] bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </div>
    </div>
  );
};
