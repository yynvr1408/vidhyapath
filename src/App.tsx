import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/AppShell';
import { ProfileSelectorScreen } from './screens/ProfileSelectorScreen';
import { MySyllabusScreen } from './screens/MySyllabusScreen';
import { AiTutorScreen } from './screens/AiTutorScreen';
import { PracticeWeakTopicsScreen } from './screens/PracticeWeakTopicsScreen';
import { MyProgressScreen } from './screens/MyProgressScreen';
import { ParentTeacherViewScreen } from './screens/ParentTeacherViewScreen';

const AppContent: React.FC = () => {
  const { currentScreen, setScreen, activeLearner } = useApp();

  // Support direct route hashes: #guardian, etc.
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (hash.includes('guardian') || path.includes('guardian') || hash.includes('parent')) {
      setScreen('PARENT_VIEW');
    }
  }, [setScreen]);

  // 1. If no learner profile is unlocked and not on Parent/Teacher view, show Screen 1 (Profile Selector)
  if (!activeLearner && currentScreen !== 'PARENT_VIEW') {
    return <ProfileSelectorScreen />;
  }

  // When S1_PICKER is explicitly selected (e.g. switch profile)
  if (currentScreen === 'S1_PICKER') {
    return <ProfileSelectorScreen />;
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
      default:
        return <MySyllabusScreen />;
    }
  };

  return <AppShell>{renderScreen()}</AppShell>;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
