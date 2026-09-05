'use client';

import React, { useState } from 'react';
import { Sparkles, Search, CheckCircle2, Zap, Star, HelpCircle } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
}

interface MatchItem {
  id: string | number;
  user_id: string | number;
  full_name: string;
  handle: string;
  headline: string;
  category: string;
  tags: string[];
  match_score: number;
  reasoning: string;
  is_verified?: boolean;
  top_offering?: {
    id: any;
    title: string;
    type: string;
    price: number;
    duration?: string;
  };
}

export const ClientMatch: React.FC = () => {
  const [rawProblem, setRawProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [needsClarification, setNeedsClarification] = useState(false);
  const [searched, setSearched] = useState(false);

  const defaultFilterPills = [
    "AI & LLM Fine-Tuning",
    "Full-Stack Web App",
    "AWS Cloud Architecture",
    "Pitch Deck & VC Fundraising",
    "Growth & Paid Ads",
    "Cybersecurity Audit"
  ];

  const handlePillClick = (pill: string) => {
    const updated = rawProblem.includes(pill) ? rawProblem : (rawProblem ? `${rawProblem} specifically targeting ${pill}` : `I need an expert for ${pill}`);
    setRawProblem(updated);
    // Re-trigger search automatically upon selecting clarification pill
    executeFindExperts(updated);
  };

  const executeFindExperts = async (queryText: string) => {
    if (!queryText.trim()) {
      setError('Please describe your project requirement or challenge.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res: any = await fetch(apiUrl('/client/find-experts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_problem: queryText })
      }).then((r) => r.json());

      if (res && res.matches) {
        setMatches(res.matches);
        setNeedsClarification(res.needs_clarification || false);
        setClarificationQuestions(res.clarification_questions || []);
        setSearched(true);
      } else {
        throw new Error('Failed to search expert matches');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to search experts right now.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#00C49F]/10 text-[#00C49F] border border-[#00C49F]/30">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1E293B] tracking-wide">NEXUS Client Match</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              FAISS vector search + Groq LLM ranking with interactive clarification loop.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Query Input Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-xs">
        <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
          Describe your project requirement or problem
        </label>
        <textarea
          rows={4}
          value={rawProblem}
          onChange={(e) => setRawProblem(e.target.value)}
          placeholder="e.g. We are building an enterprise AI platform and need an expert to help optimize vector retrieval and RAG architecture..."
          className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl p-4 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#00C49F] transition-colors leading-relaxed"
        />

        {/* Interactive Ambiguity Clarification Loop Pills */}
        {needsClarification && clarificationQuestions.length > 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              NEXUS Clarification Assistant: Select your specific focus to refine matches
            </div>
            {clarificationQuestions.map((cq) => (
              <div key={cq.id} className="space-y-2">
                <span className="text-[11px] text-amber-800 font-semibold">{cq.question}</span>
                <div className="flex flex-wrap gap-2">
                  {cq.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handlePillClick(opt)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white text-[#1E293B] border border-amber-300 hover:border-[#00C49F] hover:bg-[#00C49F] hover:text-white font-semibold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3 text-[#00C49F]" />
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] uppercase block mb-2">
              Quick Filter Shortcuts:
            </span>
            <div className="flex flex-wrap gap-2">
              {defaultFilterPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePillClick(pill)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] hover:border-[#00C49F] hover:text-[#00C49F] font-medium transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3 text-[#00C49F]" />
                  {pill}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={() => executeFindExperts(rawProblem)}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-[#00C49F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#059669] shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Searching Vector Store...' : 'Find Experts'}
          </button>
        </div>
      </div>

      {/* Match Results Grid */}
      {searched && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00C49F]" />
              Expert Matches Found
            </h3>
            <span className="text-xs text-[#64748B]">
              Ranked by FAISS vector similarity & Groq reasoning
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[720px] overflow-y-auto pr-1">
            {matches.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] hover:border-[#00C49F] rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Match Score Badge (MindGigs Spec: bg #D1FAE5, text #065F46, border #10B981) */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-[#D1FAE5] text-[#065F46] border border-[#10B981]">
                  <Star className="w-3.5 h-3.5 fill-[#10B981]" />
                  <span className="text-xs font-black">{item.match_score}% Match</span>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4 pr-24">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00C49F] to-[#0284C7] text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                      {item.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1E293B] text-base leading-snug">{item.full_name}</h4>
                      <span className="text-[11px] text-[#00C49F] font-semibold">{item.category}</span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-[#1E293B] mb-3 leading-snug">
                    {item.headline}
                  </p>

                  <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] text-xs text-[#475569] mb-4 leading-relaxed">
                    <span className="text-[10px] font-bold text-[#00C49F] uppercase block mb-1">
                      NEXUS Match Rationale:
                    </span>
                    "{item.reasoning}"
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.tags.slice(0, 4).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Session Rate</span>
                    <span className="text-sm font-bold text-[#1E293B]">
                      {item.top_offering?.price !== undefined
                        ? `${item.top_offering.price} ${item.top_offering.type || ''}`
                        : 'Offering details unavailable'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
