// Enterprise Portal Screen: Coordinates the 5 Tier Dashboards and LMS Environments
import React, { useState } from 'react';
import {
  EnterpriseShell,
  EnterpriseScreenId,
} from '../components/layout/EnterpriseShell';
import { useEnterpriseAuth } from '../context/EnterpriseAuthContext';
import { useApp } from '../context/AppContext';
import { SuperAdminDashboard } from './dashboards/SuperAdminDashboard';
import { InstitutionAdminDashboard } from './dashboards/InstitutionAdminDashboard';
import { AcademicAdminDashboard } from './dashboards/AcademicAdminDashboard';
import { TeacherDashboard } from './dashboards/TeacherDashboard';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { GuardianDashboard } from './dashboards/GuardianDashboard';
import { SubjectEnvironmentScreen } from './lms/SubjectEnvironmentScreen';
import { SyllabusManagerScreen } from './academic/SyllabusManagerScreen';
import { OfflineLearningCenter } from './offline/OfflineLearningCenter';
import { AiTutorPortal } from './ai/AiTutorPortal';
import { AdminPanelScreen } from './AdminPanelScreen';
import { Subject } from '../types/enterprise';
import { ArrowLeft, BookOpen, Sparkles, Lock, Shield } from 'lucide-react';
import { UnifiedAuthModal } from '../components/auth/UnifiedAuthModal';
import { VidyapathLogo } from '../components/VidyapathLogo';

interface EnterprisePortalScreenProps {
  onReturnToStudentApp?: () => void;
}

export const EnterprisePortalScreen: React.FC<EnterprisePortalScreenProps> = ({
  onReturnToStudentApp,
}) => {
  const { user, activeRole, loading } = useEnterpriseAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { setScreen: setAppScreen } = useApp();
  const [currentScreen, setCurrentScreen] = useState<EnterpriseScreenId>('DASHBOARD');
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);

  const handleReturn = () => {
    if (onReturnToStudentApp) {
      onReturnToStudentApp();
    } else {
      setAppScreen('MY_SYLLABUS');
    }
  };

  // The enterprise sidebar includes a few learner-loop destinations. Keep the
  // portal screen mounted only for portal views; switching loops must happen
  // from an event handler, never while React is rendering a screen.
  const handlePortalNavigation = (screen: EnterpriseScreenId) => {
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

  // Render the selected view
  const renderContent = () => {
    switch (currentScreen) {
      case 'DASHBOARD':
        return renderDashboard();
      case 'SUBJECT_VIEW':
        if (!activeSubject) {
          return renderDashboard();
        }
        return (
          <SubjectEnvironmentScreen
            subject={activeSubject}
            onBack={() => setCurrentScreen('DASHBOARD')}
            onOpenAiTutor={() => setCurrentScreen('AI_TUTOR')}
          />
        );
      case 'SYLLABUS_MANAGER':
        return <SyllabusManagerScreen />;
      case 'OFFLINE_CENTER':
        return <OfflineLearningCenter onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'AI_TUTOR':
        return <AiTutorPortal onBack={() => setCurrentScreen('DASHBOARD')} />;
      case 'FOUNDATION_MASCOTS':
      case 'PRACTICE_ENGINE':
      case 'MY_PROGRESS':
        // These destinations are dispatched by handlePortalNavigation.
        return renderDashboard();
      case 'INSTITUTIONS_QUEUE':
      case 'USERS_DIRECTORY':
      case 'AUDIT_LOGS':
        return <SuperAdminDashboard />;
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
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#0F766E] hover:bg-[#F0FDFA] font-bold transition-all shadow-2xs active:scale-95"
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
