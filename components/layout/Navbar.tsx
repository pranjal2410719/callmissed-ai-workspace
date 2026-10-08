'use client';

import React from 'react';
import { Bot, Image as ImageIcon, Mic, Sparkles, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export type ActiveTab = 'chat' | 'image' | 'voice';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isConfigured: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, isConfigured }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white sm:text-lg">CallMissed</span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                AI Studio
              </span>
            </div>
            <p className="hidden text-xs text-zinc-400 sm:block">
              Unified Chat • Image • Real-Time Voice
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center space-x-1 rounded-xl bg-zinc-900/90 p-1 border border-zinc-800">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onTabChange('image')}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'image'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Image Studio</span>
            <span className="sm:hidden">Image</span>
          </button>

          <button
            onClick={() => onTabChange('voice')}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all relative ${
              activeTab === 'voice'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice Agent</span>
            <span className="sm:hidden">Voice</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </button>
        </nav>

        {/* Status / Links */}
        <div className="flex items-center space-x-3">
          {isConfigured !== null && (
            <div
              className={`hidden md:flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                isConfigured
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
              }`}
              title={isConfigured ? 'API Key configured on server' : 'CALLMISSED_API_KEY is not set'}
            >
              {isConfigured ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>CallMissed API Ready</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                  <span>API Key Not Set</span>
                </>
              )}
            </div>
          )}

          <a
            href="https://docs.callmissed.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors p-2"
          >
            <span className="hidden sm:inline">Docs</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
