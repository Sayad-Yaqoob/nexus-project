'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { OfferingDraft } from '@/lib/types';

interface OfferingDraftCardProps {
  draft: OfferingDraft;
  canPublish: boolean;
  onPublish: () => void;
}

export const OfferingDraftCard: React.FC<OfferingDraftCardProps> = ({ draft, canPublish, onPublish }) => (
  <div className="rounded-2xl border border-[#00C49F]/30 bg-[#00C49F]/5 p-4 text-sm">
    <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
      <CheckCircle2 className="h-4 w-4 text-[#00C49F]" />
      Offering draft
    </div>
    <div className="grid gap-2 text-slate-700">
      <div><span className="font-medium">Type:</span> {draft.offer_type}</div>
      {draft.title && <div><span className="font-medium">Title:</span> {draft.title}</div>}
      {draft.price !== undefined && <div><span className="font-medium">Price:</span> {draft.price} {draft.currency || 'USD'}</div>}
      {draft.duration && <div><span className="font-medium">Duration:</span> {draft.duration}</div>}
      {draft.availability?.days.length ? (
        <div>
          <span className="font-medium">Availability:</span> {draft.availability.days.join(' & ')}
          {draft.availability.start && draft.availability.end ? `, ${draft.availability.start}–${draft.availability.end}` : ''}
        </div>
      ) : null}
    </div>
    {canPublish && (
      <button
        type="button"
        onClick={onPublish}
        className="mt-4 rounded-xl bg-[#00C49F] px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-[#00B08E]"
      >
        Publish
      </button>
    )}
  </div>
);
