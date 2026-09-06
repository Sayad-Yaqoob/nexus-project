'use client';

import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center text-slate-900 font-sans">
        <div className="w-10 h-10 border-4 border-[#00C49F] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Authenticating NEXUS session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
