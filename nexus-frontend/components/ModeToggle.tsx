'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserCheck, Sparkles, ShieldCheck, Briefcase, Search, Activity } from 'lucide-react';
import { api } from '@/lib/api';

export default function ModeToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<'client' | 'expert'>('client');
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    if (pathname.includes('/onboard') || pathname.includes('/dashboard') || pathname.includes('/offerings')) {
      setMode('expert');
    } else {
      setMode('client');
    }

    api.getHealth()
      .then(res => setHealth(res))
      .catch(() => setHealth(null));
  }, [pathname]);

  const handleSwitchMode = (newMode: 'client' | 'expert') => {
    setMode(newMode);
    if (newMode === 'expert') {
      router.push('/onboard');
    } else {
      router.push('/find');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2A] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00FF88]/20 to-[#00CC6A]/40 border border-[#00FF88]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all group-hover:scale-105">
            <Sparkles className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-wider text-white">NEXUS</span>
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30 font-semibold">
                MindGigs AI
              </span>
            </div>
            <p className="text-xs text-[#A0A0A0]">Agentic Marketplace Assistant</p>
          </div>
        </Link>

        {/* Dual Mode Switcher */}
        <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-[#2A2A2A]">
          <button
            onClick={() => handleSwitchMode('client')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'client'
                ? 'bg-[#00FF88] text-[#0A0A0A] shadow-[0_0_12px_rgba(0,255,136,0.4)]'
                : 'text-[#A0A0A0] hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            I Need an Expert
          </button>
          <button
            onClick={() => handleSwitchMode('expert')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'expert'
                ? 'bg-[#00FF88] text-[#0A0A0A] shadow-[0_0_12px_rgba(0,255,136,0.4)]'
                : 'text-[#A0A0A0] hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            I Am an Expert
          </button>
        </div>

        {/* Quick Nav Links & Health Indicator */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-[#A0A0A0]">
          {mode === 'expert' ? (
            <>
              <Link href="/onboard" className={`hover:text-[#00FF88] transition-colors ${pathname === '/onboard' ? 'text-[#00FF88]' : ''}`}>
                AI Onboarding
              </Link>
              <Link href="/dashboard" className={`hover:text-[#00FF88] transition-colors ${pathname === '/dashboard' ? 'text-[#00FF88]' : ''}`}>
                My Profile
              </Link>
            </>
          ) : (
            <>
              <Link href="/find" className={`hover:text-[#00FF88] transition-colors ${pathname === '/find' ? 'text-[#00FF88]' : ''}`}>
                Find Expert
              </Link>
              <Link href="/history" className={`hover:text-[#00FF88] transition-colors ${pathname === '/history' ? 'text-[#00FF88]' : ''}`}>
                Past Matches
              </Link>
            </>
          )}

          {/* Health Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1A1A] border border-[#2A2A2A]">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-[#00FF88] animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-[11px] text-[#A0A0A0]">
              {health?.status === 'ok' ? 'Agent System Online' : 'System Ready'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
