// Enterprise Authentication Context & Multi-Tier Role Management
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/enterprise';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeRole: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const EnterpriseAuthContext = createContext<AuthContextValue | null>(null);

// Demo seed accounts for quick testing of all 5 tiers
export const EnterpriseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vidyapath_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active role defaults to user role or 'student'
  const activeRole: UserRole = user?.role || 'student';

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
    } catch (err) {
      console.warn('Could not fetch user profile from server:', err);
    }

    // Token invalid or expired - reset to clean unauthenticated state
    setToken(null);
    setUser(null);
    localStorage.removeItem('vidyapath_token');
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

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setToken(data.token);
      localStorage.setItem('vidyapath_token', data.token);
      setUser(data.user);
      return { success: true, redirectTo: data.redirectTo };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vidyapath_token');
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
