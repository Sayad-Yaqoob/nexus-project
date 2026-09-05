'use client';

import React from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/components/layout/AuthContext';
import { Sparkles, Calendar, ShoppingBag, DollarSign, Clock, ArrowRight, Video, CheckCircle2 } from 'lucide-react';

function OverviewContent() {
  const { user, perspective, loginAsMimic } = useAuth();
  const isExpertPerspective = perspective === 'expert';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />

        <main className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* Main Hero Banner: MindGigs Production Copy */}
          <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C49F]/10 text-[#00C49F] text-xs font-extrabold uppercase tracking-wider">
                  <Video className="w-3.5 h-3.5" />
                  mindGigs Marketplace
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  Stuck On Something? <span className="text-[#00C49F]">Book a Brilliant Mind</span>
                </h1>

                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  Book a 1:1 video session with a verified expert who already solved the problem and get answers face to face.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                <Link
                  href="/experts"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2"
                >
                  <span>Book an Expert</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {!isExpertPerspective && (
                  <button
                    onClick={() => loginAsMimic('expert')}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2"
                  >
                    <span>Become an Expert</span>
                    <ArrowRight className="w-4 h-4 text-[#00C49F]" />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#F1F5F9] text-xs text-slate-500 font-medium italic">
              Helping authors, experts, influencers and publishers monetize their knowledge, expertise, and audience.
            </div>
          </div>

          {/* Metrics Grid */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {isExpertPerspective ? 'Selling Metrics' : 'Client Overview'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {isExpertPerspective ? 'INCOMING BOOKINGS' : 'SESSIONS BOOKED'}
                </div>
                <div className="text-2xl font-black text-slate-900">0</div>
                <div className="text-xs text-slate-400">All time</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  UPCOMING SESSIONS
                </div>
                <div className="text-2xl font-black text-slate-900">0</div>
                <div className="text-xs text-slate-400">Paid & confirmed</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  COMPLETED SESSIONS
                </div>
                <div className="text-2xl font-black text-slate-900">0</div>
                <div className="text-xs text-slate-400">Successfully done</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {isExpertPerspective ? 'SELLING EARNINGS' : 'TOTAL SPENT'}
                </div>
                <div className="text-2xl font-black text-[#00C49F]">$0.00</div>
                <div className="text-xs text-slate-400">{user?.currency || 'USD'}</div>
              </div>
            </div>
          </div>

          {/* Bookings / Sessions Container */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isExpertPerspective ? 'Recent Client Bookings' : 'My Bookings'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isExpertPerspective ? 'Incoming client session requests' : 'Your scheduled sessions with experts'}
                </p>
              </div>

              <Link
                href="/experts"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>Find an Expert</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00C49F]" />
              </Link>
            </div>

            {/* Empty State */}
            <div className="p-12 text-center rounded-xl bg-[#F8F9FA] border border-dashed border-[#CBD5E1] space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">No upcoming sessions</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isExpertPerspective
                  ? 'Your client bookings will appear here once clients purchase your 1:1 sessions.'
                  : 'Book a 1:1 session with verified experts across AI, engineering, business, and marketing.'}
              </p>
              <Link
                href="/experts"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00C49F] hover:underline pt-1"
              >
                <span>Explore Experts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <AuthGuard>
      <OverviewContent />
    </AuthGuard>
  );
}
