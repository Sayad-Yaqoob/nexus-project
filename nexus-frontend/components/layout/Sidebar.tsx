'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { 
  LayoutDashboard, Calendar, ShoppingBag, Search, 
  UserCheck, DollarSign, BookOpen, Star, Mail, Settings, 
  Bell, CreditCard, RefreshCw, Share2, Layers, Tag, ChevronRight, Award, Zap, Sparkles, LogOut
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, perspective, setPerspective, logout, loginAsMimic } = useAuth();
  const [switching, setSwitching] = useState(false);

  const isActive = (path: string) => pathname === path;

  const isExpertAccount = user?.role === 'expert' || user?.capabilities?.includes('expert');
  const isExpertPerspective = isExpertAccount && (perspective === 'expert' || user?.perspective === 'expert');

  const handleSwitchPerspective = (newPerspective: 'client' | 'expert') => {
    if (setPerspective) {
      setPerspective(newPerspective);
    }
  };

  const handleDemoSwitch = async () => {
    setSwitching(true);
    try {
      const targetRole = user?.role === 'expert' ? 'client' : 'expert';
      await loginAsMimic(targetRole);
      router.refresh();
    } catch (err) {
      console.error('Failed to switch demo persona:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <aside className="w-64 bg-[#0B1320] border-r border-[#1E293B] h-screen sticky top-0 flex flex-col justify-between overflow-y-auto scrollbar-none z-30 select-none text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
          <Link href="/overview" className="flex items-center gap-2.5 group">
            <span className="font-black text-[#00C49F] text-2xl tracking-tight leading-none group-hover:scale-105 transition-transform">
              mindGigs
            </span>
          </Link>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border ${
            isExpertAccount
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {isExpertAccount ? 'EXPERT' : 'MEMBER'}
          </span>
        </div>

        {/* TOP: Active User & Instant Persona Switcher (Always Visible) */}
        {user && (
          <div className="p-3.5 border-b border-[#1E293B] bg-[#070D18]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                  user.role === 'expert' 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'expert' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                    <span className="capitalize">{user.role} Account</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Switcher Buttons - Top Visibility */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleDemoSwitch}
                disabled={switching}
                title={`Switch to ${user.role === 'expert' ? 'Client' : 'Expert'} persona`}
                className="w-full py-1.5 px-2 bg-[#112233] hover:bg-[#162a3f] text-slate-200 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700/80 flex items-center justify-center gap-1.5 transition-all group"
              >
                <RefreshCw className={`w-3 h-3 text-[#00C49F] ${switching ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                <span>Switch Role</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                title="Log out and return to persona selection"
                className="w-full py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-[11px] font-bold border border-red-500/20 flex items-center justify-center gap-1 transition-all"
              >
                <LogOut className="w-3 h-3 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Perspective Switcher for Experts */}
        {isExpertAccount && (
          <div className="p-3 border-b border-[#1E293B] bg-[#070D18]">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
              Active Perspective
            </div>
            <div className="grid grid-cols-2 gap-1 bg-[#112233] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleSwitchPerspective('client')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isExpertPerspective
                    ? 'bg-[#00C49F] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Client
              </button>
              <button
                onClick={() => handleSwitchPerspective('expert')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isExpertPerspective
                    ? 'bg-[#00C49F] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Expert
              </button>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="p-3 space-y-4 text-xs font-medium">
          {/* NEXUS AI WORKSPACE BUTTON - ALWAYS AT TOP */}
          <div className="pb-1">
            <Link
              href="/nexus"
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                isActive('/nexus')
                  ? 'bg-gradient-to-r from-[#00C49F]/20 to-emerald-500/10 text-[#00C49F] font-bold border border-[#00C49F]/50 shadow-xs'
                  : 'text-white hover:text-white bg-[#112233] hover:bg-[#162a3f] border border-slate-700/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${isActive('/nexus') ? 'bg-[#00C49F] text-slate-950 shadow-xs' : 'bg-[#00C49F]/20 text-[#00C49F]'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-xs tracking-tight text-white">NEXUS AI</div>
                  <div className="text-[10px] text-slate-400 font-normal">Workspace</div>
                </div>
              </div>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                isActive('/nexus') ? 'bg-[#00C49F] text-slate-950' : 'bg-[#00C49F]/20 text-[#00C49F]'
              }`}>
                {isActive('/nexus') ? 'Active' : 'Open'}
              </span>
            </Link>
          </div>

          {/* DASHBOARD SECTION */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Dashboard
            </div>
            <Link
              href="/overview"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                isActive('/overview')
                  ? 'bg-[#112233] text-[#00C49F] font-bold border-l-2 border-[#00C49F]'
                  : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </Link>
            <Link
              href="/experts"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                isActive('/experts')
                  ? 'bg-[#112233] text-[#00C49F] font-bold border-l-2 border-[#00C49F]'
                  : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
              }`}
            >
              <Search className="w-4 h-4 text-[#00C49F]" />
              <span>Explore Experts</span>
            </Link>
          </div>

          {/* BUY SECTION */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-extrabold text-emerald-400/80 uppercase tracking-wider">
              Buy
            </div>
            <div className="space-y-1">
              <Link
                href="/my-bookings"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                  isActive('/my-bookings')
                    ? 'bg-[#112233] text-[#00C49F] font-bold border-l-2 border-[#00C49F]'
                    : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                }`}
              >
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>My Bookings</span>
              </Link>
              <Link
                href="/my-purchases"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                  isActive('/my-purchases')
                    ? 'bg-[#112233] text-[#00C49F] font-bold border-l-2 border-[#00C49F]'
                    : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>My Purchases</span>
              </Link>
            </div>
          </div>

          {/* SELL SECTION (Visible ONLY in Expert Perspective) */}
          {isExpertPerspective && (
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-extrabold text-purple-400/80 uppercase tracking-wider flex items-center justify-between">
                <span>Sell</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">Expert</span>
              </div>
              <div className="space-y-1">
                <Link
                  href="/sell/profile"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/profile') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Expert Profile</span>
                </Link>
                <Link
                  href="/sell/offers"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/offers') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>My Offers</span>
                </Link>
                <Link
                  href="/sell/incoming-bookings"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/incoming-bookings') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Incoming Bookings</span>
                </Link>
                <Link
                  href="/sell/earnings"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/earnings') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                  <span>Earnings</span>
                </Link>
                <Link
                  href="/sell/sessions"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/sessions') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>1:1 Sessions</span>
                </Link>
                <Link
                  href="/sell/subscriptions"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/subscriptions') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                  <span>Subscriptions</span>
                </Link>
                <Link
                  href="/sell/products"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/products') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Digital Products</span>
                </Link>
                <Link
                  href="/sell/books"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/books') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Books</span>
                </Link>
                <Link
                  href="/sell/highlights"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/highlights') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>Highlights</span>
                </Link>
                <Link
                  href="/sell/custom"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/custom') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-purple-400" />
                  <span>Custom Offerings</span>
                </Link>
                <Link
                  href="/sell/newsletter"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                    isActive('/sell/newsletter') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>Newsletter</span>
                </Link>
              </div>
            </div>
          )}

          {/* AFFILIATE SECTION */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Affiliate
            </div>
            <div className="space-y-1">
              <Link
                href="/affiliate/links"
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive('/affiliate/links') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Links & Codes</span>
              </Link>
              <Link
                href="/affiliate/earnings"
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive('/affiliate/earnings') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Earnings & Payouts</span>
              </Link>
              <Link
                href="/affiliate/history"
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive('/affiliate/history') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>History</span>
              </Link>
            </div>
          </div>

          {/* ACCOUNT SECTION */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Account
            </div>
            <div className="space-y-1">
              <Link
                href="/account/general"
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive('/account/general') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>General</span>
              </Link>
              <Link
                href="/account/notifications"
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive('/account/notifications') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-slate-400" />
                <span>Notifications</span>
              </Link>
              <Link
                href="/account/billing"
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive('/account/billing') ? 'bg-[#112233] text-[#00C49F] font-bold' : 'text-slate-400 hover:text-white hover:bg-[#112233]/60'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Billing</span>
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-[#1E293B] space-y-2 bg-[#070D18]">
        {/* Start Selling CTA for non-expert accounts */}
        {!isExpertAccount && (
          <button
            onClick={handleDemoSwitch}
            className="w-full py-2 px-3 bg-gradient-to-r from-[#00C49F] to-emerald-600 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-between shadow-xs hover:opacity-95 transition-opacity"
          >
            <span>Start Selling</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <Link
          href="/experts"
          className="w-full py-2 px-3 bg-[#112233] hover:bg-[#162a3f] text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[#00C49F]" />
          <span>Find Experts</span>
        </Link>
      </div>
    </aside>
  );
};
