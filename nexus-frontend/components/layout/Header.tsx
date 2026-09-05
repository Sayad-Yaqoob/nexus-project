'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { NexusDrawer } from './NexusDrawer';
import { Sparkles, Search, User as UserIcon, Bell, ChevronDown } from 'lucide-react';

const ROUTE_TITLES: Record<string, string> = {
  '/overview': 'Overview',
  '/my-bookings': 'My Bookings',
  '/my-purchases': 'My Purchases',
  '/experts': 'Explore Experts',
  '/sell/profile': 'Expert Profile',
  '/sell/offers': 'My Offers',
  '/sell/incoming-bookings': 'Incoming Bookings',
  '/sell/earnings': 'Selling Earnings',
  '/sell/sessions': '1:1 Sessions',
  '/sell/subscriptions': 'Subscriptions',
  '/sell/products': 'Digital Products',
  '/sell/books': 'Books',
  '/sell/highlights': 'Highlights',
  '/sell/custom': 'Custom Offerings',
  '/sell/newsletter': 'Newsletter',
  '/affiliate/links': 'Links & Codes',
  '/affiliate/earnings': 'Affiliate Earnings',
  '/affiliate/history': 'Referral History',
  '/account/general': 'General Settings',
  '/account/notifications': 'Notifications',
  '/account/billing': 'Billing & Payouts',
  '/nexus': 'NEXUS Agent Canvas'
};

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, perspective, setPerspective } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = ROUTE_TITLES[pathname] || 'mindGigs';
  const isExpertAccount = user?.role === 'expert' || user?.capabilities?.includes('expert');

  return (
    <>
      <header className="h-16 bg-[#0B1320] border-b border-[#1E293B] px-6 flex items-center justify-between sticky top-0 z-20 select-none text-slate-200 shrink-0">
        {/* Left Title */}
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-white text-lg tracking-tight">{title}</h1>
        </div>

        {/* Right Search & Controls */}
        <div className="flex items-center gap-3">
          {/* Global Search Box */}
          <div className="relative hidden md:flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search experts, topics..."
              className="bg-[#112233] border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00C49F] w-56"
            />
          </div>

          {/* Perspective Indicator for Experts */}
          {isExpertAccount && (
            <div className="hidden sm:flex items-center bg-[#112233] border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setPerspective('client')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  perspective === 'client'
                    ? 'bg-[#00C49F] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Client View
              </button>
              <button
                onClick={() => setPerspective('expert')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  perspective === 'expert'
                    ? 'bg-[#00C49F] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Expert View
              </button>
            </div>
          )}

          {/* GLOBAL NEXUS ASSISTANT BUTTON */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="px-3.5 py-2 bg-[#00C49F]/10 hover:bg-[#00C49F]/20 border border-[#00C49F]/40 text-[#00C49F] rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-102"
          >
            <Sparkles className="w-4 h-4 text-[#00C49F]" />
            <span>NEXUS Assistant</span>
          </button>

          {/* User Avatar */}
          {user && (
            <div className="flex items-center gap-2 border-l border-[#1E293B] pl-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center justify-center border border-slate-700">
                {user.full_name.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Global NEXUS Drawer */}
      <NexusDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
