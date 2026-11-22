// Enterprise Portal Screen: Coordinates the Multi-Tier Role Dashboards, LMS Environments & Administrative Queues
import React, { useState, useEffect } from 'react';
import {
  EnterpriseShell,
  EnterpriseScreenId,
} from '../components/layout/EnterpriseShell';
import { useEnterpriseAuth } from '../context/EnterpriseAuthContext';
import { useApp } from '../context/AppContext';
import { useAcademic } from '../context/AcademicContext';
import { SuperAdminDashboard } from './dashboards/SuperAdminDashboard';
import { InstitutionAdminDashboard } from './dashboards/InstitutionAdminDashboard';
import { AcademicAdminDashboard } from './dashboards/AcademicAdminDashboard';
import { TeacherDashboard } from './dashboards/TeacherDashboard';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { GuardianDashboard } from './dashboards/GuardianDashboard';
import { GuardianDigestScreen } from './dashboards/GuardianDigestScreen';
import { SubjectEnvironmentScreen } from './lms/SubjectEnvironmentScreen';
import { AssignmentsHubScreen } from './lms/AssignmentsHubScreen';
import { SyllabusManagerScreen } from './academic/SyllabusManagerScreen';
import { OfflineLearningCenter } from './offline/OfflineLearningCenter';
import { AiTutorPortal } from './ai/AiTutorPortal';
import { InstitutionsQueueScreen } from './admin/InstitutionsQueueScreen';
import { UsersDirectoryScreen } from './admin/UsersDirectoryScreen';
import { AuditLogsScreen } from './admin/AuditLogsScreen';
import { AnnouncementsScreen } from './admin/AnnouncementsScreen';
import { Subject } from '../types/enterprise';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Lock,
  Shield,
  Layers,
  ChevronRight,
  GraduationCap,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { UnifiedAuthModal } from '../components/auth/UnifiedAuthModal';
import { navigationManager } from '../services/navigationManager';

interface EnterprisePortalScreenProps {
  onReturnToStudentApp?: () => void;
}

const PORTAL_SCREENS: EnterpriseScreenId[] = [
  'DASHBOARD', 'SUBJECT_VIEW', 'AI_TUTOR', 'SYLLABUS_MANAGER',
  'OFFLINE_CENTER', 'FOUNDATION_MASCOTS', 'PRACTICE_ENGINE', 'MY_PROGRESS',
  'GUARDIAN_DIGEST', 'INSTITUTIONS_QUEUE', 'USERS_DIRECTORY', 'AUDIT_LOGS',
  'ASSIGNMENTS', 'ANNOUNCEMENTS',
];

