'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthContext';
import { 
  Sparkles, Bot, LogOut, User as UserIcon, RefreshCw, ShieldCheck, Zap,
  Search, Calendar, ShoppingBag, Award, DollarSign, Layers, BookOpen,
  Mail, Star, Settings, Bell, CreditCard, ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get('tab') : null;
  const { user, logout, loginAsMimic } = useAuth();
  const [switching, setSwitching] = useState(false);

  const isTabActive = (tabName: string) => {
    if (pathname === '/nexus') {
      if (!currentTab && tabName === 'agent_canvas') return true;
      return currentTab === tabName;
    }
    return false;
  };

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

  const isExpert = user?.role === 'expert';

  return (
    <aside className="w-64 bg-[#070D18] border-r border-slate-800/80 h-screen sticky top-0 flex flex-col justify-between overflow-y-auto scrollbar-none z-30 select-none text-slate-300">
      <div>
        {/* Brand Header */}
        <Link href="/" className="p-5 border-b border-slate-800/80 flex items-center gap-3 hover:bg-[#0B1320] transition-colors group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C49F] to-emerald-600 text-slate-950 font-black flex items-center justify-center text-xl shadow-md shadow-[#00C49F]/20 group-hover:scale-105 transition-transform">
            m
          </div>
          <div>
            <h1 className="font-extrabold text-white tracking-tight text-lg leading-none">mindGigs</h1>
            <span className="text-[10px] uppercase text-[#00C49F] font-bold tracking-wider">
              powered by NEXUS
            </span>
          </div>
        </Link>

        {/* Primary Navigation Sections */}
        <div className="p-3 space-y-5">
          {/* Overview */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Overview
            </div>
            <Link
              href="/nexus"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                isTabActive('agent_canvas')
                  ? 'bg-[#112233] text-[#00C49F] border border-[#00C49F]/40 shadow-sm'
                  : 'text-slate-300 hover:bg-[#112233]/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#00C49F]" />
              <span>NEXUS Agent Canvas</span>
            </Link>
          </div>

          {/* BUY Section (Client & Expert) */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/80 flex items-center justify-between">
              <span>BUY</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">Client</span>
            </div>
            <div className="space-y-1">
              <Link
                href="/nexus?tab=match_search"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isTabActive('match_search')
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Find Experts</span>
              </Link>
              <Link
                href="/nexus?tab=bookings"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isTabActive('bookings')
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>My Bookings</span>
              </Link>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 cursor-not-allowed">
                <ShoppingBag className="w-4 h-4 text-slate-600" />
                <span>My Purchases</span>
              </div>
            </div>
          </div>

          {/* SELL Section (ONLY for Expert accounts) */}
          {isExpert && (
            <div>
              <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-purple-400/80 flex items-center justify-between">
                <span>SELL</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">Expert</span>
              </div>
              <div className="space-y-1">
                <Link
                  href="/nexus?tab=my_offers"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isTabActive('my_offers')
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>My Offers</span>
                </Link>
                <Link
                  href="/nexus?tab=bookings"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isTabActive('bookings')
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Incoming Bookings</span>
                </Link>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span>Earnings & Payouts</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                  <span>Books & Digital Products</span>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT Section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Account
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>General Settings</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Notifications</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active User Persona Card */}
        {user && (
          <div className="mx-3 mt-2 p-3.5 rounded-xl bg-[#0F172A] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border ${
                isExpert
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {user.role}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">@{user.public_handle}</span>
            </div>

            <div>
              <div className="font-semibold text-white text-xs truncate">{user.full_name}</div>
              <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
            </div>

            <button
              onClick={handleSwitchPersona}
              disabled={switching}
              className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 text-[#00C49F] ${switching ? 'animate-spin' : ''}`} />
              Switch to {isExpert ? 'Client' : 'Expert'} Demo
            </button>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
          <Bot className="w-4 h-4 text-[#00C49F]" />
          <span>NexusGraph Active</span>
        </div>

        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="w-full py-2 px-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout Session
        </button>
      </div>
    </aside>
  );
};
