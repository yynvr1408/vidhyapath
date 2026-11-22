// Student Personal Academic Dashboard (Level 5)
// Elevated with exact Material Design tokens, Socratic AI Bento & Course Carousel
import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  FolderDown,
  ArrowRight,
  Sparkles,
  Wifi,
  RefreshCw,
  Mic,
  Video,
  FileText,
  Timer,
  Play,
  Lightbulb,
  Radio,
  Bell,
  DownloadCloud,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useAcademic } from '../../context/AcademicContext';
import { useApp } from '../../context/AppContext';
import { Subject } from '../../types/enterprise';
import { getTranslations } from '../../utils/translations';

interface StudentDashboardProps {
  onOpenSubject: (subject: Subject) => void;
  onOpenAiTutor: (prefilledQuery?: string) => void;
  onOpenOfflineCenter: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenSubject,
  onOpenAiTutor,
  onOpenOfflineCenter,
}) => {
  const { user } = useEnterpriseAuth();
  const { subjects, completedTopicIds } = useAcademic();
  const { currentLanguage, switchLanguage, triggerSync } = useApp();
  const t = getTranslations(currentLanguage);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const profile = user?.studentProfile;
  const studentName = user?.fullName || 'Aarav Sharma';
  const schoolName = user?.institutionName || 'Govt High School, Hyderabad';
  const classLabel = profile?.classGrade ? `Class ${profile.classGrade}-A` : 'Class 10-A';

  const handleRefreshSync = async () => {
    setIsSyncing(true);
    try {
      await triggerSync?.();
      setSyncToast('All content synchronized with Vidyapath Cloud (just now)');
    } catch (e) {
      setSyncToast('Cached locally in IndexedDB (Offline ready)');
    } finally {
      setTimeout(() => setIsSyncing(false), 900);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-4 max-w-4xl mx-auto">
      {/* 1. Top Greeting & Institution Profile Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#131b2e] tracking-tight">
              Namaste, {studentName}
            </h1>
            <span aria-hidden="true" className="text-xl select-none">🙏</span>
          </div>
          <p className="text-xs text-[#3e4947] font-medium truncate mt-0.5">
            {classLabel} • {schoolName}
          </p>
        </div>

        {/* Multilingual Script Pill */}
        <button
          type="button"
          onClick={() => {
            const nextLang = currentLanguage === 'en' ? 'te' : currentLanguage === 'te' ? 'hi' : 'en';
            switchLanguage(nextLang);
          }}
          className="h-9 px-3 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#005c55] text-xs font-bold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer shadow-2xs"
          title="Toggle Language (English • తెలుగు • हिंदी)"
        >
          <span className="text-[14px]">🌐</span>
          <span>{currentLanguage === 'te' ? 'తెలుగు • EN' : currentLanguage === 'hi' ? 'हिंदी • EN' : 'EN • తె • हि'}</span>
        </button>
      </div>

      {/* 2. Connectivity & Sync State Strip */}
      <div className="bg-[#f2f3ff] rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#005c55] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#005c55]" />
          </span>
          <div className="flex items-center gap-1.5 truncate text-xs">
            <span className="font-extrabold text-[#131b2e]">Online</span>
            <span className="text-[#3e4947] font-medium truncate">
              • All content synced (2m ago)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefreshSync}
          disabled={isSyncing}
          aria-label="Refresh synchronization status"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#3e4947] hover:bg-[#eaedff] active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-[#005c55] ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {syncToast && (
        <div className="p-2.5 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-xs font-bold text-[#15803D] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* 3. Today's Learning Overview Bento */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#CBD5E1]/60 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#005c55]" />
            <h2 className="font-extrabold text-sm sm:text-base text-[#131b2e]">
              Today's Academic Pace
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#ffdcc3] text-[#6e3900] text-[11px] font-black uppercase tracking-wider">
            Active Streak: 6 Days
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Metric Card 1: Completed Topics */}
          <div className="bg-[#eaedff] rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3e4947]">Topics Goal</span>
              <span className="w-6 h-6 rounded-full bg-[#80d5cb]/40 flex items-center justify-center text-[#005c55]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#131b2e]">3</span>
              <span className="text-xs font-bold text-[#3e4947]">/ 4 done</span>
            </div>
            <div className="w-full bg-[#dae2fd] h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#005c55] h-full rounded-full" style={{ width: '75%' }} />
            </div>
          </div>

          {/* Metric Card 2: Pending Tasks */}
          <div className="bg-[#eaedff] rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3e4947]">Due Today</span>
              <span className="w-6 h-6 rounded-full bg-[#ffdcc3] flex items-center justify-center text-[#904d00]">
                <Timer className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#904d00]">1</span>
              <span className="text-xs font-bold text-[#131b2e]">Quiz due</span>
            </div>
            <p className="text-[11px] text-[#904d00] font-bold mt-2 truncate">
              Closes tonight • 9:00 PM
            </p>
          </div>
        </div>
      </div>

      {/* 4. Socratic AI Tutor Quick Action Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f766e] to-[#283044] p-4 sm:p-5 text-white shadow-md flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#904d00] flex items-center justify-center shadow-md text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white">Ask Vidhyapath AI</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[#a3faef] text-[10px] font-black uppercase">
                  Socratic
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium">
                Multilingual Voice &amp; Concept Assistance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenAiTutor()}
            aria-label="Mic input for AI"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Socratic Preset Prompts (Quick Pills) */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-wide">
            Suggested Socratic Inquiries:
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-[#131b2e]">
            <button
              type="button"
              onClick={() => onOpenAiTutor("Newton's 3rd Law in Telugu")}
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#f2f3ff] text-xs font-bold whitespace-nowrap active:scale-95 transition-all shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="text-[#904d00] font-black">తె</span>
              <span>Newton's 3rd Law in Telugu</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAiTutor('Explain quadratic roots step by step')}
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#f2f3ff] text-xs font-bold whitespace-nowrap active:scale-95 transition-all shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="text-[#005c55] font-black">∑</span>
              <span>Solve Quadratic Roots</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAiTutor('Practice Biology Quiz')}
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#f2f3ff] text-xs font-bold whitespace-nowrap active:scale-95 transition-all shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="text-[#904d00] font-black">🧬</span>
              <span>Practice Biology Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Continue Learning Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#005c55]" />
          <h2 className="text-base sm:text-lg font-black text-[#131b2e]">
            Continue Learning
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            if (subjects.length > 0) onOpenSubject(subjects[0]);
          }}
          className="text-xs font-bold text-[#005c55] hover:underline cursor-pointer"
        >
          View All Subjects
        </button>
      </div>

      {/* 6. Horizontal Course Modules Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x scrollbar-none">
        {/* Module 1: Physics */}
        <div className="w-[260px] shrink-0 bg-white rounded-2xl p-4 shadow-xs border border-[#CBD5E1]/60 snap-start flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#80d5cb]/30 flex items-center justify-center text-[#005c55]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="px-2 py-0.5 rounded-full bg-[#ffdcc3] text-[#6e3900] text-[10px] font-black flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Downloaded</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-[#005c55] font-extrabold">Physics</span>
              <h3 className="font-extrabold text-sm text-[#131b2e] truncate">Mechanics &amp; Motion</h3>
              <p className="text-[11px] text-[#3e4947] font-medium">Unit 4: Circular Momentum</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#3e4947]">Lesson Progress</span>
              <span className="text-[#131b2e]">68%</span>
            </div>
            <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#005c55] h-full rounded-full" style={{ width: '68%' }} />
            </div>
            <button
              type="button"
              onClick={() => {
                const physicsSubj = subjects.find((s) => s.name.toLowerCase().includes('physics')) || subjects[0];
                if (physicsSubj) onOpenSubject(physicsSubj);
              }}
              className="mt-2 w-full h-10 rounded-xl bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span>Resume Module</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>

        {/* Module 2: Mathematics */}
        <div className="w-[260px] shrink-0 bg-white rounded-2xl p-4 shadow-xs border border-[#CBD5E1]/60 snap-start flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#dae2fd] flex items-center justify-center text-[#0047bf]">
                <Layers className="w-5 h-5" />
              </div>
              <div className="px-2 py-0.5 rounded-full bg-[#ffdcc3] text-[#6e3900] text-[10px] font-black flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Downloaded</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-[#0047bf] font-extrabold">Mathematics</span>
              <h3 className="font-extrabold text-sm text-[#131b2e] truncate">Trigonometric Ratios</h3>
              <p className="text-[11px] text-[#3e4947] font-medium">Unit 3: Angles &amp; Heights</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#3e4947]">Lesson Progress</span>
              <span className="text-[#131b2e]">82%</span>
            </div>
            <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0047bf] h-full rounded-full" style={{ width: '82%' }} />
            </div>
            <button
              type="button"
              onClick={() => {
                const mathSubj = subjects.find((s) => s.name.toLowerCase().includes('math')) || subjects[0];
                if (mathSubj) onOpenSubject(mathSubj);
              }}
              className="mt-2 w-full h-10 rounded-xl bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span>Resume Module</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>

        {/* Module 3: Chemistry */}
        <div className="w-[260px] shrink-0 bg-white rounded-2xl p-4 shadow-xs border border-[#CBD5E1]/60 snap-start flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#e2e7ff] flex items-center justify-center text-[#904d00]">
                <FolderDown className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={onOpenOfflineCenter}
                className="px-2 py-0.5 rounded-full bg-[#eaedff] hover:bg-[#dae2fd] text-[#3e4947] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <DownloadCloud className="w-3 h-3 text-[#005c55]" />
                <span>Save (18 MB)</span>
              </button>
            </div>
            <div>
              <span className="text-xs text-[#904d00] font-extrabold">Chemistry</span>
              <h3 className="font-extrabold text-sm text-[#131b2e] truncate">Periodic Classification</h3>
              <p className="text-[11px] text-[#3e4947] font-medium">Unit 2: Modern Trends</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#3e4947]">Lesson Progress</span>
              <span className="text-[#131b2e]">45%</span>
            </div>
            <div className="w-full bg-[#eaedff] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#904d00] h-full rounded-full" style={{ width: '45%' }} />
            </div>
            <button
              type="button"
              onClick={() => {
                const chemSubj = subjects.find((s) => s.name.toLowerCase().includes('chem')) || subjects[0];
                if (chemSubj) onOpenSubject(chemSubj);
              }}
              className="mt-2 w-full h-10 rounded-xl bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span>Resume Module</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Upcoming Deadlines & Live Sessions */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#904d00]" />
            <h2 className="text-base font-black text-[#131b2e]">Deadlines &amp; Live</h2>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#3e4947]">Next 24 Hours</span>
        </div>

        {/* Live Session Card */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#CBD5E1]/60 flex flex-col gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-black inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-pulse" />
                  LIVE AT 4:00 PM
                </span>
                <span className="text-[11px] font-bold text-[#3e4947]">Physics Dept</span>
              </div>
              <h3 className="font-extrabold text-sm text-[#131b2e] mt-1 truncate">
                Mechanics Problem Solving with Dr. Rao
              </h3>
              <p className="text-xs text-[#3e4947] font-medium">Interactive Q&amp;A Session • Audio/Video Mode</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-[#f2f3ff]">
            <button
              type="button"
              onClick={() => onOpenAiTutor('Prepare questions for Dr. Rao mechanics live session')}
              className="flex-1 h-10 rounded-xl bg-[#005c55] hover:bg-[#0f766e] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Join Audio/Video</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Reminder set for 4:00 PM Live Session')}
              aria-label="Set Reminder"
              className="w-10 h-10 rounded-xl bg-[#eaedff] hover:bg-[#dae2fd] text-[#3e4947] flex items-center justify-center active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Assignment Deadline Card */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#CBD5E1]/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-[#904d00] tracking-wider">Due Tomorrow</span>
                <span className="text-[11px] text-[#3e4947] font-medium">• 11:59 PM</span>
              </div>
              <h3 className="font-extrabold text-sm text-[#131b2e] truncate">
                Trigonometry Problem Set 3
              </h3>
              <p className="text-xs text-[#3e4947] truncate">5 Exercises • Mathematics • Offline upload supported</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const mathSubj = subjects.find((s) => s.name.toLowerCase().includes('math')) || subjects[0];
              if (mathSubj) onOpenSubject(mathSubj);
            }}
            className="h-9 px-4 rounded-xl bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] text-xs font-bold flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>

      {/* 8. Peer Knowledge Boost Notice (Community Delight) */}
      <div className="bg-[#f2f3ff] rounded-2xl p-4 flex items-center gap-3 shadow-xs border border-[#CBD5E1]/50">
        <div className="w-10 h-10 rounded-full bg-[#80d5cb]/50 text-[#00201d] flex items-center justify-center shrink-0 font-bold">
          <Lightbulb className="w-5 h-5 text-[#005c55]" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-extrabold text-xs text-[#131b2e]">Daily Reflection Question</span>
          <p className="text-xs text-[#3e4947] line-clamp-2 leading-relaxed">
            "Why does a cricketer pull hands backward while catching a fast ball?" Check the answer in Socratic AI.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenAiTutor('Why does a cricketer pull hands backward while catching a fast ball?')}
          className="text-xs font-black text-[#005c55] hover:underline shrink-0 cursor-pointer"
        >
          Explore →
        </button>
      </div>
    </div>
  );
};
