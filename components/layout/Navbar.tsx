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
    <header className="sticky top-0 z-40 w-full border-b border-[#0000001a] bg-[#f9f9f9]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#0000001a] bg-white text-[#0d0d0d]">
            <span className="text-xs font-semibold">CM</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-sm font-semibold tracking-tight text-[#0d0d0d]">CallMissed</span>
            <span className="text-xs font-normal text-[#5d5d5d] hidden sm:inline">AI Workspace</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center space-x-1 rounded-[10px] bg-[#0000000d] p-0.5">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center space-x-1.5 rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-white text-[#0d0d0d] shadow-none border border-[#0000001a]'
                : 'text-[#5d5d5d] hover:text-[#0d0d0d] hover:bg-[#0000000d]'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onTabChange('image')}
            className={`flex items-center space-x-1.5 rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'image'
                ? 'bg-white text-[#0d0d0d] shadow-none border border-[#0000001a]'
                : 'text-[#5d5d5d] hover:text-[#0d0d0d] hover:bg-[#0000000d]'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Image Studio</span>
            <span className="sm:hidden">Image</span>
          </button>

          <button
            onClick={() => onTabChange('voice')}
            className={`flex items-center space-x-1.5 rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'voice'
                ? 'bg-white text-[#0d0d0d] shadow-none border border-[#0000001a]'
                : 'text-[#5d5d5d] hover:text-[#0d0d0d] hover:bg-[#0000000d]'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice Agent</span>
            <span className="sm:hidden">Voice</span>
          </button>
        </nav>

        {/* Status / Links */}
        <div className="flex items-center space-x-3">
          {isConfigured !== null && (
            <div
              className={`hidden md:flex items-center space-x-1.5 rounded-[10px] px-2.5 py-1 text-xs font-normal border border-[#0000001a] bg-white ${
                isConfigured ? 'text-[#0d0d0d]' : 'text-[#5d5d5d]'
              }`}
            >
              {isConfigured ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#0d0d0d]" />
                  <span>API Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-[#8f8f8f]" />
                  <span>Key Required</span>
                </>
              )}
            </div>
          )}

          <a
            href="https://docs.callmissed.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-[#5d5d5d] hover:text-[#0d0d0d] p-1.5 transition-colors"
          >
            <span className="hidden sm:inline">Docs</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
