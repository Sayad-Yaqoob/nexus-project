'use client';

import React from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#00FF88] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#A0A0A0] text-sm">Authenticating session...</p>
      </div>
    );
  }

  return <>{children}</>;
};
