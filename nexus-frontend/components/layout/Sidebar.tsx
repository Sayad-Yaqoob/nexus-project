'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, LayoutDashboard, Calendar, ShoppingBag, Search, 
  UserCheck, Tag, Inbox, DollarSign, Video, Repeat, FileText, 
  BookOpen, Star, Gift, Mail, Share2, User
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-[#0B1320] border-r border-[#1E293B] h-screen sticky top-0 flex flex-col justify-between overflow-y-auto scrollbar-none z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1E293B] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00C49F] text-white font-black flex items-center justify-center text-lg shadow-[0_0_15px_rgba(0,196,159,0.3)]">
            M
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-lg">MINDGIGS</h1>
            <span className="text-[10px] uppercase text-[#00C49F] font-semibold tracking-wider">AI Marketplace</span>
          </div>
        </div>

        {/* Primary NEXUS Highlighted Item */}
        <div className="p-3">
          <Link
            href="/nexus"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
              isActive('/nexus')
                ? 'bg-[#112233] text-[#00C49F] border border-[#00C49F] shadow-[0_0_15px_rgba(0,196,159,0.2)]'
                : 'bg-[#112233]/70 text-[#00C49F] hover:bg-[#112233] border border-[#00C49F]/30'
            }`}
          >
            <Sparkles className="w-5 h-5 text-[#00C49F] animate-pulse" />
            <span className="text-sm">NEXUS Assistant</span>
            <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#00C49F]/20 text-[#00C49F] uppercase border border-[#00C49F]/40">
              AI
            </span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="px-3 py-2 space-y-6 text-sm">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          {/* BUY SECTION */}
          <div>
            <div className="px-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
              Buy
            </div>
            <div className="space-y-1">
              <Link
                href="/bookings"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/bookings')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                My Bookings
              </Link>
              <Link
                href="/purchases"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/purchases')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                My Purchases
              </Link>
              <Link
                href="/find"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/find')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <Search className="w-4 h-4" />
                Find Experts
              </Link>
            </div>
          </div>

          {/* SELL SECTION */}
          <div>
            <div className="px-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
              Sell
            </div>
            <div className="space-y-1">
              <Link
                href="/expert-profile"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/expert-profile')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Expert Profile
              </Link>
              <Link
                href="/my-offers"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/my-offers')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <Tag className="w-4 h-4" />
                My Offers
              </Link>
              <Link
                href="/incoming-bookings"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/incoming-bookings')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <Inbox className="w-4 h-4" />
                Incoming Bookings
              </Link>
              <Link
                href="/earnings"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/earnings')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Earnings
              </Link>
              <Link
                href="/sessions"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/sessions')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <Video className="w-4 h-4" />
                1:1 Sessions
              </Link>
              <Link
                href="/subscriptions"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/subscriptions')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <Repeat className="w-4 h-4" />
                Subscriptions
              </Link>
              <Link
                href="/products"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/products')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Digital Products
              </Link>
              <Link
                href="/books"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/books')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Books
              </Link>
              <Link
                href="/highlights"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/highlights')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <Star className="w-4 h-4" />
                Highlights
              </Link>
              <Link
                href="/custom-offerings"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/custom-offerings')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <Gift className="w-4 h-4" />
                Custom Offerings
              </Link>
              <Link
                href="/newsletter"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/newsletter')
                    ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
                }`}
              >
                <Mail className="w-4 h-4" />
                Newsletter
              </Link>
            </div>
          </div>

          {/* AFFILIATE & ACCOUNT */}
          <div className="pt-2 border-t border-[#1E293B] space-y-1">
            <Link
              href="/affiliate"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive('/affiliate')
                  ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Affiliate
            </Link>
            <Link
              href="/account"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive('/account')
                  ? 'bg-[#112233] text-[#00C49F] border-l-2 border-[#00C49F]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#112233]/50'
              }`}
            >
              <User className="w-4 h-4" />
              Account
            </Link>
          </div>
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-[#1E293B] text-[11px] text-[#64748B] flex justify-between items-center">
        <span>MindGigs v2.0</span>
        <span className="text-[#00C49F]">Groq AI</span>
      </div>
    </aside>
  );
};
