'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/components/layout/AuthContext';
import Link from 'next/link';
import { 
  Mail, Users, TrendingUp, DollarSign, Plus, Sparkles, Send, 
  CheckCircle2, Clock, AlertCircle, FileText, BarChart2, Eye
} from 'lucide-react';

interface NewsletterEdition {
  id: string;
  title: string;
  subject: string;
  tier: 'All Subscribers' | 'Paid VIPs' | 'Free Community';
  sent_at: string;
  recipients: number;
  open_rate: string;
  status: 'Delivered' | 'Draft';
  snippet: string;
}

const INITIAL_EDITIONS: NewsletterEdition[] = [
  {
    id: 'issue-1',
    title: 'Issue #14: Production RAG Architectures & Vector Pruning',
    subject: 'Why your embedding retrieval fails under real load (and how to fix it)',
    tier: 'All Subscribers',
    sent_at: '2 days ago',
    recipients: 1240,
    open_rate: '54.2%',
    status: 'Delivered',
    snippet: 'A deep dive into chunking strategies, hybrid BM25 + dense retrieval, and latency reduction in production systems.'
  },
  {
    id: 'issue-2',
    title: 'Issue #13: Setting Consultative Rates as a 10x Engineer',
    subject: 'Moving from hourly billing to value-based advisory retainers',
    tier: 'Paid VIPs',
    sent_at: '9 days ago',
    recipients: 310,
    open_rate: '68.5%',
    status: 'Delivered',
    snippet: 'Frameworks for positioning your expertise, packaging deliverables, and structuring $5k+ monthly retainer contracts.'
  }
];

function NewsletterContent() {
  const { user } = useAuth();
  const [editions, setEditions] = useState<NewsletterEdition[]>(INITIAL_EDITIONS);
  const [isComposing, setIsComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [tier, setTier] = useState<'All Subscribers' | 'Paid VIPs' | 'Free Community'>('All Subscribers');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mindgigs_newsletters');
    if (saved) {
      try {
        setEditions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSending(true);
    setTimeout(() => {
      const newEdition: NewsletterEdition = {
        id: `issue_${Date.now()}`,
        title: title.trim(),
        subject: subject.trim() || title.trim(),
        tier,
        sent_at: 'Just now',
        recipients: tier === 'Paid VIPs' ? 310 : 1280,
        open_rate: 'Sending...',
        status: 'Delivered',
        snippet: content.trim().slice(0, 120) + '...'
      };

      const updated = [newEdition, ...editions];
      setEditions(updated);
      localStorage.setItem('mindgigs_newsletters', JSON.stringify(updated));
      setSuccess(`Newsletter "${title}" broadcasted to ${newEdition.recipients} subscribers!`);
      setTitle('');
      setSubject('');
      setContent('');
      setIsComposing(false);
      setSending(false);
      setTimeout(() => setSuccess(null), 4000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        <main className="p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-purple-500/10 text-purple-600 rounded-2xl border border-purple-200 shadow-2xs">
                <Mail className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase text-purple-600 tracking-wider">SELL / Audience & Editorial</div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Newsletter & Broadcast Studio</h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Monetize your knowledge base through recurring editorial dispatches and targeted subscriber announcements.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/nexus"
                className="px-4 py-2.5 rounded-xl border border-[#00C49F]/40 bg-[#00C49F]/10 hover:bg-[#00C49F]/20 text-[#00C49F] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate with NEXUS</span>
              </Link>
              <button
                onClick={() => setIsComposing(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#00C49F]" />
                <span>Compose Edition</span>
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Audience Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Active Audience</span>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">1,280</div>
              <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+14.2% subscriber growth this month</span>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Average Open Rate</span>
                <BarChart2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">54.2%</div>
              <div className="text-[11px] text-slate-400 font-medium">Industry baseline: 22.4%</div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Newsletter MRR</span>
                <DollarSign className="w-4 h-4 text-[#00C49F]" />
              </div>
              <div className="text-2xl font-black text-[#00C49F]">$2,450.00</div>
              <div className="text-[11px] text-slate-400 font-medium">From 310 Paid VIP Memberships</div>
            </div>
          </div>

          {/* Composer Box (if composing) */}
          {isComposing && (
            <div className="bg-white border-2 border-purple-500/30 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  Compose & Schedule Newsletter Edition
                </h3>
                <button
                  onClick={() => setIsComposing(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Edition Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Issue #15: High-Frequency Strategy Frameworks"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Audience Segment</label>
                    <select
                      value={tier}
                      onChange={(e: any) => setTier(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    >
                      <option value="All Subscribers">All Subscribers (1,280)</option>
                      <option value="Paid VIPs">Paid VIPs Only (310)</option>
                      <option value="Free Community">Free Community (970)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Compelling subject line that drives open rate..."
                    className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Editorial Content (Markdown Supported)</label>
                    <button
                      type="button"
                      onClick={() => setContent(
                        `# The Architecture of High-Leverage Knowledge Work\n\nIn this edition, we examine how top consultants multiply their impact without trading more hours for dollars...\n\n### Key Takeaways:\n1. Decouple delivery from calendar availability.\n2. Leverage AI for initial entity extraction & draft generation.\n3. Protect high-ticket advisory sessions through verified scheduling.`
                      )}
                      className="text-[11px] text-purple-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Insert Sample Outline
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your insights, case studies, or recommendations here..."
                    required
                    className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-[#00C49F]" />
                    )}
                    <span>Broadcast Newsletter Now</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Past Editions Archive */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Published Editions Archive</h3>
                <p className="text-xs text-slate-500">History of dispatched newsletters and live engagement statistics.</p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 border border-purple-500/20">
                {editions.length} Editions Published
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {editions.map((ed) => (
                <div key={ed.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                        {ed.tier}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ed.sent_at}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{ed.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{ed.snippet}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900">{ed.recipients.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Recipients</div>
                    </div>
                    <div className="text-right border-l border-slate-200 pl-4">
                      <div className="font-extrabold text-emerald-600">{ed.open_rate}</div>
                      <div className="text-[10px] text-slate-400">Open Rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function NewsletterPage() {
  return (
    <AuthGuard>
      <NewsletterContent />
    </AuthGuard>
  );
}
