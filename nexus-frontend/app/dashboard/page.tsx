'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Package, Plus, Sparkles, User, Tag, DollarSign, Calendar, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { UserContext } from '@/lib/types';

export default function DashboardPage() {
  const [ctx, setCtx] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [newOfferingText, setNewOfferingText] = useState('');
  const [addingOffering, setAddingOffering] = useState(false);

  const fetchProfile = async () => {
    try {
      // Demo login as expert user 1
      await api.demoLogin(1);
      const data = await api.getUserMe();
      setCtx(data);
    } catch (err) {
      console.error('Error fetching expert profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAddOffering = async () => {
    if (!newOfferingText.trim() || !ctx?.existing_profile?.id) return;
    setAddingOffering(true);
    try {
      await api.addOffering(ctx.existing_profile.id, newOfferingText);
      setNewOfferingText('');
      await fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to add offering');
    } finally {
      setAddingOffering(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#A0A0A0]">
        Loading your MindGigs expert profile...
      </div>
    );
  }

  const profile = ctx?.existing_profile;
  const offerings = ctx?.offerings || [];

  return (
    <div className="py-6 space-y-8 max-w-5xl mx-auto">
      {/* Profile Overview Header */}
      <div className="p-8 rounded-3xl bg-[#141414] border border-[#2A2A2A] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Sparkles className="w-32 h-32 text-[#00FF88]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">{ctx?.user?.full_name || 'Expert Member'}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Expert
              </span>
            </div>
            <p className="text-sm font-medium text-[#00FF88]">{profile?.headline || 'Subject Matter Expert'}</p>
            <p className="text-xs text-[#A0A0A0] max-w-2xl leading-relaxed">{profile?.bio}</p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] text-right">
            <span className="text-[10px] uppercase text-[#A0A0A0] block">Category</span>
            <span className="text-xs font-bold text-white">{profile?.category || 'AI & Data'}</span>
          </div>
        </div>
      </div>

      {/* Offerings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#00FF88]" />
            Published Offerings & Catalog ({offerings.length})
          </h2>
        </div>

        {/* Add Offering Box */}
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-3">
          <label className="text-xs font-semibold text-white block">Add New Service or Digital Product via Natural Language</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newOfferingText}
              onChange={(e) => setNewOfferingText(e.target.value)}
              placeholder="e.g. 1:1 Code Audit Session for 60 mins at $150 or Python FastAPI Boilerplate ZIP at $49"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] text-xs text-white placeholder-[#A0A0A0] outline-none focus:border-[#00FF88]/50"
            />
            <button
              onClick={handleAddOffering}
              disabled={addingOffering || !newOfferingText.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#00FF88] hover:bg-[#00CC6A] text-[#0A0A0A] font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Offering
            </button>
          </div>
        </div>

        {/* Offerings List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offerings.map((offering) => (
            <div key={offering.id} className="p-5 rounded-2xl bg-[#141414] border border-[#2A2A2A] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-[#00FF88] border border-[#2A2A2A]">
                    {offering.offer_type}
                  </span>
                  <span className="text-sm font-bold text-white">${offering.price}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{offering.title}</h3>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#A0A0A0] pt-2 border-t border-[#2A2A2A]">
                <span>Active Listing</span>
                <span className="text-[#00FF88]">Ready for booking</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
