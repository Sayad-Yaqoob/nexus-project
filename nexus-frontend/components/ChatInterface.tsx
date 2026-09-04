'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, RefreshCw, HelpCircle, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import PreviewCard from './PreviewCard';
import MatchCard from './MatchCard';
import { PreviewCard as PreviewCardType, Top3Matches } from '@/lib/types';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  preview?: PreviewCardType;
  matches?: Top3Matches;
  questions?: string[];
  sessionId?: number;
}

interface ChatInterfaceProps {
  mode: 'expert' | 'client';
  placeholder?: string;
  initialMessage?: string;
}

export default function ChatInterface({ mode, placeholder, initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome initial message
    const welcomeText = mode === 'expert'
      ? "Hello! I am NEXUS, your MindGigs onboarding assistant. Tell me about your background, skills, experience, or services in natural language — I'll construct a high-converting profile & catalog for you!"
      : "Welcome to MindGigs NEXUS matching agent! Describe your project, technical challenge, or business goal — I will analyze your requirements and connect you with top-ranked experts.";
      
    setMessages([{
      id: 'welcome',
      sender: 'agent',
      text: initialMessage || welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, [mode, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      if (mode === 'expert') {
        const res = await api.describeExpert(textToSend, 1);

        if (res.status === 'need_clarification') {
          const agentMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: "I reviewed your description! To create an extraordinary profile, I need just a few more details:",
            questions: res.questions,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, agentMsg]);
        } else if (res.status === 'preview_ready' && res.preview) {
          const agentMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: "I've structured your profile and service offerings! Please review your preview card below:",
            preview: res.preview,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, agentMsg]);
        }
      } else {
        // Client Mode
        let res;
        if (activeSessionId) {
          res = await api.answerClientQuestion(activeSessionId, textToSend);
        } else {
          res = await api.describeClientProblem(textToSend);
          if (res.session_id) setActiveSessionId(res.session_id);
        }

        if (res.status === 'need_clarification') {
          const agentMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: "To find the perfect expert match, please clarify:",
            questions: res.questions,
            sessionId: res.session_id,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, agentMsg]);
        } else if (res.status === 'completed' && res.matches) {
          const agentMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            text: `I've analyzed your requirements and retrieved the top 3 verified experts for your project:`,
            matches: res.matches,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, agentMsg]);
        }
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `Sorry, an error occurred: ${err.message || 'Server execution error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
      {/* Agent Status Bar */}
      <div className="bg-[#141414] border-b border-[#2A2A2A] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00FF88] to-[#00CC6A] flex items-center justify-center shadow-[0_0_12px_rgba(0,255,136,0.5)]">
              <Bot className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00FF88] border-2 border-[#141414] rounded-full animate-ping" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              NEXUS Agentic Engine
              <Sparkles className="w-3.5 h-3.5 text-[#00FF88]" />
            </h3>
            <p className="text-[11px] text-[#A0A0A0]">
              {mode === 'expert' ? 'Expert Profile Extraction & Optimization' : 'LangGraph Semantic Matching & Ranking'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([]);
            setActiveSessionId(null);
          }}
          className="p-2 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-[#1A1A1A] transition-colors"
          title="Reset Conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'agent' && (
              <div className="w-8 h-8 rounded-lg bg-[#00FF88]/20 border border-[#00FF88]/40 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-[#00FF88]" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Text Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#00FF88] text-[#0A0A0A] font-medium rounded-tr-none shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                    : 'bg-[#141414] text-white border border-[#2A2A2A] rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Clarification Questions Cards */}
              {msg.questions && msg.questions.length > 0 && (
                <div className="space-y-2 mt-2">
                  {msg.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      onClick={() => handleSend(q)}
                      className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#00FF88]/50 text-xs text-[#00FF88] cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[#00FF88] shrink-0" />
                        <span>{q}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}

              {/* Embedded Expert Preview Card */}
              {msg.preview && (
                <div className="mt-4">
                  <PreviewCard preview={msg.preview} />
                </div>
              )}

              {/* Embedded Match Cards Grid */}
              {msg.matches && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {msg.matches.matches.map((match, mIdx) => (
                    <MatchCard key={mIdx} match={match} />
                  ))}
                </div>
              )}

              <span className="text-[10px] text-[#A0A0A0] block px-1">{msg.timestamp}</span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-[#A0A0A0]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-[#A0A0A0] bg-[#141414] p-4 rounded-xl border border-[#2A2A2A] max-w-sm">
            <Loader2 className="w-4 h-4 animate-spin text-[#00FF88]" />
            <span>NEXUS LLM Agent is reasoning and extracting...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#141414] border-t border-[#2A2A2A]">
        {/* Quick Suggestion Chips */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
          {mode === 'expert' ? (
            <>
              <button
                onClick={() => setInput("I'm an AI Engineer with 6 years building LLM agents, RAG systems with LangChain, Python, and PyTorch. Offering 1:1 sessions at $200/hr and a RAG architecture boilerplate ZIP for $99.")}
                className="px-3 py-1 rounded-full text-[11px] bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-white border border-[#2A2A2A] whitespace-nowrap transition-colors"
              >
                💡 Try AI Engineer profile
              </button>
              <button
                onClick={() => setInput("I am a Fintech & Crypto Strategy Advisor. I help startups navigate DeFi compliance, tokenomics, and VC fundraising. Offering advisory sessions at $350.")}
                className="px-3 py-1 rounded-full text-[11px] bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-white border border-[#2A2A2A] whitespace-nowrap transition-colors"
              >
                💡 Try Fintech Advisor profile
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setInput("I need an AWS Cloud Architect to audit our Kubernetes Terraform setup, fix security vulnerabilities, and cut monthly cloud spending.")}
                className="px-3 py-1 rounded-full text-[11px] bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-white border border-[#2A2A2A] whitespace-nowrap transition-colors"
              >
                🔍 Search Cloud Architect
              </button>
              <button
                onClick={() => setInput("Looking for a Growth Marketing Specialist to design B2B SaaS cold email campaigns and scale LinkedIn ads to $50k MRR.")}
                className="px-3 py-1 rounded-full text-[11px] bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-white border border-[#2A2A2A] whitespace-nowrap transition-colors"
              >
                🔍 Search Growth Marketing
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 bg-[#0A0A0A] p-2 rounded-xl border border-[#2A2A2A] focus-within:border-[#00FF88]/60 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || (mode === 'expert' ? 'Describe your expertise, experience, and services...' : 'Describe your project or requirement...')}
            className="flex-1 bg-transparent text-xs text-white placeholder-[#A0A0A0] resize-none outline-none max-h-24 min-h-[40px] py-2 px-2"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-lg bg-[#00FF88] hover:bg-[#00CC6A] text-[#0A0A0A] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all disabled:opacity-40 disabled:hover:bg-[#00FF88]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
