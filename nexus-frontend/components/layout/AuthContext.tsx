'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { getMe, mimicAuth, getStoredToken, removeStoredToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  loginAsMimic: (role?: 'expert' | 'client', user_id?: number) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  loginAsMimic: async () => { throw new Error('Not initialized'); },
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      return resp.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        loginAsMimic,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
