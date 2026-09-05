'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/components/layout/AuthContext';
import { User, Lock, Save, Sparkles, CheckCircle2 } from 'lucide-react';

function AccountGeneralContent() {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('New York, USA');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />

        <main className="p-8 max-w-4xl w-full mx-auto space-y-6">
          <div>
            <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              ACCOUNT / General Settings
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              General Account Settings
            </h1>
          </div>

          {saved && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile information updated successfully.</span>
            </div>
          )}

          {/* Profile Information Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-6">
            <h3 className="font-bold text-slate-900 text-base border-b border-[#E2E8F0] pb-3">
              Profile Information
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#00C49F]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#00C49F]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#00C49F]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#00C49F]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AccountGeneralPage() {
  return (
    <AuthGuard>
      <AccountGeneralContent />
    </AuthGuard>
  );
}
