'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Tag, DollarSign, Package, Calendar, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { PreviewCard as PreviewCardType } from '@/lib/types';
import FileUploader from './FileUploader';
import { api } from '@/lib/api';

interface PreviewCardProps {
  preview: PreviewCardType;
  onApproved?: () => void;
}

export default function PreviewCard({ preview, onApproved }: PreviewCardProps) {
  const [approving, setApproving] = useState(false);
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const [filePaths, setFilePaths] = useState<Record<number, string>>({});

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.approveDraft(preview.draft_id);
      setApprovedSuccess(true);
      if (onApproved) onApproved();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="w-full bg-[#141414] border border-[#00FF88]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,255,136,0.1)] transition-all">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00FF88]/20 flex items-center justify-center border border-[#00FF88]/40">
            <Sparkles className="w-4 h-4 text-[#00FF88]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Profile Preview</h3>
            <p className="text-[11px] text-[#A0A0A0]">Review generated profile before publishing to MindGigs</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Expert
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#1A1A1A] text-white border border-[#2A2A2A]">
            {preview.category}
          </span>
        </div>
      </div>

      {/* Main Profile Info */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">{preview.full_name}</h2>
        <p className="text-sm text-[#00FF88] font-medium mb-3">{preview.professional_headline}</p>
        <div className="text-xs text-[#A0A0A0] leading-relaxed whitespace-pre-line bg-[#0A0A0A] p-4 rounded-xl border border-[#2A2A2A]">
          {preview.bio}
        </div>
      </div>

      {/* Expertise Tags */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-[#00FF88]" />
          Core Expertise
        </h4>
        <div className="flex flex-wrap gap-2">
          {preview.expertise_tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-[#1A1A1A] text-white border border-[#2A2A2A] hover:border-[#00FF88]/40 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Offerings Grid */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-3 flex items-center gap-1">
          <Package className="w-3.5 h-3.5 text-[#00FF88]" />
          Suggested Service Offerings ({preview.offerings.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {preview.offerings.map((offering, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-[#00FF88] border border-[#2A2A2A]">
                    {offering.offer_type}
                  </span>
                  <span className="text-sm font-bold text-white flex items-center">
                    ${offering.price}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-white mb-1">{offering.title}</h5>
                <p className="text-xs text-[#A0A0A0] mb-2">{offering.description || 'Custom tailored consulting session.'}</p>
              </div>

              {/* File Uploader integration if required */}
              {(offering.offer_type === 'Digital Product' || offering.offer_type === 'Book') && (
                <FileUploader
                  offerType={offering.offer_type}
                  onFileUploaded={(path) => setFilePaths(prev => ({ ...prev, [idx]: path }))}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      {approvedSuccess ? (
        <div className="p-4 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/50 text-center">
          <div className="flex items-center justify-center gap-2 text-[#00FF88] font-bold text-sm mb-1">
            <CheckCircle2 className="w-5 h-5" />
            Profile & Offerings Live on MindGigs!
          </div>
          <p className="text-xs text-[#A0A0A0]">Clients can now discover and book your services via NEXUS AI.</p>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
          <p className="text-xs text-[#A0A0A0]">Everything look good?</p>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00FF88] hover:bg-[#00CC6A] text-[#0A0A0A] font-bold text-xs shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {approving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing Profile...
              </>
            ) : (
              <>
                Approve & Publish Profile
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
