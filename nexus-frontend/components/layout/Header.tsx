'use client';

import React from 'react';
import { useAuth } from './AuthContext';
import { Sparkles, Bell, Search, LogOut } from 'lucide-react';
import Link from 'next/link';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Search Input */}
      <div className="flex items-center gap-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg px-3 py-1.5 w-72 text-sm text-[#64748B] focus-within:border-[#00C49F]">
        <Search className="w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search experts, offers, services..."
          className="bg-transparent border-none outline-none text-[#1E293B] placeholder-[#94A3B8] w-full text-xs"
        />
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Launch NEXUS */}
        <Link
          href="/nexus"
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#00C49F]/10 text-[#00C49F] border border-[#00C49F]/30 hover:bg-[#00C49F]/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          NEXUS AI
        </Link>

        {/* Notifications */}
        <button className="p-2 text-[#64748B] hover:text-[#1E293B] rounded-lg hover:bg-[#F1F5F9] transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00C49F]"></span>
        </button>

        {/* User Info & Avatar */}
        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-[#E2E8F0]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00C49F] to-[#0284C7] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-[#1E293B] leading-tight">{user.full_name}</div>
              <div className="text-[10px] text-[#64748B] capitalize">Role: {user.role}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-[#94A3B8] hover:text-red-500 rounded-lg hover:bg-[#F1F5F9] transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#00C49F] text-white hover:bg-[#059669] transition-colors shadow-xs"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
