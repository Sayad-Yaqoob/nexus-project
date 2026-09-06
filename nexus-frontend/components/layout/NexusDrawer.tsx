'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { sendAgentMessage } from '@/lib/api';
import { AgentMessage, OfferingDraft, ExpertMatch } from '@/lib/types';
import FileUploader from '../FileUploader';
import { 
  Sparkles, X, Send, Bot, User as UserIcon, RefreshCw, ChevronRight, AlertCircle, CheckCircle2, Edit3, ShieldCheck, Tag, DollarSign, Mic, MicOff
} from 'lucide-react';

interface NexusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NexusDrawer: React.FC<NexusDrawerProps> = ({ isOpen, onClose }) => {
  const { user, perspective, getAgentContext } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechPrefixRef = useRef('');

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      return;
    }

    const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Apple Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      // Capture a single dictated message; this control does not start a
      // conversational voice session.
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';
      speechPrefixRef.current = inputMessage.trim();

      recognition.onstart = () => {
        setError(null);
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
          .trim();
        if (transcript.trim()) {
          setInputMessage([speechPrefixRef.current, transcript].filter(Boolean).join(' '));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please enable microphone access in your browser settings.');
        } else if (event.error !== 'no-speech') {
          setError(`Speech recognition notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setError('Could not access microphone for speech recognition.');
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      try { recognitionRef.current?.abort(); } catch (e) {}
    }
  }, [isOpen]);

  useEffect(() => () => {
    try { recognitionRef.current?.abort(); } catch (e) {}
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && user) {
      const isExpertPerspective = perspective === 'expert';
      const welcomeText = isExpertPerspective
        ? `Hello ${user.full_name}! I am NEXUS, your intelligent operating assistant for MindGigs. Tell me what you'd like to do (e.g. create a subscription, publish a book, edit profile, view incoming bookings, check earnings).`
        : `Welcome ${user.full_name}! I am NEXUS, your MindGigs assistant. Ask me to find verified experts, view your bookings, or navigate anywhere on the platform.`;

      const welcomeMessage: AgentMessage = {
          id: 'welcome',
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggested_actions: isExpertPerspective
            ? ['Create a 1:1 Consultation Session for $300 (60 min)', 'Draft a Weekly Subscriber Newsletter Broadcast', 'Publish a Book or Digital PDF Product', 'Check My Verified Earnings & Payout Status']
            : ['Find an AI & Machine Learning Expert for My Project', 'Search Growth & Marketing Strategists for Launch', 'View My Scheduled Bookings & Sessions', 'Explore Verified Experts Across All Categories']
      };

      setMessages(current =>
        current.length === 0 || (current.length === 1 && current[0].id === 'welcome')
          ? [welcomeMessage]
          : current
      );
    }
  }, [isOpen, user, perspective]);

  if (!isOpen) return null;

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
        response_data: resp.response_data,
        navigation: resp.navigation
      };

      setMessages(prev => [...prev, agentMsg]);

      // Execute deterministic navigation if instruction is returned
      if (resp.navigation && resp.navigation.route) {
        console.log('Deterministic NEXUS Navigation executing to:', resp.navigation.route);
        router.push(resp.navigation.route);
      }
    } catch (err: any) {
      console.error('NEXUS Drawer chat error:', err);
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
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-[#0B1320] border-l border-[#1E293B] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#1E293B] bg-[#070D18] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00C49F] text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span>NEXUS Operating System</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Context: {pathname} ({perspective})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleNewSession}
              title="Reset session"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#00C49F] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[90%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#112233] text-white rounded-tr-none border border-slate-700'
                      : 'bg-[#112233]/70 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Interactive Action Preview Form Card */}
                  {Boolean(msg.draft) && msg.draft && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-[#00C49F]/40 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-extrabold uppercase text-[#00C49F] tracking-wider flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Form Preview ({msg.draft.offer_type || msg.draft.category || 'Application'})
                        </span>
                        {msg.draft.price ? (
                          <span className="text-xs font-black text-white">${msg.draft.price} USD</span>
                        ) : null}
                      </div>

                      <div className="space-y-2 text-[11px]">
                        {msg.draft.professional_headline ? (
                          <>
                            <div>
                              <label className="text-[10px] text-slate-400 font-medium">Professional Headline</label>
                              <input
                                type="text"
                                defaultValue={msg.draft.professional_headline || ''}
                                readOnly
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 font-medium">Category</label>
                                <input
                                  type="text"
                                  defaultValue={String(msg.draft.category || 'Consulting')}
                                  readOnly
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 font-medium">Expertise Tags</label>
                                <input
                                  type="text"
                                  defaultValue={String(msg.draft.expertise_tags || '')}
                                  readOnly
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-medium">Bio Summary</label>
                              <textarea
                                defaultValue={msg.draft.bio || ''}
                                readOnly
                                rows={2}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="text-[10px] text-slate-400 font-medium">Title</label>
                              <input
                                type="text"
                                defaultValue={msg.draft.title || ''}
                                readOnly
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 font-medium">Type</label>
                                <input
                                  type="text"
                                  defaultValue={String(msg.draft.offer_type || 'Offering')}
                                  readOnly
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-medium">Price ($ USD)</label>
                                <input
                                  type="text"
                                  defaultValue={String(msg.draft.price !== undefined && msg.draft.price !== null ? msg.draft.price : 'N/A')}
                                  readOnly
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                                />
                              </div>
                            </div>

                            {/* 1:1 Session specifics */}
                            {msg.draft.offer_type === '1:1 Session' && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <label className="text-[10px] text-slate-400 font-medium">Session Duration</label>
                                  <input
                                    type="text"
                                    defaultValue={String(msg.draft.duration || '60 min')}
                                    readOnly
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 font-medium">Available Hours</label>
                                  <input
                                    type="text"
                                    defaultValue={msg.draft.availability ? `${msg.draft.availability.start || '09:00 AM'} - ${msg.draft.availability.end || '05:00 PM'}` : '09:00 AM - 05:00 PM'}
                                    readOnly
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[#00C49F] font-mono text-[10px]"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Newsletter specifics */}
                            {msg.draft.offer_type === 'Newsletter' && (
                              <div className="pt-1 space-y-1.5">
                                <div>
                                  <label className="text-[10px] text-slate-400 font-medium">Target Audience</label>
                                  <input
                                    type="text"
                                    defaultValue={String(msg.draft.target_audience || 'Subscribers')}
                                    readOnly
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-purple-300"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Custom Offer specifics */}
                            {msg.draft.offer_type === 'Custom Offer' && (
                              <div className="pt-1 space-y-1.5">
                                <div>
                                  <label className="text-[10px] text-slate-400 font-medium">Timeline</label>
                                  <input
                                    type="text"
                                    defaultValue={String(msg.draft.delivery_timeline || '3-5 business days')}
                                    readOnly
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-blue-300"
                                  />
                                </div>
                              </div>
                            )}

                            {/* File Upload Control for Book / Digital Product */}
                            {(msg.draft.offer_type === 'Book' || msg.draft.offer_type === 'Digital Product' || msg.draft.file_required) && (
                              <div className="pt-1">
                                <FileUploader
                                  offerType={msg.draft.offer_type || 'Book'}
                                  onFileUploaded={(path, filename) => {
                                    console.log("File attached to task:", path);
                                  }}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Confirmation Buttons */}
                      {Boolean(msg.requires_confirmation) && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => handleSendMessage('confirm')}
                            disabled={loading}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-[#00C49F] hover:bg-[#00B08E] text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & Activate
                          </button>
                          <button
                            onClick={() => handleSendMessage('cancel')}
                            disabled={loading}
                            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grounded Search Match Cards */}
                  {Boolean(msg.response_data && msg.response_data.matches) && (
                    <div className="mt-3 space-y-2">
                      {(msg.response_data!.matches as ExpertMatch[]).map((match, mIdx) => (
                        <div key={mIdx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{match.full_name}</span>
                            <span className="px-2 py-0.5 rounded bg-[#00C49F]/10 text-[#00C49F] font-mono text-[10px] font-bold">
                              {match.match_score}% Match
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{match.headline}</p>
                          <p className="text-[10px] text-slate-400 italic line-clamp-2">{match.reasoning}</p>
                          {match.top_offering && (
                            <div className="mt-1 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-medium">{match.top_offering.title}</span>
                              <span className="text-emerald-400 font-bold">${match.top_offering.price}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 text-[9px] text-slate-400 flex items-center justify-between">
                    <span>{msg.timestamp}</span>
                    {msg.intent && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {msg.intent}
                      </span>
                    )}
                  </div>
                </div>

                {/* Suggested Action Chips */}
                {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggested_actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(act)}
                        disabled={loading}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-[#00C49F]/20 text-slate-300 hover:text-[#00C49F] border border-slate-800 hover:border-[#00C49F]/50 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 group"
                      >
                        <span>{act}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-[#00C49F]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-[#00C49F] text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Bot className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="px-3.5 py-2 bg-[#112233] border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00C49F] animate-ping" />
                NEXUS reasoning over application context...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#1E293B] bg-[#070D18] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center"
          >
            {isListening && (
              <div className="absolute -top-9 left-2 px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-md animate-bounce z-10 border border-red-400">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Listening... Speak now</span>
              </div>
            )}

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? 'Listening to voice...' : 'Ask NEXUS to perform an action or navigate...'}
              disabled={loading}
              className={`w-full bg-[#112233] border rounded-xl pl-3.5 pr-18 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none ${
                isListening ? 'border-red-500 ring-1 ring-red-400' : 'border-slate-700/80 focus:border-[#00C49F]'
              }`}
            />

            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                title={isListening ? 'Stop listening' : 'Speak to NEXUS'}
                className={`p-1.5 rounded-lg transition-all font-bold ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-1.5 rounded-lg bg-[#00C49F] text-slate-950 hover:bg-[#00B08E] disabled:opacity-40 transition-all font-bold"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
