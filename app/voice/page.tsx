'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, ActiveTab } from '@/components/layout/Navbar';
import { VoiceAgent } from '@/components/voice/VoiceAgent';

export default function VoicePage() {
  const router = useRouter();
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setIsConfigured(data.configured))
      .catch(() => setIsConfigured(false));
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'voice') return;
    if (tab === 'chat') router.push('/chat');
    if (tab === 'image') router.push('/image');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar activeTab="voice" onTabChange={handleTabChange} isConfigured={isConfigured} />
      <main className="flex-1">
        <VoiceAgent />
      </main>
    </div>
  );
}
