'use client';

import React from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Calendar, ArrowRight, Search } from 'lucide-react';

function MyBookingsContent() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />

        <main className="p-8 max-w-6xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                BUY / My Bookings
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                My Session Bookings
              </h1>
            </div>

            <Link
              href="/experts"
              className="px-4 py-2 bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore Experts</span>
            </Link>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E8F0] text-slate-400 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-2">EXPERT</th>
                  <th className="pb-3 px-2">SESSION TYPE</th>
                  <th className="pb-3 px-2">DATE & TIME</th>
                  <th className="pb-3 px-2">STATUS</th>
                  <th className="pb-3 px-2">PAYMENT</th>
                  <th className="pb-3 px-2 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* Empty State */}
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-slate-700 text-sm">No session bookings found</div>
                    <p className="text-xs text-slate-400 mt-1">Book 1:1 sessions with verified experts on mindGigs.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <AuthGuard>
      <MyBookingsContent />
    </AuthGuard>
  );
}
