'use client';

import ChatInterface from '@/components/ChatInterface';

export default function OnboardPage() {
  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Expert AI Onboarding</h1>
          <p className="text-xs text-[#A0A0A0]">Describe your skills, bio, or services — NEXUS will draft & publish your profile.</p>
        </div>
      </div>

      <ChatInterface
        mode="expert"
        placeholder="Describe your background, skills, hourly rate, or digital products..."
      />
    </div>
  );
}
