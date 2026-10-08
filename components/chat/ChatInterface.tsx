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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: '#ffffff' }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${silver}`,
          background: cream,
          padding: '8px 24px',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', letterSpacing: '0.143em', textTransform: 'uppercase', color: midGray, fontWeight: 400 }}>
            Model
          </span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              borderRadius: '8px',
              border: `1px solid ${silver}`,
              background: '#ffffff',
              padding: '4px 8px',
              fontSize: '13px',
              letterSpacing: '-0.01em',
              color: inkBlack,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {SUPPORTED_CHAT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px',
              border: `1px solid ${showSettings ? inkBlack : silver}`,
              background: showSettings ? '#f8f6f2' : '#ffffff',
              padding: '5px 10px',
              fontSize: '12px',
              letterSpacing: '-0.01em',
              color: showSettings ? inkBlack : midGray,
              cursor: 'pointer',
              fontWeight: showSettings ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            <Sliders style={{ width: '13px', height: '13px' }} />
            <span className="hidden sm:inline">Instructions</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                border: `1px solid ${silver}`,
                background: '#ffffff',
                padding: '5px 10px',
                fontSize: '12px',
                letterSpacing: '-0.01em',
                color: midGray,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Trash2 style={{ width: '13px', height: '13px' }} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* System Prompt Panel */}
      {showSettings && (
        <div
          style={{
            borderBottom: `1px solid ${silver}`,
            background: cream,
            padding: '12px 24px',
            flexShrink: 0,
          }}
        >
          <label
            style={{ display: 'block', fontSize: '12px', letterSpacing: '0.143em', textTransform: 'uppercase', color: midGray, marginBottom: '6px' }}
          >
            System Instructions
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              borderRadius: '8px',
              border: `1px solid ${silver}`,
              background: '#ffffff',
              padding: '8px 12px',
              fontSize: '13px',
              letterSpacing: '-0.01em',
              color: inkBlack,
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="e.g. You are a helpful AI assistant..."
          />
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', paddingTop: '48px' }}>
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
                fontSize: '32px',
                lineHeight: 1.1,
                letterSpacing: '-0.64px',
                fontWeight: 700,
                color: inkBlack,
                marginBottom: '8px',
              }}
            >
              What can I help with?
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.5, letterSpacing: '-0.14px', color: midGray, marginBottom: '32px' }}>
              Direct conversation with CallMissed models. Select a model above and send a message.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
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
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
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
                    className="group relative"
                    style={{
                      maxWidth: '80%',
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
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.content, index)}
                        className="opacity-0 group-hover:opacity-100"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          borderRadius: '6px',
                          border: `1px solid ${silver}`,
                          background: '#ffffff',
                          padding: '4px',
                          cursor: 'pointer',
                          transition: 'opacity 0.15s',
                        }}
                      >
                        {copiedIndex === index ? (
                          <Check style={{ width: '12px', height: '12px', color: '#57ad6a' }} />
                        ) : (
                          <Copy style={{ width: '12px', height: '12px', color: midGray }} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
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
                <div style={{ fontSize: '13px', color: midGray, padding: '12px 0', letterSpacing: '-0.01em' }}>
                  Generating response...
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
        style={{
          borderTop: `1px solid ${silver}`,
          background: '#ffffff',
          padding: '16px 24px 20px',
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '12px',
              border: `1px solid ${silver}`,
              background: cream,
              padding: '6px 6px 6px 16px',
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
              justifyContent: 'space-between',
              marginTop: '8px',
              paddingLeft: '4px',
              fontSize: '11px',
              letterSpacing: '-0.01em',
              color: '#c4c4c4',
            }}
          >
            <span>CallMissed Chat API</span>
            <span>{selectedModel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
