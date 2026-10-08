'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, ActiveTab } from '@/components/layout/Navbar';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatPage() {
  const router = useRouter();
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setIsConfigured(data.configured))
      .catch(() => setIsConfigured(false));
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'chat') return;
    if (tab === 'image') router.push('/image');
    if (tab === 'voice') router.push('/voice');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar activeTab="chat" onTabChange={handleTabChange} isConfigured={isConfigured} />
      <main className="flex-1">
        <ChatInterface />
      </main>
    </div>
  );
}
