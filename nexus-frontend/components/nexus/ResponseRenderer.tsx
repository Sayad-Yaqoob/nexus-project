'use client';

import React, { useState } from 'react';
import { AgentMessage, ExpertMatch, OfferingDraft, ResponseType } from '@/lib/types';
import { Star, ShieldCheck, Clock, CheckCircle2, DollarSign, Calendar, TrendingUp, AlertCircle, Edit2, Send } from 'lucide-react';

interface ResponseRendererProps {
  message: AgentMessage;
  onConfirm?: () => void;
  onCancel?: () => void;
  onViewProfile?: (match: ExpertMatch) => void;
  onBookSession?: (expertUserId: number | string, offeringId?: number | string) => void;
}

function ActionCard({ message, onConfirm, onCancel }: ResponseRendererProps) {
  const draft = message.draft;
  if (!draft) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(draft.title || '');
  const [price, setPrice] = useState(draft.price || 0);
  const [duration, setDuration] = useState(draft.duration || '60 min');
  const [description, setDescription] = useState(draft.description || '');

  return (
    <div className="rounded-2xl border border-[#00C49F]/40 bg-[#00C49F]/5 p-5 text-sm space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#00C49F]/20 pb-3">
        <div className="font-bold text-slate-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C49F] animate-pulse" />
          Review Action — {draft.offer_type || '1:1 Session'}
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs text-[#00A887] hover:text-[#00C49F] font-semibold flex items-center gap-1"
        >
          <Edit2 className="w-3.5 h-3.5" />
          {isEditing ? 'Done Editing' : 'Edit Details'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Price ($ USD)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
            />
          </div>
        </div>
      ) : (
        <dl className="grid gap-2 text-slate-700 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <dt className="font-semibold text-slate-600">Title:</dt>
            <dd className="font-bold text-slate-900">{title || draft.title || 'Untitled Session'}</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <dt className="font-semibold text-slate-600">Type:</dt>
            <dd className="font-medium text-slate-800">{draft.offer_type}</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <dt className="font-semibold text-slate-600">Price:</dt>
            <dd className="font-extrabold text-[#00A887]">${price || draft.price} USD</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <dt className="font-semibold text-slate-600">Duration:</dt>
            <dd className="font-medium text-slate-800">{duration || draft.duration || '60 min'}</dd>
          </div>
          <div className="py-1">
            <dt className="font-semibold text-slate-600 mb-0.5">Description:</dt>
            <dd className="text-slate-800 leading-relaxed">{description || draft.description || 'Consulting session'}</dd>
          </div>
        </dl>
      )}

      {message.requires_confirmation && (
        <div className="mt-4 flex items-center justify-end gap-3 pt-2 border-t border-[#00C49F]/20">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[#00C49F] hover:bg-[#00B08E] px-5 py-2 text-xs font-black text-slate-950 shadow-xs transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Confirm & Publish
          </button>
        </div>
      )}
    </div>
  );
}

function SearchResults({ data, onViewProfile, onBookSession }: {
  data?: Record<string, unknown>;
  onViewProfile?: (match: ExpertMatch) => void;
  onBookSession?: (expertUserId: number | string, offeringId?: number | string) => void;
}) {
  const matches = Array.isArray(data?.matches) ? (data.matches as ExpertMatch[]) : [];
  if (matches.length === 0) {
    return <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">No matching experts found in database.</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00C49F]" /> Verified Expert Matches ({matches.length})
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Ranked by FAISS vector similarity</span>
      </div>

      <div className="grid gap-4">
        {matches.map((match) => (
          <div key={String(match.id)} className="rounded-xl border border-slate-200 hover:border-[#00C49F] p-4 bg-white transition-all space-y-3 group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00C49F] to-[#0284C7] text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {match.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm leading-snug">{match.full_name}</div>
                  <div className="text-xs text-[#00A887] font-semibold">{match.headline}</div>
                  <div className="text-[11px] text-slate-500">{match.category}</div>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1 shrink-0">
                <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" /> {match.match_score}%
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
              <span className="text-[10px] font-bold text-[#00C49F] uppercase block">Grounded Reason:</span>
              "{match.reasoning}"
            </div>

            {match.top_offering && (
              <div className="flex items-center justify-between text-xs text-slate-800 pt-1 border-t border-slate-100">
                <div>
                  <span className="font-semibold text-slate-900">{match.top_offering.title}</span>
                  <span className="text-[#00A887] font-extrabold ml-2">${match.top_offering.price} USD</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              {onViewProfile && (
                <button
                  type="button"
                  onClick={() => onViewProfile(match)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold transition-all"
                >
                  View Profile
                </button>
              )}
              {onBookSession && (
                <button
                  type="button"
                  onClick={() => onBookSession(match.user_id, match.top_offering?.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 text-xs font-bold transition-all"
                >
                  Book Session
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingCard({ data }: { data?: Record<string, unknown> }) {
  const bookings = Array.isArray(data?.bookings) ? data.bookings : [data];
  if (!bookings || bookings.length === 0 || !bookings[0]) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
      <div className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-3">
        <Calendar className="w-4 h-4 text-[#00C49F]" /> Verified Booking Record
      </div>

      <div className="space-y-3">
        {bookings.map((b: any, idx: number) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{b.offering_title || 'Consulting Session'}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase border border-emerald-300">
                {b.status || 'Confirmed'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div><span className="font-medium text-slate-900">Client:</span> {b.client_name}</div>
              <div><span className="font-medium text-slate-900">Expert:</span> {b.expert_name}</div>
              <div><span className="font-medium text-slate-900">Price:</span> ${b.price || b.amount} USD</div>
              <div><span className="font-medium text-slate-900">Scheduled:</span> {b.scheduled_at}</div>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {b.payment_status || 'Demo / Simulated'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EarningsCard({ data }: { data?: Record<string, unknown> }) {
  if (!data) return null;
  const gross = Number(data.total_gross_revenue || 0);
  const net = Number(data.expert_net_earnings || 0);
  const fee = Number(data.platform_fee_split || 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
      <div className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-3">
        <TrendingUp className="w-4 h-4 text-[#00C49F]" /> Verified Earnings Breakdown
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Total Sales</div>
          <div className="text-lg font-extrabold text-slate-900 mt-1">${gross.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="text-[10px] font-bold text-emerald-700 uppercase">Expert Net (70%)</div>
          <div className="text-lg font-extrabold text-emerald-800 mt-1">${net.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Platform Fee (30%)</div>
          <div className="text-lg font-extrabold text-slate-700 mt-1">${fee.toFixed(2)}</div>
        </div>
      </div>

      <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
        <span>Payout Threshold: $50.00 USD</span>
        <span className="font-bold text-emerald-700">{String(data.payout_status || 'Eligible')}</span>
      </div>
    </div>
  );
}

export function ResponseRenderer({ message, onConfirm, onCancel, onViewProfile, onBookSession }: ResponseRendererProps) {
  const type = message.response_type as ResponseType | undefined;
  if (type === 'action_preview') return <ActionCard message={message} onConfirm={onConfirm} onCancel={onCancel} />;

  if (type === 'search_results') return <SearchResults data={message.response_data} onViewProfile={onViewProfile} onBookSession={onBookSession} />;
  if (type === 'booking') return <BookingCard data={message.response_data} />;
  if (type === 'earnings') return <EarningsCard data={message.response_data} />;
  if (type === 'navigation') return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-center justify-between font-medium">
      <span>Navigated to: <strong className="capitalize font-bold">{String(message.response_data?.tab || 'Workspace')}</strong></span>
      <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-800 text-[10px] font-bold uppercase">Active Tab</span>
    </div>
  );
  if (type === 'action_success') return <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{message.content}</div>;
  if (type === 'error') return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message.content}</div>;
  return null;
}

