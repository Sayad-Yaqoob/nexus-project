'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthContext';
import { Sparkles, UserCheck, Briefcase, Zap, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [loadingRole, setLoadingRole] = useState<'expert' | 'client' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { loginAsMimic } = useAuth();

  const handleMimicLogin = async (role: 'expert' | 'client') => {
    setError(null);
    setLoadingRole(role);
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
    <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center p-6 text-slate-100 select-none">
      <div className="w-full max-w-lg bg-[#0B1320] border border-slate-700/60 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C49F] to-emerald-600 text-slate-950 font-black text-2xl mb-2 shadow-lg shadow-[#00C49F]/20">
            m
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            mindGigs
          </h1>
          <p className="text-xs text-[#00C49F] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#00C49F]" />
            powered by NEXUS Intelligent Layer
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fast Login Options */}
        <div className="space-y-4 pt-2">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400 text-center mb-1">
            Select Authenticated Demo Persona
          </div>

          <button
            onClick={() => handleMimicLogin('client')}
            disabled={loadingRole !== null}
            className="w-full py-4 px-5 rounded-xl bg-[#111C2E] border border-slate-700 hover:border-[#00C49F] text-white text-sm font-medium flex items-center justify-between transition-all group hover:bg-[#15243B]"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Continue as Client</div>
                <div className="text-xs text-slate-400">Discover experts, view profiles, and book 1:1 sessions</div>
              </div>
            </div>
            {loadingRole === 'client' ? (
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            )}
          </button>

          <button
            onClick={() => handleMimicLogin('expert')}
            disabled={loadingRole !== null}
            className="w-full py-4 px-5 rounded-xl bg-[#111C2E] border border-slate-700 hover:border-purple-400 text-white text-sm font-medium flex items-center justify-between transition-all group hover:bg-[#15243B]"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Continue as Expert (Dr. Sophia Chen)</div>
                <div className="text-xs text-slate-400">Client who completed expert onboarding (BUY + SELL features)</div>
              </div>
            </div>
            {loadingRole === 'expert' ? (
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-center space-y-1">
          <p className="text-xs text-slate-400">
            Real SQLite database operations • Token JWT authorization
          </p>
        </div>
      </div>
    </div>
  );
}
