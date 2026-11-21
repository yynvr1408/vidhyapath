// Master Educational Platform Application Architecture
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { EnterpriseAuthProvider, useEnterpriseAuth } from './context/EnterpriseAuthContext';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { AppProvider } from './context/AppContext';
import { EnterpriseShell, EnterpriseScreenId } from './components/layout/EnterpriseShell';
import { SuperAdminDashboard } from './screens/dashboards/SuperAdminDashboard';
import { InstitutionAdminDashboard } from './screens/dashboards/InstitutionAdminDashboard';
import { AcademicAdminDashboard } from './screens/dashboards/AcademicAdminDashboard';
import { TeacherDashboard } from './screens/dashboards/TeacherDashboard';
import { StudentDashboard } from './screens/dashboards/StudentDashboard';
import { GuardianDashboard } from './screens/dashboards/GuardianDashboard';
import { SubjectEnvironmentScreen } from './screens/lms/SubjectEnvironmentScreen';
import { AiTutorPortal } from './screens/ai/AiTutorPortal';
import { SyllabusManagerScreen } from './screens/academic/SyllabusManagerScreen';
import { OfflineLearningCenter } from './screens/offline/OfflineLearningCenter';
import { Subject } from './types/enterprise';

// Lazy load foundation components for ultra-fast initial bundle (< 150 KB gzip)
const ProfileSelectorScreen = lazy(() =>
  import('./screens/ProfileSelectorScreen').then((m) => ({ default: m.ProfileSelectorScreen }))
);
const PracticeWeakTopicsScreen = lazy(() =>
  import('./screens/PracticeWeakTopicsScreen').then((m) => ({ default: m.PracticeWeakTopicsScreen }))
);
const MyProgressScreen = lazy(() =>
  import('./screens/MyProgressScreen').then((m) => ({ default: m.MyProgressScreen }))
);
const ParentTeacherViewScreen = lazy(() =>
  import('./screens/ParentTeacherViewScreen').then((m) => ({ default: m.ParentTeacherViewScreen }))
);

const MainAppContent: React.FC = () => {
  const { activeRole } = useEnterpriseAuth();
  const { subjects, activeSubject, setActiveSubject } = useAcademic();
  const [currentScreen, setScreen] = useState<EnterpriseScreenId>('DASHBOARD');

  // URL hash listening for direct deep linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('mascot') || hash.includes('profile')) {
        setScreen('FOUNDATION_MASCOTS');
      } else if (hash.includes('practice')) {
        setScreen('PRACTICE_ENGINE');
      } else if (hash.includes('progress') || hash.includes('lantern')) {
        setScreen('MY_PROGRESS');
      } else if (hash.includes('guardian') || hash.includes('parent')) {
        setScreen('GUARDIAN_DIGEST');
      } else if (hash.includes('syllabus')) {
        setScreen('SYLLABUS_MANAGER');
      } else if (hash.includes('offline')) {
        setScreen('OFFLINE_CENTER');
      } else if (hash.includes('tutor')) {
        setScreen('AI_TUTOR');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleOpenSubject = (subject: Subject) => {
    setActiveSubject(subject);
    setScreen('SUBJECT_VIEW');
  };

  const renderContent = () => {
    // 1. Foundation & Class 10 Mascot Screens
    if (currentScreen === 'FOUNDATION_MASCOTS') {
      return (
        <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[#64748B]">Loading Mascot Profiles...</div>}>
          <ProfileSelectorScreen />
        </Suspense>
      );
    }

    if (currentScreen === 'PRACTICE_ENGINE') {
      return (
        <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[#64748B]">Loading Practice Session...</div>}>
          <PracticeWeakTopicsScreen />
        </Suspense>
      );
    }

    if (currentScreen === 'MY_PROGRESS') {
      return (
        <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[#64748B]">Loading Mastery & Lanterns...</div>}>
          <MyProgressScreen />
        </Suspense>
      );
    }

    if (currentScreen === 'GUARDIAN_DIGEST') {
      return (
        <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[#64748B]">Loading Guardian Digest...</div>}>
          <ParentTeacherViewScreen />
        </Suspense>
      );
    }

    // 2. Dedicated Academic Operational Screens
    if (currentScreen === 'SUBJECT_VIEW') {
      const sub = activeSubject || subjects[0];
      if (!sub) {
        return (
          <StudentDashboard
            onOpenSubject={handleOpenSubject}
            onOpenAiTutor={() => setScreen('AI_TUTOR')}
            onOpenOfflineCenter={() => setScreen('OFFLINE_CENTER')}
          />
        );
      }
      return (
        <SubjectEnvironmentScreen
          subject={sub}
          onBack={() => setScreen('DASHBOARD')}
          onOpenAiTutor={() => setScreen('AI_TUTOR')}
        />
      );
    }

    if (currentScreen === 'AI_TUTOR') {
      return <AiTutorPortal onBack={() => setScreen('DASHBOARD')} />;
    }

    if (currentScreen === 'SYLLABUS_MANAGER') {
      return <SyllabusManagerScreen />;
    }

    if (currentScreen === 'OFFLINE_CENTER') {
      return <OfflineLearningCenter onBack={() => setScreen('DASHBOARD')} />;
    }

    // 3. Role-Based Primary Dashboards
    switch (activeRole) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'institution_admin':
        return <InstitutionAdminDashboard onNavigateToSyllabus={() => setScreen('SYLLABUS_MANAGER')} />;
      case 'academic_admin':
      case 'coordinator':
      case 'exam_admin':
        return <AcademicAdminDashboard onNavigateToSyllabus={() => setScreen('SYLLABUS_MANAGER')} />;
      case 'teacher':
        return (
          <TeacherDashboard
            onOpenSubject={handleOpenSubject}
            onOpenAiTutor={() => setScreen('AI_TUTOR')}
          />
        );
      case 'guardian':
        return <GuardianDashboard />;
      case 'student':
      default:
        return (
          <StudentDashboard
            onOpenSubject={handleOpenSubject}
            onOpenAiTutor={() => setScreen('AI_TUTOR')}
            onOpenOfflineCenter={() => setScreen('OFFLINE_CENTER')}
          />
        );
    }
  };

  return (
    <EnterpriseShell currentScreen={currentScreen} setScreen={setScreen}>
      {renderContent()}
    </EnterpriseShell>
  );
};

export const App: React.FC = () => {
  return (
    <EnterpriseAuthProvider>
      <AcademicProvider>
        <AppProvider>
          <MainAppContent />
        </AppProvider>
      </AcademicProvider>
    </EnterpriseAuthProvider>
  );
};

export default App;
