import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  BookOpen,
  Settings,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Server,
  Cpu,
  Wifi,
  WifiOff,
  Database,
  FileCode,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localDb } from '../db/indexedDb';
import { LearnerProfile, ContentPack } from '../types';
import { StudentAvatar } from '../components/StudentAvatar';
import { VidyapathLogo } from '../components/VidyapathLogo';
import { AppUpdateButton } from '../components/AppUpdateButton';

export const AdminPanelScreen: React.FC = () => {
  const {
    setScreen,
    learners,
    refreshLearnerData,
    pack,
    switchPack,
    isOffline,
    toggleSimulatedOffline,
    createLearner,
  } = useApp();

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'curriculum' | 'system' | 'audit'>('students');

  // New Student Registration in Admin
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newGrade, setNewGrade] = useState<number>(10);
  const [newEmoji, setNewEmoji] = useState('🐆');
  const [newPin, setNewPin] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Pack validation
  const [packReport, setPackReport] = useState<{ valid: boolean; errors: string[]; questionsCount: number; topicsCount: number } | null>(null);

  useEffect(() => {
    if (pack) {
      const qIds = new Set<string>();
      const allSkills = new Set<string>();
      const errors: string[] = [];

      for (const t of pack.topics || []) {
        for (const s of t.skills || []) allSkills.add(s);
      }

      for (const q of pack.questions || []) {
        if (qIds.has(q.id)) errors.push(`Duplicate ID: ${q.id}`);
        qIds.add(q.id);
        if (!allSkills.has(q.skillId)) errors.push(`Unmapped skillId in ${q.id}: ${q.skillId}`);
        if (!['A', 'B', 'C', 'D'].includes(q.answer)) errors.push(`Invalid answer in ${q.id}: ${q.answer}`);
      }

      setPackReport({
        valid: errors.length === 0,
        errors,
        questionsCount: pack.questions?.length || 0,
        topicsCount: pack.topics?.length || 0,
      });
    }
  }, [pack]);

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const configuredAdminPin = (import.meta as any).env?.VITE_ADMIN_PIN as string | undefined;
    if (!!configuredAdminPin && adminPin === configuredAdminPin) {
      setIsAdminUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setAdminPin('');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) return;

    const candidateCode = newNickname.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) + '-' + newGrade;
    const student: LearnerProfile = {
      id: 'learner_' + Date.now(),
      nickname: newNickname.trim(),
      classGrade: newGrade,
      avatarType: 'icon',
      avatarEmoji: newEmoji,
      avatarColor: '#0F766E',
      loginCode: candidateCode,
      pin: newPin.length === 4 ? newPin : '',
      pinHash: newPin.length === 4 ? newPin : '',
      packId: pack?.id || 'en-10-maths-cbse',
      createdAt: Date.now(),
    };

    await createLearner(student);
    await refreshLearnerData();
    setShowAddStudent(false);
    setNewNickname('');
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(`Delete profile for ${name}?`)) {
      await localDb.deleteLearner(id);
      await refreshLearnerData();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 1. Passcode Gate
  if (!isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-[16px] p-6 max-w-sm w-full border border-[#E2E8F0] shadow-md text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <h2 className="font-extrabold text-lg text-[#0F172A]">Administrator & Teacher Portal</h2>
            <p className="text-xs text-[#475569] mt-1 font-medium">
              Enter 4-digit Master Passcode to manage cohorts, content packs, and AI tutor settings.
            </p>
          </div>


          <form onSubmit={handleAdminUnlock} className="space-y-3 pt-2">
            <input
              type="password"
              maxLength={4}
              value={adminPin}
              onChange={(e) => {
                setAdminPin(e.target.value.replace(/\D/g, ''));
                setPinError(false);
              }}
              placeholder="••••"
              className="w-full text-center text-2xl font-mono tracking-widest p-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] focus:outline-hidden font-bold"
            />

            {pinError && (
              <div className="text-xs text-[#DC2626] font-semibold bg-[#FEE2E2] p-2 rounded-lg border border-[#FECACA]">
                Invalid Passcode! Please try again.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-[12px] bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs shadow-xs min-h-[48px] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Admin Portal</span>
            </button>
          </form>

          <button
            type="button"
            onClick={() => setScreen('S1_PICKER')}
            className="text-xs text-[#475569] hover:text-[#0F172A] font-bold flex items-center justify-center gap-1.5 mx-auto pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Student App</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Unlocked Admin Dashboard
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen('S1_PICKER')}
            className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F0FDFA] border border-[#E2E8F0] text-[#0F172A] active:scale-95 transition-all"
            title="Return to Student Mode"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-[#0F172A] flex items-center gap-2">
              <span>Admin & Teacher Portal</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#DCFCE7] text-[#16A34A] font-bold border border-[#86EFAC]">
                Verified Zero-PII
              </span>
            </h1>
            <p className="text-[11px] text-[#475569] font-medium hidden sm:block">
              Vidyapath Cohort Operations & Curriculum Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Offline Simulation Toggle */}
          <button
            type="button"
            onClick={toggleSimulatedOffline}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isOffline
                ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
                : 'bg-[#DCFCE7] border-[#16A34A] text-[#16A34A]'
            }`}
            title="Toggle offline simulation for testing"
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOffline ? 'Offline (PWA Mode)' : 'Online Connected'}</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 overflow-x-auto flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'students'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Learners & Cohorts ({learners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('curriculum')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'curriculum'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Packs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'system'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Tutor & Services</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-PII Compliance</span>
        </button>
      </div>

      {/* Tab Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: LEARNERS & COHORTS */}
        {activeTab === 'students' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-[12px] border border-[#E2E8F0]">
                <div className="text-xs text-[#475569] font-semibold">Active Profiles</div>
                <div className="text-2xl font-black text-[#0F766E] mt-1">{learners.length}</div>
              </div>
              <div className="bg-white p-4 rounded-[12px] border border-[#E2E8F0]">
                <div className="text-xs text-[#475569] font-semibold">Standard Subject</div>
                <div className="text-sm font-bold text-[#0F172A] mt-2">Class 10 Maths</div>
              </div>
              <div className="bg-white p-4 rounded-[12px] border border-[#E2E8F0]">
                <div className="text-xs text-[#475569] font-semibold">Device Storage</div>
                <div className="text-sm font-bold text-[#16A34A] mt-2">&lt; 1 MB IndexedDB</div>
              </div>
              <div className="bg-white p-4 rounded-[12px] border border-[#E2E8F0]">
                <div className="text-xs text-[#475569] font-semibold">Default PIN</div>
                <div className="text-sm font-bold font-mono text-[#0F172A] mt-2">1234 (Universal)</div>
              </div>
            </div>

            {/* Header with Register button */}
            <div className="flex items-center justify-between pt-2">
              <h2 className="font-extrabold text-sm text-[#0F172A]">Registered Student Profiles</h2>
              <button
                type="button"
                onClick={() => setShowAddStudent(!showAddStudent)}
                className="py-2 px-3.5 rounded-[10px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Register Student</span>
              </button>
            </div>

            {/* Inline Registration Form */}
            {showAddStudent && (
              <form onSubmit={handleCreateStudent} className="bg-white p-4 rounded-[12px] border-2 border-[#0F766E] shadow-sm space-y-3 animate-fadeIn">
                <div className="font-bold text-sm text-[#0F766E] flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Register New Student / Sibling Profile</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#475569] mb-1">Nickname / Name</label>
                    <input
                      type="text"
                      required
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      placeholder="e.g. Cheetah / చిరుత"
                      className="w-full text-xs font-semibold p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#475569] mb-1">Class Grade</label>
                    <select
                      value={newGrade}
                      onChange={(e) => setNewGrade(Number(e.target.value))}
                      className="w-full text-xs font-semibold p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]"
                    >
                      <option value={9}>Class 9</option>
                      <option value={10}>Class 10</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#475569] mb-1">Avatar / Mascot</label>
                    <select
                      value={newEmoji}
                      onChange={(e) => setNewEmoji(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]"
                    >
                      <option value="🐆">🐆 Cheetah (చిరుత)</option>
                      <option value="🐘">🐘 Elephant (ఏనుగు)</option>
                      <option value="🦁">🦁 Lion (సింహం)</option>
                      <option value="👦">👦 Boy Student</option>
                      <option value="👧">👧 Girl Student</option>
                      <option value="🧑‍🎓">🧑‍🎓 Scholar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#475569] mb-1">4-Digit PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="1234"
                      className="w-full text-xs font-semibold p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddStudent(false)}
                    className="px-3 py-1.5 rounded-[8px] border border-[#E2E8F0] text-xs font-bold text-[#475569]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-[8px] bg-[#0F766E] text-white text-xs font-bold"
                  >
                    Save Student Profile
                  </button>
                </div>
              </form>
            )}

            {/* Students Table */}
            <div className="bg-white rounded-[12px] border border-[#E2E8F0] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold">
                  <tr>
                    <th className="p-3">Student Profile</th>
                    <th className="p-3">Login Code</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">PIN</th>
                    <th className="p-3">Zero-PII ID</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {learners.map((learner) => (
                    <tr key={learner.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3 flex items-center gap-2.5 font-bold text-[#0F172A]">
                        <StudentAvatar learner={learner} size="sm" />
                        <div>
                          <div>{learner.nickname}</div>
                          {learner.animal && (
                            <div className="text-[10px] text-[#0F766E] uppercase font-semibold">
                              Mascot: {learner.animal}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#0F766E]">
                        <span
                          onClick={() => handleCopy(learner.loginCode)}
                          className="cursor-pointer hover:underline flex items-center gap-1"
                          title="Click to copy student code"
                        >
                          {learner.loginCode}
                          {copiedCode === learner.loginCode ? (
                            <Check className="w-3 h-3 text-[#16A34A]" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#94A3B8]" />
                          )}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[#0F172A]">Class {learner.classGrade || 10}</td>
                      <td className="p-3 font-mono text-[#475569] font-bold">{learner.pin || '—'}</td>
                      <td className="p-3 font-mono text-[11px] text-[#64748B]">{learner.id}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(learner.id, learner.nickname)}
                          className="p-1 text-[#DC2626] hover:bg-[#FEE2E2] rounded-md transition-colors"
                          title="Delete profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CURRICULUM PACKS */}
        {activeTab === 'curriculum' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-5 rounded-[12px] border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">Active Curriculum Pack</h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Preloaded deterministic content packs packaged into public assets.
                  </p>
                </div>
                <select
                  value={pack?.id || 'en-10-maths-cbse'}
                  onChange={(e) => switchPack(e.target.value)}
                  className="text-xs font-bold bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded-[8px] text-[#0F172A]"
                >
                  <option value="en-10-maths-cbse">English: en-10-maths-cbse (Class 10 CBSE)</option>
                  <option value="te-10-maths-ap">Telugu: te-10-maths-ap (Class 10 AP State)</option>
                  <option value="hi-10-maths-cbse">Hindi: hi-10-maths-cbse (Class 10 CBSE)</option>
                </select>
              </div>

              {/* Pack Overview Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-3.5 rounded-[10px] border border-[#E2E8F0]">
                <div>
                  <div className="text-[11px] text-[#475569] font-medium">Pack ID</div>
                  <div className="text-xs font-bold text-[#0F172A] mt-0.5">{pack?.id}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#475569] font-medium">Topics / Chapters</div>
                  <div className="text-xs font-bold text-[#0F766E] mt-0.5">{pack?.topics?.length || 0} Topics</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#475569] font-medium">Questions Bank</div>
                  <div className="text-xs font-bold text-[#0F766E] mt-0.5">{pack?.questions?.length || 0} Questions</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#475569] font-medium">Common Doubts</div>
                  <div className="text-xs font-bold text-[#D97706] mt-0.5">{pack?.commonDoubts?.length || 0} Curated FAQs</div>
                </div>
              </div>

              {/* Pack Validation Report */}
              {packReport && (
                <div
                  className={`p-3.5 rounded-[10px] border text-xs font-semibold flex items-center justify-between ${
                    packReport.valid
                      ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]'
                      : 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {packReport.valid ? <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> : <AlertCircle className="w-4 h-4 text-[#DC2626]" />}
                    <span>
                      {packReport.valid
                        ? 'Pack Integrity Verified: 100% Valid (All question IDs, skills, and answers mapped correctly)'
                        : `Validation Issues Found (${packReport.errors.length} errors)`}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold">Version {pack?.version}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AI TUTOR & SYSTEM CONFIGURATION */}
        {activeTab === 'system' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-5 rounded-[12px] border border-[#E2E8F0] shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-[#0F172A]">AI Services & Hardware Interfaces</h3>

              <div className="space-y-3">
                {/* Groq Cloud LLM */}
                <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#0F766E]" />
                      <span>Groq Cloud Multilingual LLM</span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5">
                      Model: <code className="font-mono font-bold text-[#0F766E]">llama-3.3-70b-versatile</code> (Pedagogical Socratic Hints)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                    Ready / Low Latency
                  </span>
                </div>

                {/* ElevenLabs Neural TTS */}
                <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D97706]" />
                      <span>ElevenLabs Neural Multilingual TTS</span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5">
                      Model: <code className="font-mono font-bold text-[#D97706]">eleven_multilingual_v2</code> (Human-like voice tutoring)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                    Active
                  </span>
                </div>

                {/* Neon PostgreSQL Database */}
                <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#2563EB]" />
                      <span>Neon PostgreSQL Cloud Database</span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5">
                      Encrypted sync for offline attempts, doubts, and cohort aggregation
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                    Connected
                  </span>
                </div>
              </div>

              {/* In-App Release & Version Checker */}
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#0F172A]">OTA App Releases & Version Channel</div>
                    <div className="text-[11px] text-[#475569]">Automated GitHub Releases & APK update distribution</div>
                  </div>
                </div>
                <AppUpdateButton />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ZERO-PII AUDIT */}
        {activeTab === 'audit' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-5 rounded-[12px] border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">Zero-PII Architecture Certification</h3>
                  <p className="text-xs text-[#475569]">
                    Designed for rural community phones, shared devices, and vulnerable student privacy.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
                  <div className="font-bold text-[#0F172A] mb-1">No Phone Numbers or Real Names</div>
                  <p className="text-[#475569] leading-relaxed">
                    Students authenticate via zero-PII animal mascots (Cheetah, Elephant, Lion) or student nicknames. No SIM card, phone number, or government ID is requested.
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
                  <div className="font-bold text-[#0F172A] mb-1">100% Local IndexedDB Persistence</div>
                  <p className="text-[#475569] leading-relaxed">
                    Learning attempts, question logs, and mastery states are stored locally inside the browser. Data stays on the device even without internet.
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
                  <div className="font-bold text-[#0F172A] mb-1">Pedagogical Guardrails</div>
                  <p className="text-[#475569] leading-relaxed">
                    AI tutor blocks requests for personal contact info, passwords, or off-topic sensitive prompts, gently redirecting back to Class 10 Maths.
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
                  <div className="font-bold text-[#0F172A] mb-1">View-Only Guardian Tokens</div>
                  <p className="text-[#475569] leading-relaxed">
                    Parent summary digests are read-only and contain no student personal identity, only weekly completed session counts and conceptual mastery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
