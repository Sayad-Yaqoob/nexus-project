'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/components/layout/AuthContext';
import { sendAgentMessage, apiUrl, getStoredToken } from '@/lib/api';
import { AgentMessage, ExpertMatch } from '@/lib/types';
import { ResponseRenderer } from '@/components/nexus/ResponseRenderer';
import { ExpertProfileModal } from '@/components/marketplace/ExpertProfileModal';
import { MyOffersView } from '@/components/marketplace/MyOffersView';
import { BookingsView } from '@/components/marketplace/BookingsView';
import { ExpertStudio } from '@/components/nexus/ExpertStudio';
import { ClientMatch } from '@/components/nexus/ClientMatch';
import { 
  Sparkles, Send, Bot, User as UserIcon, RefreshCw, ChevronRight, AlertCircle, Layers, Calendar, Search, Edit3
} from 'lucide-react';

function NexusWorkspaceContent() {
  const { user, getAgentContext } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'canvas' | 'offers' | 'bookings' | 'studio' | 'search'>('canvas');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Perspective state for expert accounts
  const [perspective, setPerspective] = useState<'expert' | 'client'>('expert');
  
  // Profile modal state
  const [selectedExpert, setSelectedExpert] = useState<ExpertMatch | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setPerspective(user.role === 'expert' ? 'expert' : 'client');
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (user && messages.length === 0) {
      const isExpert = perspective === 'expert';
      const welcomeText = isExpert
        ? `Hello **${user.full_name}**! I am **NEXUS**, your autonomous AI growth & sales advisor. How can I help optimize your expert profile, build high-converting offerings (1:1 sessions, products, subscriptions), or check your earnings today?`
        : `Welcome **${user.full_name}**! I am **NEXUS**, your marketplace advisor. Tell me what technical expertise, strategy consultation, or service you are looking for, and I will recommend top verified experts.`;

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggested_actions: isExpert
            ? ['Create a 1:1 session for $500', 'Check my earnings', 'Edit offer price']
            : ['Find marketing expert for author product', 'Find AI & LLM Experts', 'View My Bookings']
        }
      ]);
    }
  }, [user, perspective]);

  useEffect(() => {
    const tabParam = searchParams ? searchParams.get('tab') : null;
    if (tabParam === 'my_offers') setActiveTab('offers');
    else if (tabParam === 'bookings') setActiveTab('bookings');
    else if (tabParam === 'match_search') setActiveTab('search');
  }, [searchParams]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputMessage;
    if (!messageText.trim() || loading) return;

    setError(null);
    const userMsg: AgentMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const context = getAgentContext();
      const resp = await sendAgentMessage(messageText.trim(), context as any, sessionId);
      setSessionId(resp.session_id);

      const agentMsg: AgentMessage = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: resp.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: resp.intent,
        suggested_actions: resp.suggested_actions,
        draft: resp.draft,
        response_type: resp.response_type,
        requires_confirmation: resp.requires_confirmation,
        action_result: resp.action_result,
        response_data: resp.response_data
      };

      setMessages(prev => [...prev, agentMsg]);

      // Automatically switch active workspace tab if agent returned a navigation response
      if (resp.response_type === 'navigation' && resp.response_data?.tab) {
        const tabKey = String(resp.response_data.tab);
        if (tabKey === 'my_offers' || tabKey === 'offers') setActiveTab('offers');
        else if (tabKey === 'bookings') setActiveTab('bookings');
        else if (tabKey === 'match_search' || tabKey === 'search') setActiveTab('search');
      }
    } catch (err: any) {
      console.error('Agent chat error:', err);
      setError(err.message || 'Error communicating with NEXUS agent');
    } finally {
      setLoading(false);
    }
  };


  const handleBookOffering = async (expertUserId: number | string, offeringId?: number | string) => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await fetch(apiUrl('/bookings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          expert_user_id: Number(expertUserId),
          offering_id: offeringId ? Number(offeringId) : undefined,
          notes: 'Demo consultation booking'
        })
      });

      if (!res.ok) throw new Error('Failed to create booking');
      const data = await res.json();
      
      const bookingMsg: AgentMessage = {
        id: `booking_${Date.now()}`,
        role: 'assistant',
        content: `✨ Booking confirmed with expert! Both Client and Expert records have been updated in the database.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response_type: 'booking',
        response_data: { bookings: [data.booking] },
        suggested_actions: ['View My Bookings', 'Find More Experts']
      };

      setMessages(prev => [...prev, bookingMsg]);
    } catch (err: any) {
      setError(err.message || 'Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    setSessionId(undefined);
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1E293B] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header Bar */}
        <header className="h-16 border-b border-[#E2E8F0] bg-white px-8 flex items-center justify-between shadow-xs shrink-0 z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#00C49F]/10 text-[#00C49F]">
                <Sparkles className="w-5 h-5" />
              </div>

              <div>
                <h1 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                  NEXUS Workspace
                </h1>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>SQLite Verified</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600 font-medium">Session Active</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('canvas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'canvas' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Agent Canvas
              </button>
              <button
                onClick={() => setActiveTab('offers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'offers' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#00C49F]" /> My Offers
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'bookings' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#00C49F]" /> Bookings
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'search' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-[#00C49F]" /> Match Search
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Perspective Toggle for Expert Users */}
            {user?.role === 'expert' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Perspective:</span>
                <button
                  onClick={() => setPerspective('expert')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                    perspective === 'expert' ? 'bg-[#112233] text-[#00C49F] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Expert
                </button>
                <button
                  onClick={() => setPerspective('client')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                    perspective === 'client' ? 'bg-[#112233] text-[#00C49F] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Client
                </button>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <span className="font-medium text-slate-700">{user.full_name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  user.role === 'expert'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {user.role}
                </span>
              </div>
            )}

            <button
              onClick={handleNewSession}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Session
            </button>
          </div>
        </header>

        {/* Tab Views */}
        {activeTab === 'offers' && (
          <div className="flex-1 overflow-y-auto p-6">
            <MyOffersView />
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="flex-1 overflow-y-auto p-6">
            <BookingsView />
          </div>
        )}

        {activeTab === 'studio' && (
          <div className="flex-1 overflow-y-auto p-6">
            <ExpertStudio />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-6">
            <ClientMatch />
          </div>
        )}

        {activeTab === 'canvas' && (
          <>
            {/* Conversation Canvas */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-[#00C49F] text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#112233] text-white rounded-tr-none shadow-sm'
                          : 'bg-white border border-[#E2E8F0] text-slate-800 rounded-tl-none shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === 'assistant' && (
                        <ResponseRenderer
                          message={msg}
                          onConfirm={() => handleSendMessage('Confirm')}
                          onCancel={() => handleSendMessage('Cancel')}
                          onViewProfile={(match) => setSelectedExpert(match)}
                          onBookSession={(expertUserId, offeringId) => handleBookOffering(expertUserId, offeringId)}
                        />
                      )}

                      <div
                        className={`mt-3 text-[10px] font-medium flex items-center justify-between ${
                          msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {msg.intent && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] uppercase border border-slate-200">
                            {msg.intent}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Suggested Action Chips */}
                    {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.suggested_actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(action)}
                            disabled={loading}
                            className="px-3.5 py-1.5 bg-white hover:bg-[#00C49F]/10 border border-[#E2E8F0] hover:border-[#00C49F] text-slate-700 hover:text-[#00C49F] rounded-full text-xs font-medium transition-all shadow-2xs flex items-center gap-1.5 group"
                          >
                            <span>{action}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00C49F]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs mt-1">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-8 h-8 rounded-xl bg-[#00C49F] text-slate-950 flex items-center justify-center font-bold text-sm shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="px-5 py-3.5 bg-white border border-[#E2E8F0] rounded-2xl text-xs text-slate-500 shadow-xs flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00C49F] animate-ping" />
                    NEXUS is reasoning and querying database...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </main>

            {/* Input Controls */}
            <footer className="p-6 border-t border-[#E2E8F0] bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="max-w-4xl mx-auto relative flex items-center"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    perspective === 'expert'
                      ? 'e.g. Create a 1:1 session for $500 marketing strategy, Change my marketing session to $600, Check my earnings...'
                      : 'e.g. I need an expert for our marketing team to help us launch the new product related to authors...'
                  }
                  disabled={loading}
                  className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-2xl pl-5 pr-14 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00C49F] focus:bg-white shadow-xs transition-all font-medium"
                />

                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="absolute right-2.5 p-3 rounded-xl bg-[#00C49F] text-slate-950 hover:bg-[#00B08E] disabled:bg-slate-200 disabled:text-slate-400 font-bold transition-all shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </footer>
          </>
        )}
      </div>

      {/* Expert Profile Modal */}
      {selectedExpert && (
        <ExpertProfileModal
          expert={selectedExpert}
          onClose={() => setSelectedExpert(null)}
          onBookOffering={(expertUserId, offeringId) => handleBookOffering(expertUserId, offeringId)}
        />
      )}
    </div>
  );
}

export default function NexusPage() {
  return (
    <AuthGuard>
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-[#00C49F]">
            Loading NEXUS Workspace...
          </div>
        }
      >
        <NexusWorkspaceContent />
      </React.Suspense>
    </AuthGuard>
  );
}
