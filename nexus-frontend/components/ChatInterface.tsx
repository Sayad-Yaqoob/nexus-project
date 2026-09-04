'use client';

import React, { useState } from 'react';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  mode: 'expert' | 'client';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: mode === 'expert'
        ? "Welcome to NEXUS! Tell me about your skills and experience to build your expert profile."
        : "Welcome to NEXUS! Describe your project or challenge to find top expert matches.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp = await api.sendAgentMessage(userText);
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: resp.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'agent' && (
              <div className="w-7 h-7 rounded-lg bg-[#00C49F] text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div className={`p-3.5 rounded-xl text-xs max-w-md ${
              m.sender === 'user' ? 'bg-[#112233] text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              {m.text}
            </div>
            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#00C49F]"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-[#00C49F] text-slate-950 font-bold text-xs hover:bg-[#00B08E] disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
