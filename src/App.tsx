import './config/api';
import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import type { ScreenId } from './context/AppContext';
import { EnterpriseAuthProvider } from './context/EnterpriseAuthContext';
import { AcademicProvider } from './context/AcademicContext';
import type { AuthRole } from './screens/WebsiteAuthPage';
import { navigationManager } from './services/navigationManager';

const AppShell = lazy(() => import('./components/AppShell').then((module) => ({ default: module.AppShell })));
const MySyllabusScreen = lazy(() => import('./screens/MySyllabusScreen').then((module) => ({ default: module.MySyllabusScreen })));
const AiTutorScreen = lazy(() => import('./screens/AiTutorScreen').then((module) => ({ default: module.AiTutorScreen })));
const PracticeWeakTopicsScreen = lazy(() => import('./screens/PracticeWeakTopicsScreen').then((module) => ({ default: module.PracticeWeakTopicsScreen })));
const MyProgressScreen = lazy(() => import('./screens/MyProgressScreen').then((module) => ({ default: module.MyProgressScreen })));
const ParentTeacherViewScreen = lazy(() => import('./screens/ParentTeacherViewScreen').then((module) => ({ default: module.ParentTeacherViewScreen })));
const EnterprisePortalScreen = lazy(() => import('./screens/EnterprisePortalScreen').then((module) => ({ default: module.EnterprisePortalScreen })));
const S9_SettingsScreen = lazy(() => import('./screens/S9_SettingsScreen').then((module) => ({ default: module.S9_SettingsScreen })));
const S11_ImpactScreen = lazy(() => import('./screens/S11_ImpactScreen').then((module) => ({ default: module.S11_ImpactScreen })));
const S12_PackEditorScreen = lazy(() => import('./screens/S12_PackEditorScreen').then((module) => ({ default: module.S12_PackEditorScreen })));
const S2_CreateProfile = lazy(() => import('./screens/S2_CreateProfile').then((module) => ({ default: module.S2_CreateProfile })));
const ProfileSelectorScreen = lazy(() => import('./screens/ProfileSelectorScreen').then((module) => ({ default: module.ProfileSelectorScreen })));
const WebsiteLandingScreen = lazy(() => import('./screens/WebsiteLandingScreen').then((module) => ({ default: module.WebsiteLandingScreen })));
const WebsiteAuthPage = lazy(() => import('./screens/WebsiteAuthPage').then((module) => ({ default: module.WebsiteAuthPage })));

const AUTH_ROLES: AuthRole[] = ['student', 'guardian', 'teacher', 'admin', 'super_admin'];

function normalizePath(path: string): string {
  const clean = path.toLowerCase().replace(/\/+$/, '') || '/';

  if (clean === '/admin' || clean.startsWith('/dashboard')) return '/portal';
  if (clean === '/auth') return '/login';
  if (clean === '/parent') return '/guardian';
  if (clean.startsWith('/parent/')) return clean.replace(/^\/parent/, '/guardian');
  if (clean === '/app' || clean === '/student') return '/learn';
  if (clean.startsWith('/app/')) return clean.replace(/^\/app/, '/learn');
  if (clean.startsWith('/student/')) return clean.replace(/^\/student/, '/learn');
  if (clean === '/tutor') return '/learn/tutor';
  if (clean === '/practice') return '/learn/practice';
  if (clean === '/progress') return '/learn/progress';
  if (clean === '/syllabus') return '/learn';
  if (clean.startsWith('/learn/profiles')) return '/learn';

  return clean;
}

