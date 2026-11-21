// Master Educational Platform Application Architecture
import React, { useState } from 'react';
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

const MainAppContent: React.FC = () => {
  const { activeRole } = useEnterpriseAuth();
  const { subjects, activeSubject, setActiveSubject } = useAcademic();
  const [currentScreen, setScreen] = useState<EnterpriseScreenId>('DASHBOARD');

  const handleOpenSubject = (subject: Subject) => {
    setActiveSubject(subject);
    setScreen('SUBJECT_VIEW');
  };

  const renderContent = () => {
    // 1. Dedicated Operational Screens
    if (currentScreen === 'SUBJECT_VIEW') {
      const sub = activeSubject || subjects[0];
      if (!sub) return <StudentDashboard onOpenSubject={handleOpenSubject} onOpenAiTutor={() => setScreen('AI_TUTOR')} onOpenOfflineCenter={() => setScreen('OFFLINE_CENTER')} />;
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

    // 2. Role-Based Primary Dashboards
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
