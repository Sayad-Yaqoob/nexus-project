'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AgentContext } from '@/lib/types';
import { getMe, mimicAuth, getStoredToken, removeStoredToken } from '@/lib/api';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  perspective: 'client' | 'expert';
  setPerspective: (p: 'client' | 'expert') => void;
  loginAsMimic: (role?: 'expert' | 'client', user_id?: number) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  getAgentContext: (screenName?: string) => AgentContext | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  perspective: 'client',
  setPerspective: () => {},
  loginAsMimic: async () => { throw new Error('Not initialized'); },
  logout: () => {},
  refreshUser: async () => {},
  getAgentContext: () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [perspective, setPerspectiveState] = useState<'client' | 'expert'>('client');
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();

  const fetchUser = async () => {
    const stored = getStoredToken();
    if (!stored) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      setToken(stored);
      const u = await getMe();
      setUser(u);
      if (u.role === 'expert') {
        setPerspectiveState('expert');
      } else {
        setPerspectiveState('client');
      }
    } catch (err) {
      console.warn('Failed to load authenticated user context, clearing token:', err);
      removeStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const loginAsMimic = async (role?: 'expert' | 'client', user_id?: number): Promise<User> => {
    setLoading(true);
    try {
      const resp = await mimicAuth(role, user_id);
      setToken(resp.access_token);
      setUser(resp.user);
      if (resp.user.role === 'expert') {
        setPerspectiveState('expert');
      } else {
        setPerspectiveState('client');
      }
      return resp.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setToken(null);
    setPerspectiveState('client');
  };

  const setPerspective = (p: 'client' | 'expert') => {
    setPerspectiveState(p);
  };

  const getAgentContext = (screenName?: string): AgentContext | null => {
    if (!user) return null;
    const isExpertUser = user.role === 'expert';
    const capabilities: ('client' | 'expert')[] = isExpertUser ? ['client', 'expert'] : ['client'];

    return {
      user: {
        ...user,
        capabilities,
        perspective,
      },
      capabilities,
      perspective,
      route: pathname || '/overview',
      screen: screenName || (pathname ? pathname.replace('/', '').replace(/-/g, '_') : 'overview'),
      selected_entity: null,
      active_task: null,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        perspective,
        setPerspective,
        loginAsMimic,
        logout,
        refreshUser: fetchUser,
        getAgentContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
