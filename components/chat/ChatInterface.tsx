'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Trash2,
  Sliders,
  Bot,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { SUPPORTED_CHAT_MODELS } from '@/lib/callmissed/chat';
import { ChatMessage } from '@/types/callmissed';
import { SelectDropdown, SelectOption } from '@/components/ui/select-dropdown';
import { AIMessage } from './AIMessage';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Sarvam } from '@/components/ui/svgs/sarvam';
import { Moonshot, Deepseek } from '@/components/ui/svgs/modelIcons';
import { Openai } from '@/components/ui/svgs/openai';
import { Gemma } from '@/components/ui/svgs/gemma';

const STARTER_PROMPTS = [
  'Explain quantum computing in simple terms for high schoolers.',
  'Write a TypeScript function to debounce an async API call.',
  'Translate "Welcome to our store, how may I help you?" into Hindi and Tamil.',
  'What are the advantages of WebRTC over WebSockets for voice agents?',
];

// Pietrastudio token aliases
const cream = '#f8f6f2';
const silver = '#c4c4c4';
const midGray = '#6b6b6b';
const inkBlack = '#000000';
const coral = '#ff5c3c';

function getModelLogo(modelId: string) {
  if (modelId.includes('sarvam')) return <Sarvam />;
  if (modelId.includes('kimi')) return <Moonshot />;
  if (modelId.includes('gpt')) return <Openai />;
  if (modelId.includes('gemma')) return <Gemma />;
  if (modelId.includes('deepseek')) return <Deepseek />;
  return <Bot className="w-4 h-4 text-[#6b6b6b]" />;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('sarvam-105b');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful, precise, and polite AI assistant.');
  const [tempPrompt, setTempPrompt] = useState(systemPrompt);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const modelOptions: SelectOption[] = SUPPORTED_CHAT_MODELS.map((m) => ({
    value: m.id,
    label: m.name,
    logo: getModelLogo(m.id),
  }));

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend !== undefined ? textToSend : input).trim();
    if (!promptText || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = { role: 'user', content: promptText };
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
        body: JSON.stringify({ model: selectedModel, messages: apiMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `Request failed with status ${res.status}`);

      const assistantReply = data?.choices?.[0]?.message?.content || 'No response content returned.';
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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

  const clearChat = () => { setMessages([]); setError(null); };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-white text-[#000000]">
      {/* Top Controls Bar - Mobile responsive */}
      <div
        className="flex flex-wrap sm:flex-nowrap items-center justify-between border-b px-4 sm:px-6 py-2.5 gap-2.5 shrink-0"
        style={{
          borderColor: silver,
          background: cream,
        }}
      >
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <span className="text-[13px] font-bold text-[#000000] tracking-[-0.01em]">
            AI Chat
          </span>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-xs text-[#6b6b6b] hidden md:inline">
              Choose a model:
            </span>
            <SelectDropdown
              value={selectedModel}
              onChange={setSelectedModel}
              options={modelOptions}
              triggerClassName="w-full sm:w-auto min-w-[160px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Drawer open={showSettings} onOpenChange={setShowSettings}>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() => setTempPrompt(systemPrompt)}
              >
                <Sliders className="w-3.5 h-3.5 text-[#6b6b6b]" />
                <span className="hidden sm:inline">Instructions</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent side="right">
              <DrawerHeader>
                <DrawerTitle>System Instructions</DrawerTitle>
                <DrawerDescription>
                  Define custom behavior, expertise, and formatting rules for CallMissed models.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-2">
                    Behavior Guidelines
                  </label>
                  <textarea
                    value={tempPrompt}
                    onChange={(e) => setTempPrompt(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-[#c4c4c4] bg-[#ffffff] p-3 text-sm text-[#000000] outline-none focus:border-[#000000] resize-none"
                    placeholder="E.g., You are a senior full-stack engineer and helpful AI assistant..."
                  />
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-2">
                    Quick Presets
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Precise & Concise', text: 'You are an AI assistant. Answer directly, concisely, and with precision.' },
                      { label: 'Code Architect', text: 'You are a senior staff software architect. Provide clean TypeScript and idiomatic code.' },
                      { label: 'Friendly Tutor', text: 'You are a patient, encouraging tutor who explains complex topics with relatable analogies.' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setTempPrompt(preset.text)}
                        className="rounded-full border border-[#c4c4c4] bg-[#f8f6f2] px-3 py-1 text-xs text-[#141414] hover:border-[#000000] hover:bg-white transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </DrawerClose>
                <Button
                  size="sm"
                  onClick={() => {
                    setSystemPrompt(tempPrompt);
                    setShowSettings(false);
                  }}
                >
                  Save & Apply
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#6b6b6b]" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages - Mobile responsive layout */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center pt-8 sm:pt-12">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: cream,
                border: `1px solid ${silver}`,
                marginBottom: '16px',
              }}
            >
              <Bot style={{ width: '20px', height: '20px', color: midGray }} />
            </div>
            <h2
              style={{
                fontSize: '28px',
                lineHeight: 1.15,
                letterSpacing: '-0.64px',
                fontWeight: 700,
                color: inkBlack,
                marginBottom: '8px',
              }}
            >
              What can I help with?
            </h2>
            <p className="text-sm text-[#6b6b6b] mb-8 max-w-md mx-auto">
              Direct conversation with CallMissed models. Select a model above and send a message.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  style={{
                    borderRadius: '12px',
                    border: `1px solid ${silver}`,
                    background: cream,
                    padding: '14px 16px',
                    fontSize: '13px',
                    letterSpacing: '-0.01em',
                    color: '#333333',
                    cursor: 'pointer',
                    textAlign: 'left',
                    lineHeight: 1.5,
                    boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px',
                    transition: 'all 0.15s',
                  }}
                  className="hover:border-[#000000] hover:bg-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2.5 sm:gap-3 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '12px',
                        background: cream,
                        border: `1px solid ${silver}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Bot style={{ width: '14px', height: '14px', color: midGray }} />
                    </div>
                  )}

                  <div
                    className="group relative max-w-[90%] sm:max-w-[82%]"
                    style={{
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      letterSpacing: '-0.14px',
                      color: inkBlack,
                      background: isUser ? cream : '#ffffff',
                      border: isUser ? `1px solid ${silver}` : 'none',
                      boxShadow: !isUser ? 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px' : 'none',
                    }}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    ) : (
                      <AIMessage content={msg.content} />
                    )}

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 rounded-md border border-[#c4c4c4] bg-white p-1 text-[#6b6b6b] hover:text-[#000000] transition-opacity"
                        title="Copy message"
                      >
                        {copiedIndex === index ? (
                          <Check style={{ width: '12px', height: '12px', color: '#57ad6a' }} />
                        ) : (
                          <Copy style={{ width: '12px', height: '12px' }} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '12px',
                    background: cream,
                    border: `1px solid ${silver}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot style={{ width: '14px', height: '14px', color: midGray }} />
                </div>
                <div className="text-xs text-[#6b6b6b] py-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff5c3c] animate-ping" />
                  <span>Generating response...</span>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  borderRadius: '12px',
                  border: `1px solid ${silver}`,
                  background: '#fffbe7',
                  padding: '12px 16px',
                  fontSize: '13px',
                  letterSpacing: '-0.01em',
                  color: inkBlack,
                  boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px',
                }}
              >
                <AlertCircle style={{ width: '16px', height: '16px', color: coral, flexShrink: 0, marginTop: '1px' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, marginBottom: '2px' }}>Request could not be completed</p>
                  <p style={{ color: midGray, fontSize: '12px' }}>{error}</p>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '8px',
                    border: `1px solid ${silver}`,
                    background: '#ffffff',
                    padding: '5px 10px',
                    fontSize: '12px',
                    color: inkBlack,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <RotateCcw style={{ width: '11px', height: '11px' }} />
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        className="border-t bg-white px-3 py-3 sm:px-6 sm:py-4 shrink-0"
        style={{ borderColor: silver }}
      >
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-center gap-2 sm:gap-2.5 rounded-xl border p-1.5 pl-3 sm:pl-4 transition-colors"
            style={{
              borderColor: silver,
              background: cream,
              boxShadow: 'rgba(193, 194, 222, 0.2) 1px 1px 1px 0px inset, rgba(255, 255, 255, 0.8) -1px -1px 1px 0px inset, rgb(255, 255, 255) 1px 1px 1px 0px inset, rgba(221, 223, 228, 0.5) 5px 5px 24px 0px',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message CallMissed... (Enter to send)"
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                letterSpacing: '-0.14px',
                lineHeight: 1.5,
                color: inkBlack,
                maxHeight: '128px',
                overflow: 'auto',
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: 'none',
                background: coral,
                color: '#ffffff',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !input.trim() ? 0.3 : 1,
                flexShrink: 0,
                transition: 'all 0.15s',
                boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 0px 0px',
              }}
            >
              <Send style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '6px',
              fontSize: '11px',
              letterSpacing: '-0.01em',
              color: midGray,
            }}
          >
            <span>Press Enter to send, Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
