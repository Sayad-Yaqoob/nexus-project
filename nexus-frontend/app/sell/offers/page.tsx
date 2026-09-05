'use client';

import React from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MyOffersView } from '@/components/marketplace/MyOffersView';

function MyOffersContent() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        <main className="p-8 max-w-6xl w-full mx-auto">
          <MyOffersView />
        </main>
      </div>
    </div>
  );
}

export default function MyOffersPage() {
  return (
    <AuthGuard>
      <MyOffersContent />
    </AuthGuard>
  );
}
