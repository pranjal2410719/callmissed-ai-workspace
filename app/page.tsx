'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from '@/components/layout/Navbar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ImageGenerator } from '@/components/image/ImageGenerator';
import { VoiceAgent } from '@/components/voice/VoiceAgent';
import { AlertCircle } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setIsConfigured(data.configured))
      .catch(() => setIsConfigured(false));
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#000000',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Labil Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif",
        letterSpacing: '-0.01em',
      }}
    >
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} isConfigured={isConfigured} />

      {/* API key notice */}
      {isConfigured === false && (
        <div
          style={{
            background: '#fffbe7',
            borderBottom: '1px solid #c4c4c4',
            padding: '10px 24px',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              letterSpacing: '-0.01em',
              color: '#000000',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle style={{ width: '15px', height: '15px', color: '#ff5c3c', flexShrink: 0 }} />
              <span>
                <strong style={{ fontWeight: 700 }}>Configuration notice: </strong>
                Set{' '}
                <code
                  style={{
                    borderRadius: '5px',
                    background: '#f8f6f2',
                    border: '1px solid #c4c4c4',
                    padding: '1px 6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                >
                  CALLMISSED_API_KEY=cm_...
                </code>{' '}
                in your{' '}
                <code
                  style={{
                    borderRadius: '5px',
                    background: '#f8f6f2',
                    border: '1px solid #c4c4c4',
                    padding: '1px 6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                >
                  .env.local
                </code>{' '}
                file to enable real CallMissed API calls.
              </span>
            </div>
            <span
              className="hidden md:inline"
              style={{ fontSize: '11px', letterSpacing: '0.143em', textTransform: 'uppercase', color: '#6b6b6b', flexShrink: 0 }}
            >
              Server-Side Only
            </span>
          </div>
        </div>
      )}

      <main style={{ flex: 1 }}>
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'image' && <ImageGenerator />}
        {activeTab === 'voice' && <VoiceAgent />}
      </main>
    </div>
  );
}
