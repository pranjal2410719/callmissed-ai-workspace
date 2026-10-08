'use client';

import React from 'react';
import { Bot, Image as ImageIcon, Mic, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

export type ActiveTab = 'chat' | 'image' | 'voice';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isConfigured: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, isConfigured }) => {
  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e8e8ea',
        height: '56px',
      }}
    >
      <div
        className="mx-auto flex h-full items-center justify-between px-5 sm:px-8"
        style={{ maxWidth: '1200px' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span
            style={{
              fontFamily: "'Labil-Bold', 'Inter', ui-sans-serif, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '-0.01em',
              color: '#000000',
            }}
          >
            CallMissed
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#6b6b6b',
              letterSpacing: '-0.01em',
            }}
            className="hidden sm:inline"
          >
            AI Studio
          </span>
        </div>

        {/* Tab Navigation */}
        <nav
          className="flex items-center gap-1"
          style={{
            background: '#f8f6f2',
            borderRadius: '9999px',
            padding: '4px',
          }}
        >
          {(
            [
              { id: 'chat', label: 'Chat', shortLabel: 'Chat', Icon: Bot },
              { id: 'image', label: 'Image Studio', shortLabel: 'Image', Icon: ImageIcon },
              { id: 'voice', label: 'Voice Agent', shortLabel: 'Voice', Icon: Mic },
            ] as const
          ).map(({ id, label, shortLabel, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  letterSpacing: '-0.01em',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#000000' : '#6b6b6b',
                  background: active ? '#ffffff' : 'transparent',
                  boxShadow: active ? 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon style={{ width: '14px', height: '14px' }} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Status / Links */}
        <div className="flex items-center gap-3">
          {isConfigured !== null && (
            <div
              className="hidden md:flex items-center gap-1.5"
              style={{
                background: '#f8f6f2',
                border: '1px solid #c4c4c4',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '12px',
                letterSpacing: '-0.01em',
                color: isConfigured ? '#000000' : '#6b6b6b',
              }}
            >
              {isConfigured ? (
                <>
                  <CheckCircle2 style={{ width: '12px', height: '12px', color: '#57ad6a' }} />
                  <span>API Ready</span>
                </>
              ) : (
                <>
                  <AlertCircle style={{ width: '12px', height: '12px', color: '#6b6b6b' }} />
                  <span>Key Required</span>
                </>
              )}
            </div>
          )}

          <a
            href="https://docs.callmissed.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
            style={{
              fontSize: '13px',
              letterSpacing: '-0.01em',
              color: '#6b6b6b',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#000000')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#6b6b6b')}
          >
            <span className="hidden sm:inline">Docs</span>
            <ExternalLink style={{ width: '13px', height: '13px' }} />
          </a>
        </div>
      </div>
    </header>
  );
};
