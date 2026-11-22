import React from 'react';
import {
  GraduationCap,
  Users,
  Building2,
  Shield,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  KeyRound,
  FileText,
  Globe,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { VidyapathLogo } from '../components/VidyapathLogo';
import { LanguageSelector } from '../components/LanguageSelector';
import { AppUpdateHeaderPill } from '../components/AppUpdateHeaderPill';
import { AppUpdateBanner } from '../components/AppUpdateBanner';
import { useApp } from '../context/AppContext';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { getTranslations } from '../utils/translations';
import type { AuthRole } from '../types/auth';

interface WebsiteLandingScreenProps {
  onNavigateToAuth: (role?: AuthRole, mode?: 'login' | 'register') => void;
  onOpenLearnerApp: () => void;
}

export const WebsiteLandingScreen: React.FC<WebsiteLandingScreenProps> = ({
  onNavigateToAuth,
  onOpenLearnerApp,
}) => {
  const { currentLanguage } = useApp();
  const t = getTranslations(currentLanguage);
  const { currentVersion, openModal } = useAppUpdate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between selection:bg-[#CCFBF1] selection:text-[#0F766E]">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <VidyapathLogo size="sm" showWordmark={true} />
          </div>

          {/* Center Navigation Links (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-[#475569]">
            <a href="#curriculum" className="hover:text-[#0F766E] transition-colors">
              {currentLanguage === 'te' ? 'సిలబస్ (1-10 ఉచితం)' : currentLanguage === 'hi' ? 'पाठ्यक्रम (1-10 निःशुल्क)' : 'Class 1-10 (Free)'}
            </a>
            <a href="#institutions" className="hover:text-[#0F766E] transition-colors">
              {currentLanguage === 'te' ? 'సంస్థల LMS' : currentLanguage === 'hi' ? 'संस्थान LMS' : 'Institutional LMS'}
            </a>
            <a href="#tutor" className="hover:text-[#0F766E] transition-colors">
              {currentLanguage === 'te' ? 'AI ట్యూటర్' : currentLanguage === 'hi' ? 'AI ट्यूटर' : 'Vernacular AI Tutor'}
            </a>
            <a href="#features" className="hover:text-[#0F766E] transition-colors">
              {currentLanguage === 'te' ? 'ఫీచర్లు' : currentLanguage === 'hi' ? 'विशेषताएं' : 'Features'}
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Native 22-Language Script Selector */}
            <LanguageSelector variant="compact" />

            {/* App Update Pill */}
            <AppUpdateHeaderPill />

            {/* Direct Web Portal Login Button */}
            <button
              type="button"
              onClick={() => onNavigateToAuth('student', 'login')}
              className="hidden sm:inline-flex py-2 px-3.5 rounded-xl bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] border border-[#CCFBF1] text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Sign In
            </button>

            {/* Primary Action Button: Open Learner App */}
            <button
              type="button"
              onClick={onOpenLearnerApp}
              className="py-2 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'te' ? 'వెబ్ లెర్నింగ్ ఓపెన్ చేయి' : currentLanguage === 'hi' ? 'वेब लर्निंग खोलें' : 'Open Web Learning'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating In-App Update Banner */}
      <AppUpdateBanner />

      {/* 2. Hero Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          {/* Official Accreditation / Free Tag Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span>
              {currentLanguage === 'te'
                ? 'భారతదేశం అంతటా 1–10 తరగతులు 100% ఉచితం • SSC & CBSE'
                : currentLanguage === 'hi'
                ? 'अखिल भारतीय स्तर पर कक्षा 1–10 100% निःशुल्क • SSC एवं CBSE'
                : 'Classes 1–10 100% Free Pan-India • State SSC & CBSE'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
            {currentLanguage === 'te' ? (
              <>
                ప్రతి విద్యార్థికి సమగ్ర విద్య — <br />
                <span className="text-[#0F766E]">మాతృభాష AI ట్యూటర్ &amp; సంస్థాగత LMS</span>
              </>
            ) : currentLanguage === 'hi' ? (
              <>
                प्रत्येक विद्यार्थी के लिए समग्र शिक्षा — <br />
                <span className="text-[#0F766E]">मातृभाषा AI ट्यूटर एवं संस्थागत LMS</span>
              </>
            ) : (
              <>
                The Last-Mile Vernacular Tutor &amp; <br />
                <span className="text-[#0F766E]">Unified Institutional Educational Grid</span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-[#475569] font-medium max-w-2xl mx-auto leading-relaxed">
            {currentLanguage === 'te'
              ? 'ఆఫ్‌లైన్‌లో పనిచేసే సురక్షిత జీరో-డేటా లెర్నింగ్, తెలుగు, హిందీ మరియు ఇంగ్లీష్ వాయిస్ బోధన, మరియు పాఠశాలలు/కళాశాలల పూర్తి విద్యా నిర్వహణ పోర్టల్.'
              : currentLanguage === 'hi'
              ? 'ऑफ़लाइन समर्थित सुरक्षित जीरो-डेटा लर्निंग, हिंदी, तेलुगु और अंग्रेजी आवाज अध्यापन, तथा संस्थानों के लिए सम्पूर्ण शैक्षणिक प्रबंधन पोर्टल।'
              : 'Zero-PII offline-ready student learning, trilingual AI voice tutoring (Telugu, Hindi, English), and full multi-tier LMS for schools and universities.'}
          </p>

          {/* Primary CTA Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={onOpenLearnerApp}
              className="py-3 px-6 rounded-2xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-extrabold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{currentLanguage === 'te' ? 'విద్యార్థి అభ్యాసం ప్రారంభించండి' : currentLanguage === 'hi' ? 'छात्र अध्ययन शुरू करें' : 'Start Student Learning'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateToAuth('admin', 'login')}
              className="py-3 px-6 rounded-2xl bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] text-sm font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-[#0F766E]" />
              <span>{currentLanguage === 'te' ? 'సంస్థ & ఉపాధ్యాయుల పోర్టల్' : currentLanguage === 'hi' ? 'संस्थान एवं शिक्षक पोर्टल' : 'Institution & Teacher Portal'}</span>
            </button>

          </div>
        </div>
      </section>

      {/* 3. Role-Based Portals Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {currentLanguage === 'te' ? 'అన్ని పాత్రలకు ప్రత్యేక ప్రవేశ ద్వారాలు' : currentLanguage === 'hi' ? 'सभी भूमिकाओं के लिए समर्पित पोर्टल' : 'Dedicated Portals for Every Educational Role'}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] font-medium max-w-xl mx-auto">
            {currentLanguage === 'te'
              ? 'విద్యార్థులు, తల్లిదండ్రులు, ఉపాధ్యాయులు, మరియు సంస్థల నిర్వాహకులకు వారి పరిధి మేరకే స్పష్టమైన యాక్సెస్.'
              : currentLanguage === 'hi'
              ? 'विद्यार्थी, अभिभावक, शिक्षक और संस्थागत प्रशासकों के लिए सुव्यवस्थित और सुरक्षित भूमिका-आधारित पहुंच।'
              : 'Granular Role-Based Access Control (RBAC) ensuring every user navigates within their authorized scope.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Portal Card 1: Students */}
          <div className="bg-white p-5 rounded-3xl border border-[#CBD5E1] hover:border-[#0F766E] shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] flex items-center justify-center font-bold">
                  <GraduationCap className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D]">
                  Classes 1–10 Free
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-[#0F172A]">Student Learning Portal</h3>
              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                Self-paced mastery, daily practice, vernacular AI doubt solver in Telugu, Hindi, and English. No personal data or phone number required.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={onOpenLearnerApp}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#115E59] cursor-pointer text-center"
              >
                Open Learner App →
              </button>
              <button
                type="button"
                onClick={() => onNavigateToAuth('student', 'register')}
                className="py-2.5 px-3 rounded-xl bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] text-xs font-bold hover:bg-[#CCFBF1] cursor-pointer"
              >
                Create Profile
              </button>
            </div>
          </div>

          {/* Portal Card 2: Parents & Guardians */}
          <div className="bg-white p-5 rounded-3xl border border-[#CBD5E1] hover:border-[#0F766E] shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#F0FDFA] text-[#0F766E]">
                  Home Learning Oversight
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-[#0F172A]">Parent &amp; Guardian Digest</h3>
              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                Monitor independent home study progress, review chapter mastery, accuracy trends, and receive personalized parent-child practice activities.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => onNavigateToAuth('guardian', 'login')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#115E59] cursor-pointer text-center"
              >
                Guardian Sign In
              </button>
              <button
                type="button"
                onClick={() => onNavigateToAuth('guardian', 'register')}
                className="py-2.5 px-3 rounded-xl bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1] text-xs font-bold hover:bg-[#F1F5F9] cursor-pointer"
              >
                Register
              </button>
            </div>
          </div>

          {/* Portal Card 3: Teachers & Faculty */}
          <div className="bg-white p-5 rounded-3xl border border-[#CBD5E1] hover:border-[#0F766E] shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center font-bold">
                  <BookOpen className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#F5F3FF] text-[#7C3AED]">
                  Curriculum &amp; Tests
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-[#0F172A]">Teacher &amp; Faculty Classroom</h3>
              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                Deliver instructional materials, assign syllabus-grounded quizzes, track student weak areas, and evaluate student submissions.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => onNavigateToAuth('teacher', 'login')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] cursor-pointer text-center"
              >
                Teacher Sign In
              </button>
              <button
                type="button"
                onClick={() => onNavigateToAuth('teacher', 'register')}
                className="py-2.5 px-3 rounded-xl bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1] text-xs font-bold hover:bg-[#F1F5F9] cursor-pointer"
              >
                Register Faculty
              </button>
            </div>
          </div>

          {/* Portal Card 4: Institution Admin (Schools & Colleges) */}
          <div className="bg-white p-5 rounded-3xl border border-[#CBD5E1] hover:border-[#0F766E] shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB]">
                  Schools &amp; Colleges
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-[#0F172A]">Institution Administration (LMS)</h3>
              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                Configure classes 1–10 for free, setup custom senior secondary &amp; college programs with paid catalogs, parse syllabus PDFs, and review departments.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => onNavigateToAuth('admin', 'login')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] cursor-pointer text-center"
              >
                Institution Login
              </button>
              <button
                type="button"
                onClick={() => onNavigateToAuth('admin', 'register')}
                className="py-2.5 px-3 rounded-xl bg-[#F8FAFC] text-[#2563EB] border border-[#CBD5E1] text-xs font-bold hover:bg-[#F1F5F9] cursor-pointer"
              >
                Register School
              </button>
            </div>
          </div>
        </div>

        {/* Master Super Admin Banner */}
        <div className="bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] p-5 rounded-3xl border border-[#FDE68A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#D97706] text-white flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-[#92400E]">Platform Super Administrator Gateway</h4>
              <p className="text-xs text-[#B45309] font-medium">
                National institutional approval queue, security policies, and pan-India educational audit logs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToAuth('admin', 'login')}
            className="py-2.5 px-5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            Super Admin Sign In →
          </button>
        </div>
      </section>

      {/* 4. Curriculum & Highlights Section */}
      <section id="curriculum" className="py-12 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-base text-[#0F172A]">All 22 Scheduled Languages</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Seamless navigation in pure native scripts without confusing brackets. Core teaching and audio synthesis in Telugu, Hindi, and English.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-base text-[#0F172A]">Zero-PII Privacy Architecture</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Students can sign in locally on shared phones with animal avatars and confidential 4-digit PINs. Zero phone numbers, zero mandatory ad-trackers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-base text-[#0F172A]">Offline-First Local Storage</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Full syllabus packs and pedagogical hints persist on the phone. Practice formulas and problem-solving without active cellular data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Minimal Global Footer */}
      <footer className="py-6 border-t border-[#E2E8F0] bg-[#F8FAFC] text-center text-xs text-[#64748B]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <VidyapathLogo size="sm" showWordmark={true} />
            <span>• © 2026 Vidyapath Foundation</span>
          </div>

          <div className="flex items-center gap-4 font-bold text-[#0F766E]">
            <button type="button" onClick={() => onNavigateToAuth('student', 'login')} className="hover:underline">
              Student Login
            </button>
            <button type="button" onClick={() => onNavigateToAuth('guardian', 'login')} className="hover:underline">
              Parent View
            </button>
            <button type="button" onClick={() => onNavigateToAuth('admin', 'login')} className="hover:underline">
              Institution Portal
            </button>
            <button type="button" onClick={openModal} className="hover:underline text-[#D97706]">
              Web v{currentVersion}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
