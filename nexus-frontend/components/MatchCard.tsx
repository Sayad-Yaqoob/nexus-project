'use client';

import React from 'react';
import { Trophy, Star, ShieldCheck, Tag, Calendar, ArrowUpRight, CheckCircle } from 'lucide-react';
import { MatchResult } from '@/lib/types';

interface MatchCardProps {
  match: MatchResult;
}

export default function MatchCard({ match }: MatchCardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { label: '#1 Top Match', bg: 'bg-[#00FF88] text-[#0A0A0A]', border: 'border-[#00FF88]' };
    if (rank === 2) return { label: '#2 Match', bg: 'bg-emerald-500/20 text-[#00FF88]', border: 'border-[#00FF88]/40' };
    return { label: '#3 Match', bg: 'bg-[#1A1A1A] text-white', border: 'border-[#2A2A2A]' };
  };

  const badge = getRankBadge(match.rank);

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] hover:border-[#00FF88]/50 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(0,255,136,0.15)] flex flex-col justify-between">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${badge.bg} ${badge.border}`}>
            <Trophy className="w-3.5 h-3.5" />
            {badge.label}
          </span>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30 font-mono font-bold text-xs">
            <Star className="w-3.5 h-3.5 fill-[#00FF88]" />
            {match.match_score}% Match
          </div>
        </div>

        {/* Expert Info */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white">{match.full_name}</h3>
            <ShieldCheck className="w-4 h-4 text-[#00FF88]" />
          </div>
          <p className="text-xs text-[#00FF88] font-medium mb-2">{match.professional_headline}</p>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] bg-[#1A1A1A] text-[#A0A0A0] border border-[#2A2A2A] mb-3">
            {match.category}
          </span>
        </div>

        {/* AI Match Reasoning */}
        <div className="p-3.5 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] mb-4">
          <p className="text-[11px] font-semibold text-[#00FF88] uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            NEXUS Match Reasoning
          </p>
          <p className="text-xs text-[#A0A0A0] leading-relaxed italic">
            "{match.reasoning}"
          </p>
        </div>

        {/* Top Offering Details */}
        {match.top_offering && (
          <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] mb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#A0A0A0] block">Recommended Service</span>
              <p className="text-xs font-bold text-white">{match.top_offering.title}</p>
              <span className="text-[10px] text-[#00FF88]">{match.top_offering.offer_type}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white">${match.top_offering.price}</span>
            </div>
          </div>
        )}
      </div>

      {/* Booking Action CTA */}
      <button
        onClick={() => alert(`Redirecting to MindGigs booking flow for ${match.full_name}...`)}
        className="w-full py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#00FF88] text-white hover:text-[#0A0A0A] font-bold text-xs border border-[#2A2A2A] hover:border-[#00FF88] transition-all flex items-center justify-center gap-2 group"
      >
        Book Expert Session
        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
