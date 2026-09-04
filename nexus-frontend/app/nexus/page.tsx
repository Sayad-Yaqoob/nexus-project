'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ExpertStudio } from '@/components/nexus/ExpertStudio';
import { ClientMatch } from '@/components/nexus/ClientMatch';
import { UserCheck, Search, Sparkles } from 'lucide-react';

function NexusWorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode = searchParams.get('mode') === 'match' ? 'match' : 'studio';
  const [mode, setMode] = useState<'studio' | 'match'>(initialMode);

  useEffect(() => {
    const queryMode = searchParams.get('mode');
    if (queryMode === 'match' || queryMode === 'studio') {
      setMode(queryMode);
    }
  }, [searchParams]);

  const handleToggleMode = (newMode: 'studio' | 'match') => {
    setMode(newMode);
    router.push(`/nexus?mode=${newMode}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-8 flex-1 overflow-y-auto">
          {/* Top Toggle Bar */}
          <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto border-b border-[#E2E8F0] pb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1E293B] tracking-wide flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#00C49F]" />
                NEXUS AI Workspace
              </h1>
              <p className="text-xs text-[#64748B] mt-1">
                Personal AI sales growth engine powered by Groq & FAISS vector search
              </p>
            </div>

            {/* Mode Toggle Switch */}
            <div className="bg-white border border-[#CBD5E1] p-1 rounded-xl flex items-center gap-1 shadow-xs">
              <button
                onClick={() => handleToggleMode('studio')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  mode === 'studio'
                    ? 'bg-[#00C49F] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Expert Studio
              </button>

              <button
                onClick={() => handleToggleMode('match')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  mode === 'match'
                    ? 'bg-[#00C49F] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                }`}
              >
                <Search className="w-4 h-4" />
                Client Match
              </button>
            </div>
          </div>

          {/* Tab Views */}
          {mode === 'studio' ? <ExpertStudio /> : <ClientMatch />}
        </main>
      </div>
    </div>
  );
}

export default function NexusPage() {
  return (
    <AuthGuard>
      <React.Suspense fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-[#00C49F]">
          Loading NEXUS Workspace...
        </div>
      }>
        <NexusWorkspaceContent />
      </React.Suspense>
    </AuthGuard>
  );
}
