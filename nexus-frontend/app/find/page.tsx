'use client';

import ChatInterface from '@/components/ChatInterface';

export default function FindPage() {
  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Find Your Ideal Expert</h1>
          <p className="text-xs text-[#A0A0A0]">Describe your project or requirement in plain text — NEXUS matches & ranks the top 3 verified experts.</p>
        </div>
      </div>

      <ChatInterface
        mode="client"
        placeholder="Describe the challenge or project you need help with..."
      />
    </div>
  );
}
