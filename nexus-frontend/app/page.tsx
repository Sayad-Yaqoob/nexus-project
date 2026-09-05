'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Bot, Users, DollarSign, BookOpen, Calendar, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col font-sans selection:bg-[#00C49F]/30 selection:text-[#00C49F]">
      {/* Top Header */}
      <header className="w-full border-b border-slate-800/80 bg-[#0B1320]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C49F] to-emerald-600 text-slate-950 font-black flex items-center justify-center text-2xl shadow-lg shadow-[#00C49F]/20">
              m
            </div>
            <div>
              <div className="font-extrabold text-white text-xl tracking-tight flex items-center gap-2">
                mindGigs
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00C49F]/10 text-[#00C49F] border border-[#00C49F]/30 uppercase">
                  powered by NEXUS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Expertise Marketplace & Intelligent Layer</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <Link href="#features" className="hover:text-[#00C49F] transition-colors">Marketplace</Link>
            <Link href="#nexus-ai" className="hover:text-[#00C49F] transition-colors">NEXUS AI</Link>
            <Link href="#personas" className="hover:text-[#00C49F] transition-colors">Demo Personas</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 text-white font-semibold text-sm transition-all shadow-xs"
            >
              Log In
            </Link>
            <Link
              href="/nexus"
              className="px-5 py-2.5 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-sm transition-all shadow-md shadow-[#00C49F]/20 flex items-center gap-2"
            >
              Enter Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#00C49F]/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00C49F]/10 border border-[#00C49F]/30 text-[#00C49F] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse" />
            mindGigs, powered by NEXUS
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            The Intelligent Marketplace for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C49F] via-emerald-400 to-teal-200">
              On-Demand Expertise
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Discover top-tier AI researchers, data architects, and growth consultants. Powered by <strong className="text-white">NEXUS</strong>, an intelligent layer that resolves intent, indexes profiles with FAISS vector search, and automates session creation.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?role=client"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-base shadow-xl shadow-[#00C49F]/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Explore Marketplace as Client</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login?role=expert"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#112233] hover:bg-[#1A334D] text-slate-200 font-bold text-base border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 text-[#00C49F]" />
              <span>Monetize Expertise as Expert</span>
            </Link>
          </div>

          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-800/80 max-w-4xl mx-auto">
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-white">30+</div>
              <div className="text-xs text-slate-400 mt-1">Verified Seeded Experts</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-white">384-dim</div>
              <div className="text-xs text-slate-400 mt-1">FAISS Vector Indexing</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-white">6</div>
              <div className="text-xs text-slate-400 mt-1">Distinct Offering Types</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-black text-[#00C49F]">100%</div>
              <div className="text-xs text-slate-400 mt-1">Verified DB Persistence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Persona Cards */}
      <section id="personas" className="py-20 bg-[#0B1320] border-y border-slate-800/80 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Two Distinct Product Personas</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Experience mindGigs from both perspectives. Experts retain all Client capabilities while unlocking the SELL management suite.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Client Persona Card */}
            <div className="bg-[#111C2E] border border-slate-700/70 rounded-2xl p-8 space-y-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 uppercase">
                    Client Persona
                  </span>
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Discover & Book Specialists</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Search marketplace experts with natural language or semantic filters. Inspect grounded rationale, review profiles, and book 1:1 sessions.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-medium pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Access BUY section: Find Experts, My Bookings, My Purchases</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>FAISS semantic search with grounded recommendation scores</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Protected: Cannot access expert earnings or offering creation</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login?role=client"
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Continue as Client</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Expert Persona Card */}
            <div className="bg-[#111C2E] border border-slate-700/70 rounded-2xl p-8 space-y-6 flex flex-col justify-between hover:border-purple-500/50 transition-all shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/30 uppercase">
                    Expert Persona
                  </span>
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Build & Manage Revenue</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  An Expert is a client who unlocked expert onboarding. Retains all BUY capabilities and gains SELL management tools and NEXUS creation actions.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-medium pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Access SELL section: Profile, My Offers, Bookings, Earnings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Natural language offering creation (1:1 Sessions, Books, Products)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Real SQLite database write, read-back & verification</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login?role=expert"
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Continue as Expert (Dr. Sophia Chen)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-800/80 bg-[#070D18] px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">mindGigs</span>
            <span>•</span>
            <span>powered by NEXUS</span>
          </div>
          <div>© 2026 mindGigs Inc. All rights reserved. Real SQLite Database Operations.</div>
        </div>
      </footer>
    </div>
  );
}
