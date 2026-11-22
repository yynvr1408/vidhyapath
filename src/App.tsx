import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { EnterpriseAuthProvider } from './context/EnterpriseAuthContext';
import { AcademicProvider } from './context/AcademicContext';
import { AppShell } from './components/AppShell';
import { ProfileSelectorScreen } from './screens/ProfileSelectorScreen';
import { MySyllabusScreen } from './screens/MySyllabusScreen';
import { AiTutorScreen } from './screens/AiTutorScreen';
import { PracticeWeakTopicsScreen } from './screens/PracticeWeakTopicsScreen';
import { MyProgressScreen } from './screens/MyProgressScreen';
import { ParentTeacherViewScreen } from './screens/ParentTeacherViewScreen';
import { EnterprisePortalScreen } from './screens/EnterprisePortalScreen';
import { S9_SettingsScreen } from './screens/S9_SettingsScreen';
import { S11_ImpactScreen } from './screens/S11_ImpactScreen';
import { S12_PackEditorScreen } from './screens/S12_PackEditorScreen';
import { S2_CreateProfile } from './screens/S2_CreateProfile';
import { useNativeBackButton } from './hooks/useNativeBackButton';
import { PhoneExitToast } from './components/PhoneExitToast';

const AppContent: React.FC = () => {
  const { currentScreen, setScreen, activeLearner } = useApp();
  const { exitToast } = useNativeBackButton();

  // Support direct route hashes: #admin, #portal, #dashboard, #guardian, etc.
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (
      hash.includes('admin') ||
      hash.includes('portal') ||
      hash.includes('dashboard') ||
      path.includes('dashboard')
    ) {
      setScreen('ADMIN');
    } else if (hash.includes('guardian') || path.includes('guardian') || hash.includes('parent')) {
      setScreen('PARENT_VIEW');
    } else if (hash.includes('tutor') || hash.includes('doubt')) {
      setScreen('AI_TUTOR');
    } else if (hash.includes('practice')) {
      setScreen('PRACTICE');
    } else if (hash.includes('progress')) {
      setScreen('PROGRESS');
    } else if (hash.includes('settings')) {
      setScreen('S9_SETTINGS');
    } else if (hash.includes('syllabus') || hash.includes('learn')) {
      setScreen('MY_SYLLABUS');
    }
  }, [setScreen]);

  // Keep browser URL hash synchronized with active screen for bookmarking and back history
  useEffect(() => {
    if (currentScreen !== 'ADMIN') {
      const screenHash = '#' + currentScreen.toLowerCase();
      if (window.location.hash !== screenHash) {
        window.history.pushState({ screen: currentScreen }, '', screenHash);
      }
    }
  }, [currentScreen]);

  // If on Enterprise Admin / Teacher / Multi-Tier LMS portal
  if (currentScreen === 'ADMIN' || currentScreen === 'ADMIN_PANEL') {
    return (
      <>
        <EnterprisePortalScreen onReturnToStudentApp={() => setScreen('MY_SYLLABUS')} />
        <PhoneExitToast message={exitToast} />
      </>
    );
  }

  // 1. If no learner profile is unlocked and not on Parent/Teacher view, show Screen 1 (Profile Selector)
  if (!activeLearner && currentScreen !== 'PARENT_VIEW') {
    return (
      <>
        <ProfileSelectorScreen />
        <PhoneExitToast message={exitToast} />
      </>
    );
  }

  // When S1_PICKER is explicitly selected (e.g. switch profile)
  if (currentScreen === 'S1_PICKER') {
    return (
      <>
        <ProfileSelectorScreen />
        <PhoneExitToast message={exitToast} />
      </>
    );
  }

  // 2. Render the core 5 pages inside responsive AppShell
  const renderScreen = () => {
    switch (currentScreen) {
      case 'MY_SYLLABUS':
      case 'LESSON_DETAIL':
      case 'S3_HOME':
      case 'S4_LESSON':
        return <MySyllabusScreen />;
      case 'AI_TUTOR':
      case 'S7_DOUBT':
        return <AiTutorScreen />;
      case 'PRACTICE':
      case 'S5_PRACTICE':
        return <PracticeWeakTopicsScreen />;
      case 'PROGRESS':
      case 'S8_PROGRESS':
        return <MyProgressScreen />;
      case 'PARENT_VIEW':
      case 'S10_GUARDIAN':
        return <ParentTeacherViewScreen />;
      case 'S9_SETTINGS':
        return <S9_SettingsScreen />;
      case 'S11_IMPACT':
        return <S11_ImpactScreen />;
      case 'S12_PACK_EDITOR':
        return <S12_PackEditorScreen />;
      case 'S2_CREATE':
        return <S2_CreateProfile />;
      default:
        return <MySyllabusScreen />;
    }
  };

  return (
    <>
      <AppShell>{renderScreen()}</AppShell>
      <PhoneExitToast message={exitToast} />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <EnterpriseAuthProvider>
      <AcademicProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AcademicProvider>
    </EnterpriseAuthProvider>
  );
};

export default App;