const screenFromHash = (): EnterpriseScreenId => {
  const candidate = window.location.hash.replace(/^#portal\//, '').toUpperCase() as EnterpriseScreenId;
  return PORTAL_SCREENS.includes(candidate) ? candidate : 'DASHBOARD';
};

export const EnterprisePortalScreen: React.FC<EnterprisePortalScreenProps> = ({
  onReturnToStudentApp,
}) => {
  const { user, activeRole, loading, logout } = useEnterpriseAuth();
  const { setScreen: setAppScreen } = useApp();
  const { subjects } = useAcademic();

  const [currentScreen, setCurrentScreen] = useState<EnterpriseScreenId>(screenFromHash);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleReturn = () => {
    if (onReturnToStudentApp) {
      onReturnToStudentApp();
    } else {
      setAppScreen('MY_SYLLABUS');
    }
  };

  // Synchronize URL hash when screen changes
  useEffect(() => {
    if (user) {
      window.location.hash = `#portal/${currentScreen.toLowerCase()}`;
    }
  }, [currentScreen, user]);

  // Keep browser back/forward and direct portal links in sync with the selected tab.
  useEffect(() => {
    const syncPortalRoute = () => {
      if (window.location.hash.startsWith('#portal/')) {
        setCurrentScreen(screenFromHash());
      }
    };
    window.addEventListener('hashchange', syncPortalRoute);
    return () => window.removeEventListener('hashchange', syncPortalRoute);
  }, []);

  // Register hierarchical back-button handler inside Enterprise Portal
  useEffect(() => {
    const unregister = navigationManager.registerBackHandler(() => {
      // If modal is open, let modal handle it
      if (authModalOpen) {
        setAuthModalOpen(false);
        return true;
      }

      // If in deep portal screen, navigate back to DASHBOARD
      if (currentScreen !== 'DASHBOARD') {
        setCurrentScreen('DASHBOARD');
        return true;
      }

      // If at root DASHBOARD, return to student learning loop
      handleReturn();
      return true;
    }, 45);

    return () => unregister();
  }, [currentScreen, authModalOpen, onReturnToStudentApp]);

  // GATING 1: Loading state during session restoration
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-extrabold text-[#0F172A]">Verifying Vidyapath Portal Session...</h2>
        <p className="text-xs text-[#64748B] mt-1 font-medium">Restoring encrypted role credentials</p>
      </div>
    );
  }

  // GATING 2: Unauthenticated User Gate (Require login to access portal)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 text-[#0F172A]">
        <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-xl max-w-md w-full p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-[#0F172A]">Vidyapath Enterprise Portal</h1>
            <p className="text-xs text-[#64748B] mt-1 font-medium leading-relaxed">
              Authentication required. Sign in with your institutional credentials (Administrator, Teacher, Guardian, or Student) to access your portal.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Sign In with Email or Roll Number</span>
            </button>

            <button
              type="button"
              onClick={handleReturn}
              className="w-full py-3 px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Student Learning App</span>
            </button>
          </div>
        </div>

        <UnifiedAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialRole="admin"
        />
      </div>
    );
  }

  // Navigation dispatcher from sidebar/drawer
  const handlePortalNavigation = (screen: EnterpriseScreenId) => {
    // If selecting student-learning loop destinations
    if (screen === 'PRACTICE_ENGINE' || screen === 'MY_PROGRESS' || screen === 'FOUNDATION_MASCOTS') {
      setAppScreen(screen === 'PRACTICE_ENGINE' ? 'PRACTICE' : screen === 'MY_PROGRESS' ? 'PROGRESS' : 'PARENT_VIEW');
      return;
    }
    setCurrentScreen(screen);
  };

  // Render role-specific main dashboard
  const renderDashboard = () => {
    switch (activeRole) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'institution_admin':
        return (
          <InstitutionAdminDashboard
            onNavigateToSyllabus={() => setCurrentScreen('SYLLABUS_MANAGER')}
          />
        );
      case 'academic_admin':
      case 'coordinator':
      case 'exam_admin':
        return <AcademicAdminDashboard />;
      case 'teacher':
        return (
          <TeacherDashboard
            onOpenSubject={(subj) => {
              setActiveSubject(subj);
              setCurrentScreen('SUBJECT_VIEW');
            }}
            onOpenAiTutor={() => setCurrentScreen('AI_TUTOR')}
          />
        );
      case 'student':
        return (
          <StudentDashboard
            onOpenSubject={(subj) => {
              setActiveSubject(subj);
              setCurrentScreen('SUBJECT_VIEW');
            }}
            onOpenAiTutor={() => setCurrentScreen('AI_TUTOR')}
            onOpenOfflineCenter={() => setCurrentScreen('OFFLINE_CENTER')}
          />
        );
      case 'guardian':
        return <GuardianDashboard />;
      default:
        return <SuperAdminDashboard />;
    }
  };

  // Render Subject Classroom View (Handles Problem 2: Never fall through silently when !activeSubject)
  const renderSubjectClassroom = () => {
    if (activeSubject) {
      return (
        <SubjectEnvironmentScreen
          subject={activeSubject}
          onBack={() => {
            setActiveSubject(null);
            setCurrentScreen('DASHBOARD');
          }}
          onOpenAiTutor={() => setCurrentScreen('AI_TUTOR')}
        />
      );
    }

    // No active subject selected yet: render Subject Selection Grid
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentScreen('DASHBOARD')}
              className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <Layers className="w-6 h-6 text-[#0F766E]" />
                Subject Classroom &amp; Course Materials
              </h1>
              <p className="text-xs text-[#64748B] font-medium">
                Select a registered course subject to access video lectures, topic handouts, and practice sets.
              </p>
            </div>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center max-w-lg mx-auto space-y-3">
            <BookOpen className="w-12 h-12 text-[#94A3B8] mx-auto opacity-60" />
            <h3 className="font-extrabold text-base text-[#0F172A]">No Enrolled Subjects Available</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Your profile is not yet linked to specific subject curricula. Upload a syllabus or enroll in a course from the curriculum manager.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('SYLLABUS_MANAGER')}
                className="px-4 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-2xs hover:bg-[#115E59]"
              >
                Go to Syllabus Manager
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => (
              <div
                key={subj.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#0F766E] hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded-md border border-[#0F766E]/20">
                    {subj.code}
                  </span>
                  <h3 className="font-extrabold text-base text-[#0F172A] mt-2 leading-snug">
                    {subj.name}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1">
                    Semester {subj.semester} · {subj.credits} Credits
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#475569]">
                    {subj.credits} Credits
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSubject(subj)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Enter Classroom</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render the selected view (All tabs have real, dedicated working screens)
  const renderContent = () => {
    switch (currentScreen) {
      case 'DASHBOARD':
        return renderDashboard();
      case 'SUBJECT_VIEW':
        return renderSubjectClassroom();
      case 'SYLLABUS_MANAGER':
        return <SyllabusManagerScreen />;
      case 'OFFLINE_CENTER':
        return <OfflineLearningCenter onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'AI_TUTOR':
        return <AiTutorPortal onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'INSTITUTIONS_QUEUE':
        return <InstitutionsQueueScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'USERS_DIRECTORY':
        return <UsersDirectoryScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'AUDIT_LOGS':
        return <AuditLogsScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'ASSIGNMENTS':
        return <AssignmentsHubScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'ANNOUNCEMENTS':
        return <AnnouncementsScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'GUARDIAN_DIGEST':
        return <GuardianDigestScreen onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'FOUNDATION_MASCOTS':
      case 'PRACTICE_ENGINE':
      case 'MY_PROGRESS':
        // These destinations are handled by handlePortalNavigation
        return renderDashboard();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#F8FAFC]">
      {/* Top Banner to jump between Enterprise Portal and Student Learning Loop */}
      <div className="sticky top-0 z-50 bg-[#0F766E] text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#CCFBF1]" />
          <span>Vidyapath Enterprise Administration &amp; LMS Portal</span>
        </div>
        <button
          type="button"
          onClick={handleReturn}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#0F766E] hover:bg-[#F0FDFA] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Student Learning App</span>
        </button>
      </div>

      <EnterpriseShell currentScreen={currentScreen} setScreen={handlePortalNavigation}>
        {renderContent()}
      </EnterpriseShell>
    </div>
  );
};
