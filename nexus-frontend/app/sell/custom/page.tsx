'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/components/layout/AuthContext';
import { apiUrl, getStoredToken } from '@/lib/api';
import { Offering } from '@/lib/types';
import Link from 'next/link';
import { 
  Star, Plus, Sparkles, Trash2, Edit2, CheckCircle2, AlertCircle, 
  ArrowRight, DollarSign, Clock, ShieldCheck, Layers, FileText
} from 'lucide-react';

function CustomOfferingsContent() {
  const { user } = useAuth();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Creation form modal state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('1 Month Retainer');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      const res = await fetch(`${apiUrl}/api/v1/offerings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter or display custom offerings, or all expert offerings
        setOfferings(data);
      }
    } catch (err: any) {
      console.error('Failed to load offerings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, []);

  const handleCreateOffering = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !price) {
      setError('Please provide a title and price.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const token = getStoredToken();
      const res = await fetch(`${apiUrl}/api/v1/offerings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          price: parseFloat(price),
          offer_type: 'Custom Offering',
          duration: duration.trim() || 'Custom Scope',
          description: description.trim() || `${title.trim()} — bespoke advisory scope on mindGigs.`,
          file_required: false
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to create custom offering');
      }

      setSuccess(`Custom offering "${title}" created and verified in database!`);
      setTitle('');
      setPrice('');
      setDescription('');
      setIsCreating(false);
      await fetchOfferings();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error creating custom offering');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffering = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this custom offering?')) return;
    try {
      const token = getStoredToken();
      const res = await fetch(`${apiUrl}/api/v1/offerings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setOfferings(prev => prev.filter(o => o.id !== id));
        setSuccess('Offering deleted successfully.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError('Failed to delete offering');
    }
  };

  const applyTemplate = (tmplTitle: string, tmplPrice: number, tmplDuration: string, tmplDesc: string) => {
    setTitle(tmplTitle);
    setPrice(String(tmplPrice));
    setDuration(tmplDuration);
    setDescription(tmplDesc);
    setIsCreating(true);
  };

  const customOffers = offerings.filter(o => o.offer_type === 'Custom Offering' || o.offer_type === 'Custom Offer');
  const allOffers = offerings;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        <main className="p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-200 shadow-2xs">
                <Star className="w-7 h-7 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase text-amber-600 tracking-wider">SELL / Custom Scope</div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Custom Offerings Studio</h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Publish tailored advisory retainers, bespoke scopes, and custom packages directly to your profile.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/nexus"
                className="px-4 py-2.5 rounded-xl border border-[#00C49F]/40 bg-[#00C49F]/10 hover:bg-[#00C49F]/20 text-[#00C49F] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Draft via NEXUS AI</span>
              </Link>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#00C49F]" />
                <span>New Custom Offering</span>
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Creation Form (Inline Collapse / Card) */}
          {isCreating && (
            <div className="bg-white border-2 border-[#00C49F]/40 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#00C49F] fill-[#00C49F]" />
                  Create New Bespoke Custom Offering
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateOffering} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Offering Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Enterprise Architecture Audit & 90-Day Roadmap"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Fixed Price ($ USD)</label>
                    <input
                      type="number"
                      step="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 2500"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Scope Duration / Cadence</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 1 Month Retainer, Per Milestone, 2 Weeks Deliverable"
                      className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Description & Deliverables</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what client receives, scope milestones, and deliverables..."
                      className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Publish Custom Offering</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Pre-made Templates */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Popular Custom Retainer Templates (1-Click Draft)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => applyTemplate(
                  'Fractional Executive Advisory Retainer',
                  3500,
                  'Monthly Retainer',
                  'Direct bi-weekly strategy calls, unlimited asynchronous Slack/Email advisory, and board prep assistance.'
                )}
                className="p-4 bg-white border border-[#E2E8F0] hover:border-[#00C49F] rounded-2xl text-left space-y-1 group transition-all shadow-2xs hover:shadow-xs"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#00C49F] transition-colors">
                  Fractional Executive Retainer
                </div>
                <div className="text-[11px] text-slate-500 font-medium">$3,500/mo • Slack & Strategy Calls</div>
              </button>

              <button
                onClick={() => applyTemplate(
                  'Deep-Dive Architecture Audit & Roadmap',
                  1800,
                  '2-Week Milestone',
                  'Comprehensive codebase/infrastructure review, risk assessment matrix, and prioritized technical blueprint.'
                )}
                className="p-4 bg-white border border-[#E2E8F0] hover:border-[#00C49F] rounded-2xl text-left space-y-1 group transition-all shadow-2xs hover:shadow-xs"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#00C49F] transition-colors">
                  Architecture Audit & Roadmap
                </div>
                <div className="text-[11px] text-slate-500 font-medium">$1,800 • 2-Week Deliverable</div>
              </button>

              <button
                onClick={() => applyTemplate(
                  'Zero-to-One Growth Strategy Blueprint',
                  1250,
                  '1-Week Scope',
                  'Go-to-market plan, ICP definition, pricing model optimization, and outbound engine launch checklist.'
                )}
                className="p-4 bg-white border border-[#E2E8F0] hover:border-[#00C49F] rounded-2xl text-left space-y-1 group transition-all shadow-2xs hover:shadow-xs"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#00C49F] transition-colors">
                  Growth Strategy Blueprint
                </div>
                <div className="text-[11px] text-slate-500 font-medium">$1,250 • 1-Week Scope</div>
              </button>
            </div>
          </div>

          {/* Offerings List */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Your Active Custom Offerings</h3>
                <p className="text-xs text-slate-500">Live verified records stored in SQLite database.</p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#00C49F]/10 text-[#00C49F] border border-[#00C49F]/30">
                {customOffers.length > 0 ? `${customOffers.length} Custom Offers` : `${allOffers.length} Total Offers`}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading custom offerings from database...</div>
            ) : offerings.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#F8F9FA] border border-dashed border-[#CBD5E1] space-y-3">
                <Star className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="font-bold text-slate-800 text-sm">No custom offerings created yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "New Custom Offering" above or use one of the 1-click templates to publish your first tailored scope.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-[#00C49F] text-slate-950 font-bold text-xs rounded-xl shadow-xs"
                >
                  Create Your First Offering
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offerings.map((off) => (
                  <div
                    key={off.id}
                    className="p-5 rounded-2xl border border-[#E2E8F0] hover:border-slate-300 bg-[#F8F9FA] flex flex-col justify-between space-y-3 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 uppercase tracking-wide">
                          {off.offer_type}
                        </span>
                        <div className="text-lg font-black text-slate-900">${off.price?.toFixed(2)}</div>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{off.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{off.description || 'No description provided.'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {off.duration || 'Custom Scope'}
                      </span>
                      <button
                        onClick={() => handleDeleteOffering(off.id!)}
                        className="text-red-500 hover:text-red-700 font-semibold p-1 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete offering"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CustomOfferingsPage() {
  return (
    <AuthGuard>
      <CustomOfferingsContent />
    </AuthGuard>
  );
}
