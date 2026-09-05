'use client';

import React from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MyOffersView } from '@/components/marketplace/MyOffersView';
import { BookOpen } from 'lucide-react';

function BooksContent() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        <main className="p-8 max-w-6xl w-full mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl border border-purple-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase text-purple-600 tracking-wider">SELL / Books</div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Books Manager</h1>
              <p className="text-xs text-slate-500 mt-0.5">Publish and manage digital books, PDFs, and retailer links on MindGigs.</p>
            </div>
          </div>
          <MyOffersView />
        </main>
      </div>
    </div>
  );
}

export default function BooksPage() {
  return (
    <AuthGuard>
      <BooksContent />
    </AuthGuard>
  );
}
