'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, X, ArrowRight, UserCheck, Search } from 'lucide-react';

export const FloatingBubble: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Position state (persisted in localStorage)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -1, y: -1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Don't display floating bubble on the /nexus full page workspace or /login
  if (pathname === '/nexus' || pathname === '/login') {
    return null;
  }

  useEffect(() => {
    // Load saved position from localStorage
    const saved = localStorage.getItem('nexus_bubble_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPos(parsed);
        return;
      } catch (e) {}
    }
    // Default position: bottom-right (24px offset)
    setPos({
      x: window.innerWidth - 70,
      y: window.innerHeight - 70
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    dragStartRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };

    const handleMouseMove = (me: MouseEvent) => {
      isDraggingRef.current = true;
      const newX = Math.max(10, Math.min(window.innerWidth - 65, me.clientX - dragStartRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 65, me.clientY - dragStartRef.current.y));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setPos((current) => {
        localStorage.setItem('nexus_bubble_pos', JSON.stringify(current));
        return current;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = () => {
    if (!isDraggingRef.current) {
      setIsOpen(!isOpen);
    }
  };

  const navigateToMode = (mode: 'studio' | 'match') => {
    setIsOpen(false);
    router.push(`/nexus?mode=${mode}`);
  };

  return (
    <>
      {/* Draggable Floating Button */}
      {pos.x >= 0 && (
        <div
          ref={bubbleRef}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
          className="fixed z-50 cursor-grab active:cursor-grabbing select-none group"
        >
          <div className="w-14 h-14 rounded-full bg-[#0B1320] border-2 border-[#00C49F] text-[#00C49F] flex items-center justify-center shadow-[0_0_20px_rgba(0,196,159,0.4)] hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0B1320] text-[#00C49F] text-[10px] font-bold px-2 py-0.5 rounded border border-[#00C49F]/40 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            NEXUS AI
          </span>
        </div>
      )}

      {/* Slide-out Panel overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-80 bg-[#0B1320] border-l border-[#1E293B] h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00C49F]" />
                  <h2 className="font-bold text-white text-base">NEXUS Assistant</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#112233]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
                NEXUS personal AI workspace for MindGigs. Choose a workspace mode to launch:
              </p>

              {/* Quick Navigation Cards */}
              <div className="space-y-3">
                <button
                  onClick={() => navigateToMode('studio')}
                  className="w-full text-left p-4 rounded-xl bg-[#112233] border border-[#1E293B] hover:border-[#00C49F] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#00C49F]" />
                      Expert Studio
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#00C49F] group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    Create, refine, and publish AI-structured expert profiles & offerings.
                  </p>
                </button>

                <button
                  onClick={() => navigateToMode('match')}
                  className="w-full text-left p-4 rounded-xl bg-[#112233] border border-[#1E293B] hover:border-[#00C49F] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#00C49F]" />
                      Client Match
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#00C49F] group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    Describe your project to get top 3 ranked expert matches & reasoning.
                  </p>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#1E293B] pt-4 text-center">
              <span className="text-[10px] text-[#64748B]">
                Draggable button • Position auto-saved
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
