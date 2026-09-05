'use client';

import React from 'react';
import { X, CheckCircle2, Star, Clock, Globe, ShieldCheck, Calendar, DollarSign } from 'lucide-react';
import { ExpertMatch } from '@/lib/types';

interface ExpertProfileModalProps {
  expert: ExpertMatch | null;
  onClose: () => void;
  onBookOffering: (expertUserId: number | string, offeringId?: number | string, offeringTitle?: string, price?: number) => void;
}

export const ExpertProfileModal: React.FC<ExpertProfileModalProps> = ({
  expert,
  onClose,
  onBookOffering
}) => {
  if (!expert) return null;

  const topOffering = expert.top_offering;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00C49F] to-[#0284C7] text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            {expert.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{expert.full_name}</h2>
              {expert.is_verified && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              )}
            </div>
            <p className="text-xs text-[#00A887] font-semibold mt-0.5">{expert.headline}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>@{expert.handle}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">{expert.category}</span>
            </div>
          </div>
        </div>

        {/* Match Rationale */}
        <div className="p-4 rounded-xl bg-[#00C49F]/10 border border-[#00C49F]/30 text-xs text-slate-800 space-y-1">
          <div className="font-bold text-[#00A887] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-[#00C49F] text-[#00C49F]" /> Grounded Match Explanation ({expert.match_score}% Match)
          </div>
          <p className="leading-relaxed text-slate-700 font-medium">"{expert.reasoning}"</p>
        </div>

        {/* Expertise Tags */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Expertise Skills & Technologies</span>
          <div className="flex flex-wrap gap-1.5">
            {expert.tags.map((tag, idx) => (
              <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Availability Schedule */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#00C49F]" /> Weekly Hours & Timezone
            </span>
            <span className="text-xs text-slate-500 font-mono">Asia/Karachi (PKT)</span>
          </div>
          <div className="text-xs text-slate-600 grid grid-cols-2 gap-2">
            <div><span className="font-medium text-slate-900">Mon – Fri:</span> 09:00 – 17:00</div>
            <div><span className="font-medium text-slate-900">Sat – Sun:</span> Unavailable</div>
          </div>
        </div>

        {/* Active Offerings */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase block">Active Offerings</span>
          {topOffering ? (
            <div className="p-4 rounded-xl border border-[#00C49F]/30 bg-[#00C49F]/5 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-slate-900 text-sm">{topOffering.title}</div>
                <div className="text-xs text-slate-600 mt-0.5">{topOffering.offer_type || '1:1 Session'} • {topOffering.duration || '60 min'}</div>
                <div className="text-sm font-extrabold text-[#00A887] mt-1">${topOffering.price} USD</div>
              </div>

              <button
                onClick={() => {
                  onBookOffering(expert.user_id, topOffering.id, topOffering.title, topOffering.price);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs shadow-xs transition-all shrink-0 flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4" /> Book Session
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-slate-200 text-xs text-slate-500">
              Consulting session available upon request.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
