'use client';

import React from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ShoppingBag, ArrowRight } from 'lucide-react';

function MyPurchasesContent() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />

        <main className="p-8 max-w-6xl w-full mx-auto space-y-6">
          <div>
            <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              BUY / My Purchases
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              My Purchases
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Digital products and subscriptions you own
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center shadow-2xs space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-800 text-base">No purchases yet</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Digital products and subscriptions from experts will appear here.
            </p>

            <Link
              href="/experts"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <span>Explore Experts</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function MyPurchasesPage() {
  return (
    <AuthGuard>
      <MyPurchasesContent />
    </AuthGuard>
  );
}
