// Enterprise Authentication Context & Multi-Tier Role Management
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types/enterprise';

export interface LoginCredentials {
  email?: string;
  password?: string;
  loginCode?: string;
  pin?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeRole: UserRole;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string; redirectTo?: string; user?: User }>;
  establishSession: (token: string, user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const EnterpriseAuthContext = createContext<AuthContextValue | null>(null);

export const EnterpriseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vidyapath_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active role defaults to user role or 'student'
  const activeRole: UserRole = user?.role || 'student';

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vidyapath_token');
  };

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return;
      }
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        clearSession();
      }
    } catch (err) {
      console.warn('Could not fetch user profile from server:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (token) {
        await fetchCurrentUser(token);
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    init();
  }, [token]);

  const establishSession = (authToken: string, authenticatedUser: User) => {
    localStorage.setItem('vidyapath_token', authToken);
    setToken(authToken);
    setUser(authenticatedUser);
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }
      if (typeof data.token !== 'string' || !data.user) {
        return { success: false, error: 'The server returned an incomplete sign-in response.' };
      }
      establishSession(data.token, data.user);
      return { success: true, redirectTo: data.redirectTo, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = () => {
    clearSession();
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <EnterpriseAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        activeRole,
        loading,
        login,
        establishSession,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </EnterpriseAuthContext.Provider>
  );
};

export const useEnterpriseAuth = () => {
  const ctx = useContext(EnterpriseAuthContext);
  if (!ctx) throw new Error('useEnterpriseAuth must be used within EnterpriseAuthProvider');
  return ctx;
};
