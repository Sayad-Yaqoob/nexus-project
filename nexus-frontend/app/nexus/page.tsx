'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/components/layout/AuthContext';
import { sendAgentMessage } from '@/lib/api';
import { AgentMessage } from '@/lib/types';
import { 
  Sparkles, Send, Bot, User as UserIcon, RefreshCw, ChevronRight, CheckCircle2, AlertCircle, ArrowUpRight
} from 'lucide-react';

function NexusWorkspaceContent() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initial welcome message based on user role
  useEffect(() => {
    if (user && messages.length === 0) {
      const isExpert = user.role === 'expert';
      const welcomeText = isExpert
        ? `Hello **${user.full_name}**! I am **NEXUS**, your autonomous AI growth & sales advisor. How can I help optimize your expert profile, build high-converting offerings (1:1 sessions, products, subscriptions), or boost your earnings today?`
        : `Welcome **${user.full_name}**! I am **NEXUS**, your marketplace advisor. Tell me what technical expertise, strategy consultation, or service you are looking for, and I will recommend top verified experts.`;

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggested_actions: isExpert
            ? ['How do I create an offering?', 'Check my earnings', 'Optimize profile bio']
            : ['Find AI & LLM Experts', 'Find Software Architects', 'Find Growth Marketers']
        }
      ]);
    }
  }, [user]);

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
      const resp = await sendAgentMessage(messageText.trim(), sessionId);
      setSessionId(resp.session_id);

      const agentMsg: AgentMessage = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: resp.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: resp.intent,
        suggested_actions: resp.suggested_actions
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      console.error('Agent chat error:', err);
      setError(err.message || 'Error communicating with NEXUS agent');
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
        <header className="h-16 border-b border-[#E2E8F0] bg-white px-8 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00C49F]/10 text-[#00C49F]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                NEXUS Conversational Workspace
              </h1>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Unified Agent Architecture</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-600 font-medium">Session Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                NEXUS is reasoning and retrieving context...
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
                user?.role === 'expert'
                  ? 'Ask NEXUS about creating offerings, updating bio, checking earnings...'
                  : 'Tell NEXUS what technical expertise or strategy advice you need...'
              }
              disabled={loading}
              className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-2xl pl-5 pr-14 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00C49F] focus:bg-white shadow-xs transition-all"
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
      </div>
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
