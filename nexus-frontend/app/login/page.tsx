'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthContext';
import { Sparkles, UserCheck, Briefcase, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

function LoginContent() {
  const [loadingRole, setLoadingRole] = useState<'expert' | 'client' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loginAsMimic } = useAuth();

  const handleMimicLogin = async (role: 'expert' | 'client') => {
    setError(null);
    setLoadingRole(role);
    try {
      await loginAsMimic(role);
      router.push('/nexus');
    } catch (err: any) {
      console.error('Mimic login error:', err);
      setError(err.message || 'Authentication failed. Please ensure backend server is running on port 8000.');
    } finally {
      setLoadingRole(null);
    }
  };

  // If already authenticated, redirect straight to nexus workspace
  useEffect(() => {
    if (user) {
      router.push('/nexus');
    }
  }, [user, router]);

  const requestedRole = searchParams ? searchParams.get('role') : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-slate-900 select-none font-sans">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C49F] to-emerald-600 text-white font-black text-2xl mb-1 shadow-md shadow-[#00C49F]/20">
            m
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            mindGigs
          </h1>
          <p className="text-xs text-[#00C49F] font-extrabold tracking-wider uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00C49F]" />
            powered by NEXUS Intelligent Layer
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fast Login Options */}
        <div className="space-y-4 pt-1">
          <div className="text-[11px] uppercase font-black tracking-wider text-slate-400 text-center mb-1">
            Select Authenticated Demo Persona
          </div>

          <button
            onClick={() => handleMimicLogin('client')}
            disabled={loadingRole !== null}
            className={`w-full py-4 px-5 rounded-2xl border text-slate-900 text-sm font-semibold flex items-center justify-between transition-all group shadow-2xs ${
              requestedRole === 'client'
                ? 'bg-[#00C49F]/10 border-[#00C49F] ring-2 ring-[#00C49F]/30'
                : 'bg-white border-[#CBD5E1] hover:border-[#00C49F] hover:bg-[#00C49F]/5'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-[#00C49F] group-hover:text-slate-950 transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>Continue as Client</span>
                  {requestedRole === 'client' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00C49F] text-slate-950 uppercase">Recommended</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium">Discover experts, view profiles & book 1:1 sessions</div>
              </div>
            </div>
            {loadingRole === 'client' ? (
              <div className="w-5 h-5 border-2 border-[#00C49F] border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#00C49F] transition-colors" />
            )}
          </button>

          <button
            onClick={() => handleMimicLogin('expert')}
            disabled={loadingRole !== null}
            className={`w-full py-4 px-5 rounded-2xl text-white text-sm font-semibold flex items-center justify-between transition-all group shadow-sm ${
              requestedRole === 'expert'
                ? 'bg-slate-900 border-2 border-[#00C49F] ring-2 ring-[#00C49F]/30'
                : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Continue as Expert</span>
                  {requestedRole === 'expert' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500 text-white uppercase">Recommended</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-medium">Manage offerings, 1:1 sessions, books & earnings</div>
              </div>
            </div>
            {loadingRole === 'expert' ? (
              <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#00C49F] transition-colors" />
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#F1F5F9] text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SQLite Verified • JWT Token Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-[#00C49F] font-sans">
          Loading mindGigs Login...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

