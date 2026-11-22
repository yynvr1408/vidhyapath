import './config/api';
import React, { useState, useEffect, useCallback } from 'react';
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
import { WebsiteLandingScreen } from './screens/WebsiteLandingScreen';
import { WebsiteAuthPage, AuthRole } from './screens/WebsiteAuthPage';
import { isNativePlatform } from './utils/platform';
import { useNativeBackButton } from './hooks/useNativeBackButton';
import { PhoneExitToast } from './components/PhoneExitToast';

function getInitialRoute(): string {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const hash = window.location.hash.toLowerCase();

  // If on web root '/' but hash carries a direct route destination
  if (path === '/' || path === '') {
    if (hash.includes('portal') || hash.includes('admin') || hash.includes('dashboard')) return '/portal';
    if (hash.includes('login') || hash.includes('auth')) return '/login';
    if (hash.includes('register')) return '/register';
    if (hash.includes('guardian') || hash.includes('parent')) return '/guardian';
    if (
      hash.includes('learn') ||
      hash.includes('app') ||
      hash.includes('syllabus') ||
      hash.includes('student') ||
      hash.includes('tutor') ||
      hash.includes('practice') ||
      hash.includes('progress')
    ) {
      return '/learn';
    }
  }
  return path;
}

const AppContent: React.FC = () => {
  const { currentScreen, setScreen, activeLearner } = useApp();
  const { exitToast } = useNativeBackButton();
  const isNative = isNativePlatform();

  // Active route path for web routing
  const [routePath, setRoutePath] = useState<string>(getInitialRoute);
  const [authRole, setAuthRole] = useState<AuthRole>('student');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Unified web navigation helper
  const navigate = useCallback((path: string, options?: { role?: AuthRole; mode?: 'login' | 'register' }) => {
    if (options?.role) setAuthRole(options.role);
    if (options?.mode) setAuthMode(options.mode);
    setRoutePath(path);
    window.history.pushState(options || {}, '', path);
  }, []);

  // Listen for browser popstate (back / forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setRoutePath(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Support legacy hashes and URL synchronization
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('admin') || hash.includes('portal')) {
      if (!isNative) navigate('/portal');
      else setScreen('ADMIN');
    } else if (hash.includes('guardian') || hash.includes('parent')) {
      if (!isNative) navigate('/guardian');
      else setScreen('PARENT_VIEW');
    } else if (hash.includes('learn') || hash.includes('syllabus')) {
      if (!isNative) navigate('/learn');
      else setScreen('MY_SYLLABUS');
    } else if (hash.includes('tutor') || hash.includes('doubt')) {
      setScreen('AI_TUTOR');
    } else if (hash.includes('practice')) {
      setScreen('PRACTICE');
    } else if (hash.includes('progress')) {
      setScreen('PROGRESS');
    }
  }, [isNative, navigate, setScreen]);

  // Render core learner loop screens inside AppShell
  const renderLearnerScreen = () => {
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

  // --- A. NATIVE PACKAGED CAPACITOR APP FLOW ---
  if (isNative) {
    if (currentScreen === 'ADMIN' || currentScreen === 'ADMIN_PANEL') {
      return (
        <>
          <EnterprisePortalScreen onReturnToStudentApp={() => setScreen('MY_SYLLABUS')} />
          <PhoneExitToast message={exitToast} />
        </>
      );
    }

    if (currentScreen === 'PARENT_VIEW' || currentScreen === 'S10_GUARDIAN') {
      return (
        <>
          <ParentTeacherViewScreen />
          <PhoneExitToast message={exitToast} />
        </>
      );
    }

    if (!activeLearner || currentScreen === 'S1_PICKER') {
      return (
        <>
          <ProfileSelectorScreen />
          <PhoneExitToast message={exitToast} />
        </>
      );
    }

    return (
      <>
        <AppShell>{renderLearnerScreen()}</AppShell>
        <PhoneExitToast message={exitToast} />
      </>
    );
  }

  // --- B. BROWSER WEBSITE FLOW (EXPLICIT PATH ROUTING) ---

  // 1. Enterprise Portal (/portal or /portal/* or active ADMIN screen)
  if (routePath.startsWith('/portal') || currentScreen === 'ADMIN' || currentScreen === 'ADMIN_PANEL') {
    return (
      <>
        <EnterprisePortalScreen
          onReturnToStudentApp={() => navigate('/learn')}
          onNavigateToLogin={() => navigate('/login')}
        />
        <PhoneExitToast message={exitToast} />
      </>
    );
  }

  // 2. Full-Page Website Authentication (/login, /register, /auth)
  if (routePath === '/login' || routePath === '/register' || routePath === '/auth') {
    return (
      <>
        <WebsiteAuthPage
          initialRole={authRole}
          initialMode={authMode || (routePath === '/register' ? 'register' : 'login')}
          onNavigateHome={() => navigate('/')}
          onLoginSuccess={(role) => {
            if (role === 'student') {
              navigate('/learn');
              setScreen('MY_SYLLABUS');
            } else if (role === 'guardian') {
              navigate('/guardian');
              setScreen('PARENT_VIEW');
            } else {
              navigate('/portal');
              setScreen('ADMIN');
            }
          }}
        />
        <PhoneExitToast message={exitToast} />
      </>
    );
  }

  // 3. Parent / Guardian View (/guardian, /parent)
  if (routePath.startsWith('/guardian') || routePath.startsWith('/parent') || currentScreen === 'PARENT_VIEW') {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
          >
            ← Return to Vidyapath Home
          </button>
          <button
            type="button"
            onClick={() => navigate('/login', { role: 'guardian', mode: 'login' })}
            className="text-xs font-bold text-[#475569] hover:text-[#0F766E] cursor-pointer"
          >
            Switch Guardian Account
          </button>
        </div>
        <ParentTeacherViewScreen />
        <PhoneExitToast message={exitToast} />
      </div>
    );
  }

  // 4. Learner App on Web (/learn, /app, /student)
  if (
    routePath.startsWith('/learn') ||
    routePath.startsWith('/app') ||
    routePath.startsWith('/student') ||
    currentScreen === 'S1_PICKER'
  ) {
    if (!activeLearner || currentScreen === 'S1_PICKER') {
      return (
        <>
          <ProfileSelectorScreen
            onNavigateHome={() => navigate('/')}
            onNavigateToAuth={(role, mode) =>
              navigate(mode === 'register' ? '/register' : '/login', {
                role: (role as AuthRole) || 'student',
                mode: mode || 'login',
              })
            }
          />
          <PhoneExitToast message={exitToast} />
        </>
      );
    }

    return (
      <>
        <AppShell>{renderLearnerScreen()}</AppShell>
        <PhoneExitToast message={exitToast} />
      </>
    );
  }

  // 5. Default Website Landing Page (/)
  return (
    <>
      <WebsiteLandingScreen
        onNavigateToAuth={(role, mode) => {
          navigate(mode === 'register' ? '/register' : '/login', {
            role: role || 'student',
            mode: mode || 'login',
          });
        }}
        onOpenLearnerApp={() => {
          navigate('/learn');
        }}
      />
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
