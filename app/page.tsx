'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from '@/components/layout/Navbar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ImageGenerator } from '@/components/image/ImageGenerator';
import { VoiceAgent } from '@/components/voice/VoiceAgent';
import { AlertTriangle } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(data.configured);
      })
      .catch(() => {
        setIsConfigured(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isConfigured={isConfigured}
      />

      {/* Missing Key Setup Notice Banner */}
      {isConfigured === false && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between text-xs sm:text-sm text-amber-300">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong className="font-semibold text-amber-200">Configuration notice: </strong>
                Please ensure <code className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-amber-200">CALLMISSED_API_KEY=cm_...</code> is set in your <code className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-amber-200">.env.local</code> file to run real calls against CallMissed.
              </span>
            </div>
            <span className="hidden md:inline text-xs text-amber-400/80">Server-Side Only Security</span>
          </div>
        </div>
      )}

      {/* Main Experience Tab View */}
      <main className="flex-1">
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'image' && <ImageGenerator />}
        {activeTab === 'voice' && <VoiceAgent />}
      </main>
    </div>
  );
}
