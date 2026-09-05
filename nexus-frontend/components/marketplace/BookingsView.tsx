'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, RefreshCw, AlertCircle, Clock, UserCheck, ShieldCheck } from 'lucide-react';
import { apiUrl, getStoredToken } from '@/lib/api';

export const BookingsView: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await fetch(apiUrl('/bookings'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        throw new Error('Failed to load bookings');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00C49F]" /> Verified Bookings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real database booking records shared between Client (My Bookings) and Expert (Incoming Bookings).
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading bookings from database...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="font-bold text-slate-800 text-sm">No Active Bookings</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No session bookings found. Create a demo booking through the NEXUS Agent Canvas or Client Match.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E2E8F0] hover:border-[#00C49F] rounded-2xl p-5 shadow-xs transition-all space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">{b.offering_title || 'Consulting Session'}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase border border-emerald-300">
                    {b.status || 'Confirmed'}
                  </span>
                </div>

                <div className="text-xs font-extrabold text-[#00A887]">
                  ${b.price || b.amount} USD
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Client</span>
                  <span className="font-semibold text-slate-800">{b.client_name}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Expert</span>
                  <span className="font-semibold text-slate-800">{b.expert_name}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled Time</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#00C49F]" /> {b.scheduled_at}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono">Booking ID: #{b.id}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Payment Status: {b.payment_status || 'Demo / Simulated'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
