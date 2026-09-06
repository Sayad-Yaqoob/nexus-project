'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/layout/AuthContext';
import { Sparkles, UserCheck, Briefcase, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';

function LoginContent() {
  const [loadingRole, setLoadingRole] = useState<'expert' | 'client' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loginAsMimic, logout } = useAuth();

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

  const requestedRole = searchParams ? searchParams.get('role') : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-slate-900 select-none font-sans">
      {/* Top back link */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to mindGigs Home</span>
        </Link>
        <span className="text-xs font-semibold text-slate-400">
          Demo Persona Selection
        </span>
      </div>

      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm relative z-10 space-y-6">
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
            NEXUS Intelligent Operating Workspace
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto pt-1 font-medium">
            Select a persona to sign in. Each persona unlocks dedicated capabilities verified against the SQLite backend.
          </p>
        </div>

        {/* Currently Active Banner (if user has existing token) */}
        {user && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="text-xs">
                <span className="text-slate-500">Active session: </span>
                <span className="font-bold text-slate-900">{user.full_name}</span>
                <span className={`ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  user.role === 'expert' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push('/nexus')}
              className="text-xs font-bold text-[#00C49F] hover:underline flex items-center gap-1"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Persona Cards */}
        <div className="space-y-4 pt-1">
          <div className="text-[11px] uppercase font-black tracking-wider text-slate-400 text-center mb-1">
            Choose Persona to Continue
          </div>

          {/* 1. Client Persona */}
          <div
            onClick={() => handleMimicLogin('client')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all group ${
              requestedRole === 'client'
                ? 'bg-emerald-50/50 border-[#00C49F] ring-2 ring-[#00C49F]/20 shadow-xs'
                : 'bg-white border-[#CBD5E1] hover:border-[#00C49F] hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-[#00C49F] group-hover:text-slate-950 transition-colors">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>Client Persona</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                      Buyer
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Find solutions, hire verified practitioners</div>
                </div>
              </div>

              {loadingRole === 'client' ? (
                <div className="w-5 h-5 border-2 border-[#00C49F] border-t-transparent rounded-full animate-spin mt-1" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#00C49F] flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-950 transition-colors" />
                </div>
              )}
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 pt-1 pl-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C49F] shrink-0" />
                <span>Semantic AI search with custom match reasoning</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C49F] shrink-0" />
                <span>Book 1:1 sessions, explore subscriptions & courses</span>
              </li>
            </ul>

            <button
              disabled={loadingRole !== null}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>Continue as Client</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Expert Persona */}
          <div
            onClick={() => handleMimicLogin('expert')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all group ${
              requestedRole === 'expert'
                ? 'bg-purple-50/50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                : 'bg-white border-[#CBD5E1] hover:border-purple-500 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>Expert Persona</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
                      Advisor
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Monetize time, advisory & digital products</div>
                </div>
              </div>

              {loadingRole === 'expert' ? (
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mt-1" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-purple-600 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              )}
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 pt-1 pl-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>NEXUS creates 1:1 sessions, books & subscriptions via chat</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Access SELL studio: My Offers, Bookings & Selling Earnings</span>
              </li>
            </ul>

            <button
              disabled={loadingRole !== null}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>Continue as Expert</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#F1F5F9] text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SQLite Verified • Fast JWT Authentication</span>
          </div>
          {user && (
            <div>
              <button
                onClick={() => logout()}
                className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
              >
                Sign out of current session
              </button>
            </div>
          )}
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
