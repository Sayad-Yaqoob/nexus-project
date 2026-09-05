'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Search, CheckCircle2, ArrowRight, Filter } from 'lucide-react';

const CATEGORIES = [
  'All',
  'AI & Data',
  'Software Development',
  'Business & Strategy',
  'Marketing & Growth',
  'Sales',
  'Finance & Investing',
  'Operations & Supply Chain',
  'Coaching & Leadership',
  'Science & Environment',
  'Personal Development'
];

const MOCK_EXPLORE_EXPERTS = [
  {
    id: 1,
    name: 'Dr. Sophia Chen',
    handle: 'sophiachen_ai',
    headline: 'Principal AI Researcher & Large Language Model Specialist',
    category: 'AI & Data',
    tags: ['LLMs', 'RAG', 'PyTorch', 'Python'],
    is_verified: true,
    price_range: '$250 - $1200'
  },
  {
    id: 2,
    name: 'Marcus Vance',
    handle: 'marcus_data',
    headline: 'Senior Data Infrastructure Lead & Snowflake Architect',
    category: 'AI & Data',
    tags: ['Snowflake', 'Databricks', 'dbt', 'SQL'],
    is_verified: true,
    price_range: '$200 - $800'
  },
  {
    id: 3,
    name: 'Alexandre Dubois',
    handle: 'alex_fullstack',
    headline: 'Staff Full Stack Engineer (Next.js, Node.js, Python)',
    category: 'Software Development',
    tags: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
    is_verified: true,
    price_range: '$200 - $1000'
  },
  {
    id: 4,
    name: 'David Sterling',
    handle: 'david_venture',
    headline: 'Former Tech Founder & Venture Capital Advisor',
    category: 'Business & Strategy',
    tags: ['Fundraising', 'Venture Capital', 'Pitch Decks', 'SaaS Strategy'],
    is_verified: true,
    price_range: '$350 - $2000'
  },
  {
    id: 5,
    name: 'Chloe Bennett',
    handle: 'chloe_growth',
    headline: 'Growth Marketing Director & Paid Acquisition Expert',
    category: 'Marketing & Growth',
    tags: ['Growth Marketing', 'Paid Ads', 'Google Ads', 'CRO'],
    is_verified: true,
    price_range: '$175 - $800'
  },
  {
    id: 6,
    name: 'Victoria Thorne',
    handle: 'victoria_cfo',
    headline: 'Fractional CFO for High-Growth Tech & SaaS Companies',
    category: 'Finance & Investing',
    tags: ['Fractional CFO', 'Financial Modeling', 'SaaS Metrics'],
    is_verified: true,
    price_range: '$300 - $1600'
  }
];

function ExploreExpertsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredExperts = MOCK_EXPLORE_EXPERTS.filter(e => {
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesQuery = !searchQuery || 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />

        <main className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center max-w-2xl mx-auto space-y-3 pt-4">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Explore Experts
            </h1>
            <p className="text-slate-600 text-sm">
              Book 1:1 sessions, join communities, and learn from the best Experts
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, expertise, or topic..."
              className="w-full bg-white border border-[#CBD5E1] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00C49F] shadow-xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#00C49F] text-slate-950 shadow-xs'
                    : 'bg-white border border-[#CBD5E1] text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Expert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map(exp => (
              <div key={exp.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs hover:border-[#00C49F]/50 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center shrink-0">
                      {exp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                        <span>{exp.name}</span>
                        {exp.is_verified && <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">@{exp.handle}</span>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-700 leading-relaxed line-clamp-2">
                    {exp.headline}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-200">
                      {exp.category}
                    </span>
                    {exp.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{exp.price_range}</span>
                  <Link
                    href={`/nexus?tab=check_profile&handle=${exp.handle}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Check Profile</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#00C49F]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ExploreExpertsPage() {
  return (
    <AuthGuard>
      <ExploreExpertsContent />
    </AuthGuard>
  );
}
