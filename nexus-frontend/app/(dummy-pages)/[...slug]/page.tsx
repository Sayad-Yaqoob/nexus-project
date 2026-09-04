'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { FloatingBubble } from '@/components/layout/FloatingBubble';
import { Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DummyPage() {
  const pathname = usePathname();
  const pageTitle = pathname.replace('/', '').replace('-', ' ').toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-12 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#00C49F] mb-6 shadow-sm">
            <Clock className="w-8 h-8 animate-spin-slow" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#00C49F] mb-2 bg-[#00C49F]/10 px-3 py-1 rounded-full border border-[#00C49F]/30">
            Sprint 3 Upcoming
          </span>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-3 tracking-wide">{pageTitle || 'PAGE'}</h1>
          <p className="text-sm text-[#64748B] max-w-md mb-8 leading-relaxed">
            This module is reserved for upcoming Sprints. Use the NEXUS Assistant AI workspace for expert profiling and client matching.
          </p>

          <Link
            href="/nexus"
            className="px-6 py-3 rounded-xl bg-[#00C49F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#059669] shadow-xs transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Launch NEXUS Assistant
          </Link>
        </main>
      </div>

      <FloatingBubble />
    </div>
  );
}
