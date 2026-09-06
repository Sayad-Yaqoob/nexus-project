'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Users, CheckCircle2, Video, Star, Search, Award } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex flex-col font-sans selection:bg-[#00C49F]/20 selection:text-[#00C49F]">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C49F] to-emerald-600 text-white font-black flex items-center justify-center text-2xl shadow-sm">
              m
            </div>
            <div>
              <div className="font-black text-slate-900 text-xl tracking-tight flex items-center gap-2">
                mindGigs
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#00C49F]/10 text-[#00C49F] border border-[#00C49F]/30 uppercase tracking-wide">
                  Verified Experts
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Knowledge & Expertise Marketplace</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="/login?role=client" className="hover:text-[#00C49F] transition-colors">Book an Expert</Link>
            <Link href="/login?role=expert" className="hover:text-[#00C49F] transition-colors">Become an Expert</Link>
            <Link href="#experts" className="hover:text-[#00C49F] transition-colors">How It Works</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all shadow-2xs"
            >
              Log In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-sm transition-all shadow-sm flex items-center gap-2"
            >
              Enter Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden bg-white border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00C49F]/10 border border-[#00C49F]/30 text-[#00C49F] text-xs font-extrabold uppercase tracking-wider">
            <Video className="w-4 h-4" />
            On-Demand Video Consultations & Digital Offerings
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#00C49F] tracking-tight uppercase">
              Stuck On Something?
            </h2>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Book a Brilliant Mind
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed pt-2">
              Book a 1:1 video session with a verified expert who already solved the problem and get answers face to face.
            </p>
          </div>

          {/* Hero Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <Link
              href="/login?role=client"
              className="w-full sm:w-1/2 px-8 py-4 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>Book an Expert</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login?role=expert"
              className="w-full sm:w-1/2 px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 text-[#00C49F]" />
              <span>Become an Expert</span>
            </Link>
          </div>

          {/* Brand Tagline */}
          <div className="pt-8 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-slate-500 italic bg-[#F8F9FA] py-3 px-6 rounded-2xl border border-[#E2E8F0]">
              Helping authors, experts, influencers and publishers monetize their knowledge, expertise, and audience.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-[#E2E8F0] max-w-4xl mx-auto">
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-slate-900">30+</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Verified Domain Experts</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-slate-900">1:1 Video</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Direct Face-to-Face Access</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-slate-900">6 Formats</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Sessions, Books & Subscriptions</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-[#00C49F]">100%</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Guaranteed Verification</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Persona Showcase */}
      <section id="experts" className="py-16 bg-[#F8F9FA] px-6 border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Designed for Clients and Experts</h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto font-medium">
              Get direct answers from verified practitioners or turn your knowledge into recurring income.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Client Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-6 flex flex-col justify-between hover:shadow-md transition-all shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold border border-emerald-500/20 uppercase">
                    Book an Expert
                  </span>
                  <Users className="w-6 h-6 text-[#00C49F]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Solve Problems Face-to-Face</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Browse experts across engineering, AI, marketing, business, and leadership. Ask questions, get customized advice, and book 1:1 sessions.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700 font-medium pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00C49F] shrink-0" />
                    <span>Search verified experts by name, topic, or natural language query</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00C49F] shrink-0" />
                    <span>View full expert profiles, public handles, and transparent pricing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00C49F] shrink-0" />
                    <span>NEXUS assistant available to match experts to your needs</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login?role=client"
                className="w-full py-3.5 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Continue as Client</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Expert Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 space-y-6 flex flex-col justify-between hover:shadow-md transition-all shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase">
                    Become an Expert
                  </span>
                  <Zap className="w-6 h-6 text-slate-900" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Monetize Your Audience & Expertise</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Set up your profile, list 1:1 video sessions, books, subscriptions, and downloadable PDFs. Keep your earnings with zero hassle.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700 font-medium pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                    <span>Full SELL section: Profile, My Offers, Bookings, Earnings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                    <span>NEXUS assistant pre-fills subscription and book forms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                    <span>Dynamic persona switching to test your seller account</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login?role=expert"
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Continue as Expert (Random Persona)</span>
                <ArrowRight className="w-4 h-4 text-[#00C49F]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-[#E2E8F0] bg-white px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">mindGigs</span>
            <span>•</span>
            <span>Knowledge & Expertise Marketplace</span>
          </div>
          <div>© 2026 mindGigs Inc. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
