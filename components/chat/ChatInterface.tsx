'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Trash2,
  Settings2,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { SUPPORTED_CHAT_MODELS } from '@/lib/callmissed/chat';
import { ChatMessage } from '@/types/callmissed';

const STARTER_PROMPTS = [
  'Explain quantum computing in simple terms for high schoolers.',
  'Write a TypeScript function to debounce an async API call.',
  'Translate "Welcome to our store, how may I help you?" into Hindi and Tamil.',
  'What are the advantages of WebRTC over WebSockets for voice agents?',
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('sarvam-105b');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful, precise, and polite AI assistant.');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend !== undefined ? textToSend : input).trim();
    if (!promptText || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      role: 'user',
      content: promptText,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare payload with system prompt if provided
      const apiMessages = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || `Request failed with status ${res.status}`);
      }

      const assistantReply =
        data?.choices?.[0]?.message?.content || 'No response content returned.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantReply,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-zinc-950 text-zinc-100">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-3 sm:px-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {SUPPORTED_CHAT_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
              showSettings
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Configure System Prompt"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">System Prompt</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-400 hover:border-red-900/50 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* System Prompt Collapsible Panel */}
      {showSettings && (
        <div className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 sm:px-6">
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            System Instructions (Persona & Guidelines):
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="E.g. You are a senior software engineer explaining concepts concisely..."
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl text-center py-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-100">
              CallMissed AI Chat
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Fast, multi-lingual AI conversation powered by CallMissed. Select a model and start a conversation.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 text-xs sm:text-sm text-zinc-300 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all text-left flex items-start space-x-2"
                >
                  <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="absolute top-2 right-2 rounded-lg bg-zinc-800/80 p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                        title="Copy message"
                      >
                        {copiedIndex === index ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
                  <div className="flex items-center space-x-1.5">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"></div>
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <div className="flex-1">
                  <p className="font-medium text-red-200">Unable to generate reply</p>
                  <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="flex items-center space-x-1 rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/30 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-center rounded-2xl border border-zinc-700 bg-zinc-950 p-1.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 shadow-lg">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Press Enter to send, Shift+Enter for new line)"
              rows={1}
              className="w-full resize-none bg-transparent px-3 py-2 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 outline-none max-h-32"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 px-1">
            <span>Powered by CallMissed OpenAI-compatible Chat API</span>
            <span>Model: {selectedModel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
