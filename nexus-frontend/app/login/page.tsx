'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthContext';
import { Sparkles, UserCheck, Briefcase, Zap, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [loadingRole, setLoadingRole] = useState<'expert' | 'client' | 'random' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { loginAsMimic } = useAuth();

  const handleMimicLogin = async (role?: 'expert' | 'client', modeKey: 'expert' | 'client' | 'random' = 'random') => {
    setError(null);
    setLoadingRole(modeKey);
    try {
      await loginAsMimic(role);
      router.push('/nexus');
    } catch (err: any) {
      console.error('Mimic login error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1320] flex flex-col items-center justify-center p-6 text-slate-100 select-none">
      <div className="w-full max-w-lg bg-[#112233] border border-slate-700/60 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00C49F] text-slate-950 font-black text-2xl mb-4 shadow-lg shadow-[#00C49F]/20">
            N
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome to NEXUS
          </h1>
          <p className="text-sm text-slate-400 mt-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#00C49F]" />
            Agentic Sales & Growth Marketplace
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fast Login Options */}
        <div className="space-y-4">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400 text-center mb-2">
            Select Demo Account Persona
          </div>

          <button
            onClick={() => handleMimicLogin('expert', 'expert')}
            disabled={loadingRole !== null}
            className="w-full py-4 px-5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-[#00C49F] text-white text-sm font-medium flex items-center justify-between transition-all group hover:bg-slate-900"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-[#00C49F]/10 text-[#00C49F] group-hover:bg-[#00C49F] group-hover:text-slate-950 transition-colors">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Fill Dummy Data (Expert Persona)</div>
                <div className="text-xs text-slate-400">Authenticates as a seeded expert seller</div>
              </div>
            </div>
            {loadingRole === 'expert' ? (
              <div className="w-5 h-5 border-2 border-[#00C49F] border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#00C49F] transition-colors" />
            )}
          </button>

          <button
            onClick={() => handleMimicLogin('client', 'client')}
            disabled={loadingRole !== null}
            className="w-full py-4 px-5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-[#00C49F] text-white text-sm font-medium flex items-center justify-between transition-all group hover:bg-slate-900"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-[#00C49F]/10 text-[#00C49F] group-hover:bg-[#00C49F] group-hover:text-slate-950 transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Fill Dummy Data (Client Persona)</div>
                <div className="text-xs text-slate-400">Authenticates as a seeded client buyer</div>
              </div>
            </div>
            {loadingRole === 'client' ? (
              <div className="w-5 h-5 border-2 border-[#00C49F] border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#00C49F] transition-colors" />
            )}
          </button>

          <button
            onClick={() => handleMimicLogin(undefined, 'random')}
            disabled={loadingRole !== null}
            className="w-full py-3.5 px-5 rounded-xl bg-[#00C49F] text-slate-950 font-bold text-sm hover:bg-[#00B08E] shadow-lg shadow-[#00C49F]/20 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            {loadingRole === 'random' ? 'Authenticating...' : 'Sign In as Random Seeded User'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Powered by LangGraph Agent Architecture & Groq LLM Runtime
          </p>
        </div>
      </div>
    </div>
  );
}
