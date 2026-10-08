'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Trash2,
  Sliders,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
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
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-white text-[#0d0d0d]">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between border-b border-[#0000001a] bg-[#f9f9f9] px-4 py-2.5 sm:px-6">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-[#5d5d5d]">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-[10px] border border-[#0000001a] bg-white px-2.5 py-1 text-xs sm:text-sm font-medium text-[#0d0d0d] outline-none hover:bg-[#0000000d] focus:border-[#0d0d0d]"
          >
            {SUPPORTED_CHAT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center space-x-1.5 rounded-[10px] px-2.5 py-1 text-xs font-medium border transition-colors ${
              showSettings
                ? 'border-[#0d0d0d] bg-[#0000000d] text-[#0d0d0d]'
                : 'border-[#0000001a] bg-white text-[#5d5d5d] hover:text-[#0d0d0d] hover:bg-[#0000000d]'
            }`}
            title="Configure System Prompt"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Instructions</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center space-x-1.5 rounded-[10px] border border-[#0000001a] bg-white px-2.5 py-1 text-xs font-medium text-[#5d5d5d] hover:text-[#0d0d0d] hover:bg-[#0000000d] transition-colors"
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
        <div className="border-b border-[#0000001a] bg-[#f9f9f9] px-4 py-3 sm:px-6">
          <label className="block text-xs font-medium text-[#5d5d5d] mb-1">
            System Instructions:
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            className="w-full rounded-[10px] border border-[#0000001a] bg-white p-2.5 text-xs sm:text-sm text-[#0d0d0d] placeholder-[#8f8f8f] outline-none focus:border-[#0d0d0d]"
            placeholder="E.g. You are a helpful AI assistant..."
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl text-center py-16">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] text-[#0d0d0d]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-[24px] font-semibold leading-[1.33] tracking-normal text-[#0d0d0d]">
              What can I help with?
            </h2>
            <p className="mt-2 text-sm text-[#5d5d5d]">
              Direct conversation with CallMissed models. Select a model and send a message.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] p-3 text-xs sm:text-sm text-[#0d0d0d] hover:bg-[#0000000d] transition-all text-left block leading-relaxed"
                >
                  {prompt}
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
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] text-[#0d0d0d]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`group relative max-w-[85%] rounded-[10px] px-3.5 py-2.5 text-sm sm:text-base leading-relaxed ${
                      isUser
                        ? 'bg-[#f9f9f9] border border-[#0000001a] text-[#0d0d0d]'
                        : 'bg-white text-[#0d0d0d]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="absolute top-2 right-2 rounded-[6px] border border-[#0000001a] bg-white p-1 text-[#5d5d5d] opacity-0 group-hover:opacity-100 hover:text-[#0d0d0d] transition-opacity"
                        title="Copy text"
                      >
                        {copiedIndex === index ? (
                          <Check className="h-3 w-3 text-[#0d0d0d]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[#0000001a] bg-[#0d0d0d] text-white">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] text-[#0d0d0d]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-[10px] px-3.5 py-2.5 text-sm text-[#5d5d5d]">
                  Generating response...
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2.5 rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] p-3 text-xs sm:text-sm text-[#0d0d0d]">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#5d5d5d]" />
                <div className="flex-1">
                  <p className="font-medium text-[#0d0d0d]">Request could not be completed</p>
                  <p className="text-xs text-[#5d5d5d] mt-0.5">{error}</p>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="flex items-center space-x-1 rounded-[8px] border border-[#0000001a] bg-white px-2 py-1 text-xs font-medium text-[#0d0d0d] hover:bg-[#0000000d]"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-[#0000001a] bg-white p-4 sm:p-5">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-center rounded-[10px] border border-[#0000001a] bg-[#f9f9f9] p-1.5 focus-within:border-[#0d0d0d] focus-within:bg-white transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message CallMissed... (Press Enter to send)"
              rows={1}
              className="w-full resize-none bg-transparent px-3 py-1.5 text-sm sm:text-base text-[#0d0d0d] placeholder-[#8f8f8f] outline-none max-h-32"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#0d0d0d] text-white transition-all hover:bg-[#000000] disabled:opacity-20 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#8f8f8f] px-1">
            <span>CallMissed Chat API</span>
            <span>{selectedModel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
