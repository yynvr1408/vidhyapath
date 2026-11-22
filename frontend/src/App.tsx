import './config/api';
import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { EnterpriseAuthProvider, useEnterpriseAuth } from './context/EnterpriseAuthContext';
import { AcademicProvider } from './context/AcademicContext';
import { AppProvider, useApp } from './context/AppContext';
import type { AuthRole } from './types/auth';

const EnterprisePortalScreen = lazy(() => import('./screens/EnterprisePortalScreen').then((module) => ({ default: module.EnterprisePortalScreen })));
const WebsiteLandingScreen = lazy(() => import('./screens/WebsiteLandingScreen').then((module) => ({ default: module.WebsiteLandingScreen })));
const UnifiedAuthModal = lazy(() => import('./components/auth/UnifiedAuthModal').then((module) => ({ default: module.UnifiedAuthModal })));

const AUTH_ROLES: AuthRole[] = ['student', 'guardian', 'teacher', 'admin'];
type AuthMode = 'login' | 'register';

function normalizePath(pathname: string): string {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (clean === '/login' || clean === '/register' || clean === '/auth') return '/';
  if (
    clean === '/admin' || clean.startsWith('/dashboard') ||
    clean === '/guardian' || clean.startsWith('/guardian/') ||
    clean === '/parent' || clean.startsWith('/parent/') ||
    clean === '/learn' || clean.startsWith('/learn/') ||
    clean === '/student' || clean.startsWith('/student/') ||
    clean === '/app' || clean.startsWith('/app/') ||
    clean === '/portal' || clean.startsWith('/portal/')
  ) return '/portal';
  return '/';
}

function authRequestFromLocation(): { isOpen: boolean; role: AuthRole; mode: AuthMode } {
  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const requestedRole = params.get('role') as AuthRole | null;
  const roleFromPath: AuthRole = pathname.startsWith('/guardian') || pathname.startsWith('/parent') ? 'guardian' : 'student';
  return {
    isOpen: pathname === '/login' || pathname === '/register' || pathname === '/auth' || params.get('auth') === '1',
    role: requestedRole && AUTH_ROLES.includes(requestedRole) ? requestedRole : roleFromPath,
    mode: pathname === '/register' || params.get('mode') === 'register' ? 'register' : 'login',
  };
}

const AppContent: React.FC = () => {
  const { user, loading } = useEnterpriseAuth();
  const { switchLearner } = useApp();
  const [routePath, setRoutePath] = useState(() => normalizePath(window.location.pathname));
  const [authRequest, setAuthRequest] = useState(authRequestFromLocation);

  const navigate = useCallback((path: string) => {
    const nextPath = normalizePath(path);
    if (nextPath !== routePath) {
      window.history.pushState({}, '', nextPath);
      setRoutePath(nextPath);
    }
  }, [routePath]);

  const openAuth = useCallback((role: AuthRole = 'student', mode: AuthMode = 'login') => {
    setAuthRequest({ isOpen: true, role, mode });
    const params = new URLSearchParams(window.location.search);
    params.set('auth', '1');
    params.set('role', role);
    params.set('mode', mode);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.pushState({ auth: true, role, mode }, '', nextUrl);
    }
  }, []);

  const closeAuth = useCallback(() => {
    setAuthRequest((current) => ({ ...current, isOpen: false }));
    const params = new URLSearchParams(window.location.search);
    params.delete('auth');
    params.delete('role');
    params.delete('mode');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  useEffect(() => {
    const normalized = normalizePath(window.location.pathname);
    if (window.location.pathname !== normalized) {
      window.history.replaceState(window.history.state, '', `${normalized}${window.location.search}`);
    }

    const handlePopState = () => {
      setRoutePath(normalizePath(window.location.pathname));
      setAuthRequest(authRequestFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Every legacy role or app path enters the same authenticated web portal.
  useEffect(() => {
    if (loading) return;
    if (user && routePath === '/') {
      navigate('/portal');
      return;
    }
    if (!user && routePath === '/portal') {
      navigate('/');
      openAuth(authRequest.role, 'login');
    }
  }, [authRequest.role, loading, navigate, openAuth, routePath, user]);

  const handleAuthenticated = useCallback((_role: string) => {
    navigate('/portal');
  }, [navigate]);

  return (
    <>
      {routePath === '/portal' && user ? (
        <EnterprisePortalScreen
          onSignOut={() => {
            switchLearner();
            navigate('/');
          }}
        />
      ) : (
        <WebsiteLandingScreen
          onNavigateToAuth={openAuth}
          onOpenLearnerApp={() => openAuth('student', 'register')}
        />
      )}
      <UnifiedAuthModal
        isOpen={authRequest.isOpen}
        onClose={closeAuth}
        initialRole={authRequest.role}
        initialMode={authRequest.mode}
        onAuthenticated={handleAuthenticated}
      />
    </>
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
