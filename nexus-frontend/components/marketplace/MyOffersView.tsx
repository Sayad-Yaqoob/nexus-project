'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, Trash2, CheckCircle2, Clock, FileText, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { apiUrl, getStoredToken } from '@/lib/api';
import { OfferingDraft } from '@/lib/types';

export const MyOffersView: React.FC = () => {
  const [offerings, setOfferings] = useState<OfferingDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [title, setTitle] = useState('');
  const [offerType, setOfferType] = useState('1:1 Session');
  const [price, setPrice] = useState<number>(150);
  const [duration, setDuration] = useState('60 min');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchOfferings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await fetch(apiUrl('/offerings'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOfferings(data);
      } else {
        throw new Error('Failed to fetch offerings');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching offerings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setOfferType('1:1 Session');
    setPrice(150);
    setDuration('60 min');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (off: OfferingDraft) => {
    setEditingId(off.id || null);
    setTitle(off.title || '');
    setOfferType(off.offer_type || '1:1 Session');
    setPrice(off.price || 150);
    setDuration(off.duration || '60 min');
    setDescription(off.description || '');
    setShowModal(true);
  };

  const handleSaveOffering = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = getStoredToken();
      if (editingId) {
        const res = await fetch(apiUrl(`/offerings/${editingId}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title, offer_type: offerType, price, duration, description })
        });
        if (!res.ok) throw new Error('Failed to update offering');
        setSuccessMsg(`Offering '${title}' updated successfully!`);
      } else {
        const res = await fetch(apiUrl('/expert/publish-offering'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            offer_type: offerType,
            price,
            duration,
            description,
            file_required: offerType === 'Digital Product' || offerType === 'Book'
          })
        });
        if (!res.ok) throw new Error('Failed to create offering');
        setSuccessMsg(`Offering '${title}' created successfully!`);
      }
      setShowModal(false);
      fetchOfferings();
    } catch (err: any) {
      setError(err.message || 'Error saving offering');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffering = async (id: number | string) => {
    if (!confirm('Are you sure you want to delete this offering?')) return;
    try {
      const token = getStoredToken();
      const res = await fetch(apiUrl(`/offerings/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg('Offering deleted successfully.');
        fetchOfferings();
      }
    } catch (err: any) {
      setError('Failed to delete offering');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00C49F]" /> My Offers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your verified consulting 1:1 sessions, digital products, and subscriptions stored in SQLite.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOfferings}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" /> + Create Offer
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Offerings List Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading active offerings from database...</div>
      ) : offerings.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="font-bold text-slate-800 text-sm">No Active Offerings Yet</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't published any offerings. Use the button above or tell NEXUS in natural language: "Create a 1:1 session for $500".
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-[#00C49F] text-slate-950 text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Create Your First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offerings.map((off) => (
            <div
              key={String(off.id)}
              className="bg-white border border-[#E2E8F0] hover:border-[#00C49F] rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#00C49F]/10 text-[#00A887] border border-[#00C49F]/30">
                    {off.offer_type}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Listing
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">{off.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{off.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Price</span>
                  <span className="text-lg font-extrabold text-[#00A887]">${off.price} USD</span>
                  {off.duration && <span className="text-xs text-slate-500 ml-2">({off.duration})</span>}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(off)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => off.id && handleDeleteOffering(off.id)}
                    className="p-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit Offering */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-200 pb-3">
              {editingId ? 'Edit Offering' : 'Create New Offering'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Marketing Strategy Session"
                  className="w-full bg-[#F8F9FA] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Offer Type</label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
                  >
                    <option value="1:1 Session">1:1 Session</option>
                    <option value="Digital Product">Digital Product</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Book">Book</option>
                    <option value="Custom Offer">Custom Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F8F9FA] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 60 min"
                  className="w-full bg-[#F8F9FA] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed session goals and deliverables..."
                  className="w-full bg-[#F8F9FA] border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOffering}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#00C49F] text-slate-950 text-xs font-bold shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Offering'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
