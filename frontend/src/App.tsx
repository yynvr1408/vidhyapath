import './config/api';
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { LandingScreen } from './screens/LandingScreen';
import { MySyllabusScreen } from './screens/MySyllabusScreen';
import { AiTutorScreen } from './screens/AiTutorScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { MyProgressScreen } from './screens/MyProgressScreen';
import { ParentTeacherViewScreen } from './screens/ParentTeacherViewScreen';
import { AdminSyllabusScreen } from './screens/admin/AdminSyllabusScreen';

const MainRouter: React.FC = () => {
  const { activeLearner, currentScreen } = useApp();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Separate Admin Syllabus Panel (/admin Route Only)
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    return <AdminSyllabusScreen />;
  }

  // Student Landing Page (Profiles Only - No auth forms, No admin links)
  if (!activeLearner) {
    return <LandingScreen />;
  }

  // Unlocked Student AppShell with strictly 5 Sidebar Pages
  return (
    <AppShell>
      {currentScreen === 'MY_SYLLABUS' && <MySyllabusScreen />}
      {currentScreen === 'AI_TUTOR' && <AiTutorScreen />}
      {currentScreen === 'PRACTICE' && <PracticeScreen />}
      {currentScreen === 'PROGRESS' && <MyProgressScreen />}
      {currentScreen === 'PARENT_VIEW' && <ParentTeacherViewScreen />}
    </AppShell>
  );
};

export const App: React.FC = () => (
  <AppProvider>
    <MainRouter />
  </AppProvider>
);

export default App;