function routeFromLocation(): string {
  if (typeof window === 'undefined') return '/';

  const pathname = normalizePath(window.location.pathname);
  if (pathname !== '/') {
    return pathname.startsWith('/portal') || pathname.startsWith('/guardian') ||
      pathname === '/login' || pathname === '/register' || pathname.startsWith('/learn')
      ? pathname
      : '/';
  }

  // Support older shared links such as #portal and #learn/tutor while leaving
  // ordinary landing-page anchors (#features, #curriculum) alone.
  const rawHash = window.location.hash;
  const legacyHash = rawHash.replace(/^#\/?/, '').split(/[?&]/, 1)[0];
  if (!legacyHash) return '/';
  const isExplicitHashRoute = rawHash.startsWith('#/') ||
    /^(portal|admin|dashboard|login|register|guardian|parent|learn|app|student|practice|progress|syllabus)(\/|$)/i.test(legacyHash);
  if (!isExplicitHashRoute) return '/';
  const hashPath = normalizePath(`/${legacyHash}`);
  if (
    hashPath === '/portal' ||
    hashPath === '/login' ||
    hashPath === '/register' ||
    hashPath.startsWith('/guardian') ||
    hashPath.startsWith('/learn')
  ) {
    return hashPath;
  }

  return '/';
}

function screenForRoute(path: string, hasLearner: boolean): ScreenId | null {
  if (path.startsWith('/portal')) return 'ADMIN';
  if (path.startsWith('/guardian')) return 'PARENT_VIEW';
  if (path === '/learn' || path === '/learn/') return hasLearner ? 'MY_SYLLABUS' : 'S1_PICKER';
  if (path.startsWith('/learn/profiles')) return 'S1_PICKER';
  if (path.startsWith('/learn/tutor')) return 'AI_TUTOR';
  if (path.startsWith('/learn/practice')) return 'PRACTICE';
  if (path.startsWith('/learn/progress')) return 'PROGRESS';
  if (path.startsWith('/learn/settings')) return 'S9_SETTINGS';
  if (path.startsWith('/learn/impact')) return 'S11_IMPACT';
  if (path.startsWith('/learn/pack-editor')) return 'S12_PACK_EDITOR';
  if (path.startsWith('/learn/create-profile')) return 'S2_CREATE';
  return null;
}

function routeForScreen(screen: ScreenId): string | null {
  switch (screen) {
    case 'S1_PICKER':
    case 'MY_SYLLABUS':
    case 'LESSON_DETAIL':
    case 'S3_HOME':
    case 'S4_LESSON':
      return '/learn';
    case 'AI_TUTOR':
    case 'S7_DOUBT':
      return '/learn/tutor';
    case 'PRACTICE':
    case 'S5_PRACTICE':
      return '/learn/practice';
    case 'PROGRESS':
    case 'S8_PROGRESS':
      return '/learn/progress';
    case 'PARENT_VIEW':
    case 'S10_GUARDIAN':
      return '/guardian';
    case 'ADMIN':
    case 'ADMIN_PANEL':
      return '/portal';
    case 'S2_CREATE':
      return '/learn/create-profile';
    case 'S9_SETTINGS':
      return '/learn/settings';
    case 'S11_IMPACT':
      return '/learn/impact';
    case 'S12_PACK_EDITOR':
      return '/learn/pack-editor';
    default:
      return null;
  }
}

const AppContent: React.FC = () => {
  const { currentScreen, setScreen, activeLearner } = useApp();
  const [routePath, setRoutePath] = useState<string>(routeFromLocation);
  const [authRole, setAuthRole] = useState<AuthRole>('student');
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() =>
    routeFromLocation() === '/register' ? 'register' : 'login'
  );
  const handledRouteRef = useRef<string | null>(null);
  const routeWasHandledAtRender = handledRouteRef.current === routePath;

  const navigate = useCallback((path: string, options?: { role?: AuthRole; mode?: 'login' | 'register' }) => {
    const nextPath = normalizePath(path);
    const nextRole = options?.role || authRole;
    const nextMode = options?.mode || (nextPath === '/register' ? 'register' : nextPath === '/login' ? 'login' : authMode);

    setAuthRole(nextRole);
    setAuthMode(nextMode);
    if (nextPath !== routePath || options) {
      window.history.pushState({ role: nextRole, mode: nextMode }, '', nextPath);
      setRoutePath(nextPath);
    }
  }, [authMode, authRole, routePath]);

  // Website routing is the only route owner. The browser back/forward buttons
  // update route state here; modal Escape handling is managed separately.
  useEffect(() => {
    const initialRoute = routeFromLocation();
    if (window.location.pathname !== initialRoute || (initialRoute !== '/' && window.location.hash)) {
      window.history.replaceState(window.history.state, '', `${initialRoute}${window.location.search}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      const nextPath = routeFromLocation();
      const state = event.state as { role?: unknown; mode?: unknown } | null;
      setRoutePath(nextPath);
      setAuthRole(AUTH_ROLES.includes(state?.role as AuthRole) ? state!.role as AuthRole : 'student');
      setAuthMode(state?.mode === 'register' || nextPath === '/register' ? 'register' : 'login');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => navigationManager.init(() => ''), []);

  // A direct URL or browser Back selects the matching application screen.
  useEffect(() => {
    if (routeWasHandledAtRender) return;
    handledRouteRef.current = routePath;
    const nextScreen = screenForRoute(routePath, Boolean(activeLearner));
    if (nextScreen) setScreen(nextScreen);
  }, [activeLearner, routePath, routeWasHandledAtRender, setScreen]);

  // In-app tabs and actions update the URL too, so browser history follows the
  // learner's workflow rather than jumping between unrelated website pages.
  useEffect(() => {
    if (!routeWasHandledAtRender || !routePath.startsWith('/learn')) return;
    const nextPath = routeForScreen(currentScreen);
    if (nextPath && nextPath !== routePath) navigate(nextPath);
  }, [currentScreen, navigate, routePath, routeWasHandledAtRender]);

  const renderLearnerScreen = () => {
    switch (currentScreen) {
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

  if (routePath.startsWith('/portal')) {
    return (
      <EnterprisePortalScreen
        onReturnToStudentApp={() => navigate('/learn')}
        onNavigateToLogin={() => navigate('/login')}
      />
    );
  }

  if (routePath === '/login' || routePath === '/register') {
    return (
      <WebsiteAuthPage
        initialRole={authRole}
        initialMode={routePath === '/register' ? 'register' : authMode}
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
    );
  }

  if (routePath.startsWith('/guardian')) {
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
      </div>
    );
  }

  if (routePath.startsWith('/learn')) {
    if (currentScreen === 'S2_CREATE') return <S2_CreateProfile />;

    if (!activeLearner || currentScreen === 'S1_PICKER') {
      return (
        <ProfileSelectorScreen
          onNavigateHome={() => navigate('/')}
          onNavigateToAuth={(role, mode) =>
            navigate(mode === 'register' ? '/register' : '/login', {
              role: (role as AuthRole) || 'student',
              mode: mode || 'login',
            })
          }
        />
      );
    }

    return <AppShell>{renderLearnerScreen()}</AppShell>;
  }

  return (
    <WebsiteLandingScreen
      onNavigateToAuth={(role, mode) => {
        navigate(mode === 'register' ? '/register' : '/login', {
          role: role || 'student',
          mode: mode || 'login',
        });
      }}
      onOpenLearnerApp={() => navigate('/learn')}
    />
  );
};

export const App: React.FC = () => (
  <EnterpriseAuthProvider>
    <AcademicProvider>
      <AppProvider>
          <Suspense
            fallback={
              <div role="status" className="min-h-screen grid place-items-center bg-[#F8FAFC] text-sm font-semibold text-[#475569]">
                Loading Vidyapath…
              </div>
            }
          >
            <AppContent />
          </Suspense>
      </AppProvider>
    </AcademicProvider>
  </EnterpriseAuthProvider>
);

export default App;
