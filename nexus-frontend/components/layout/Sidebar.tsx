'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { 
  Sparkles, Bot, LogOut, User as UserIcon, RefreshCw, ShieldCheck, Zap 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loginAsMimic } = useAuth();
  const [switching, setSwitching] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleSwitchPersona = async () => {
    setSwitching(true);
    try {
      const targetRole = user?.role === 'expert' ? 'client' : 'expert';
      await loginAsMimic(targetRole);
      router.refresh();
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-[#0B1320] border-r border-[#1E293B] h-screen sticky top-0 flex flex-col justify-between overflow-y-auto scrollbar-none z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1E293B] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00C49F] text-slate-950 font-black flex items-center justify-center text-xl shadow-md shadow-[#00C49F]/20">
            N
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-lg">NEXUS</h1>
            <span className="text-[10px] uppercase text-[#00C49F] font-bold tracking-wider">
              Agentic Marketplace
            </span>
          </div>
        </div>

        {/* Primary Workspace Link */}
        <div className="p-3">
          <Link
            href="/nexus"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
              isActive('/nexus')
                ? 'bg-[#112233] text-[#00C49F] border border-[#00C49F]/50 shadow-md shadow-[#00C49F]/10'
                : 'bg-[#112233]/60 text-slate-300 hover:bg-[#112233] hover:text-[#00C49F] border border-slate-800'
            }`}
          >
            <Sparkles className="w-5 h-5 text-[#00C49F]" />
            <span className="text-sm">Agent Canvas</span>
            <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#00C49F]/20 text-[#00C49F] uppercase border border-[#00C49F]/30">
              ACTIVE
            </span>
          </Link>
        </div>

        {/* Active User Persona Card */}
        {user && (
          <div className="mx-3 mt-2 p-4 rounded-xl bg-[#112233]/80 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#00C49F]" />
                Identity
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border ${
                user.role === 'expert'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {user.role}
              </span>
            </div>

            <div>
              <div className="font-semibold text-white text-sm truncate">{user.full_name}</div>
              <div className="text-xs text-slate-400 truncate">@{user.public_handle}</div>
              <div className="text-[11px] text-slate-400 mt-1">Currency: <span className="font-semibold text-slate-300">{user.currency || 'USD'}</span></div>
            </div>

            <button
              onClick={handleSwitchPersona}
              disabled={switching}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 border border-slate-600/60 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00C49F] ${switching ? 'animate-spin' : ''}`} />
              Switch Persona ({user.role === 'expert' ? 'Client' : 'Expert'})
            </button>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-[#1E293B] space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
          <Bot className="w-4 h-4 text-[#00C49F]" />
          <span>NexusGraph Online</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout Session
        </button>
      </div>
    </aside>
  );
};
