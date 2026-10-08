'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Settings2,
  Volume2,
  AlertCircle,
  Radio,
  FileText,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Room, RoomEvent, Track, Participant, TranscriptionSegment } from 'livekit-client';
import {
  SUPPORTED_VOICES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_VOICE_MODELS,
} from '@/lib/callmissed/voice';
import { VoiceAgentState, TranscriptTurn } from '@/types/callmissed';

interface LiveTranscriptItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export const VoiceAgent: React.FC = () => {
  const [state, setState] = useState<VoiceAgentState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Audio & Mute State
  const [isMuted, setIsMuted] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Configuration options
  const [selectedVoice, setSelectedVoice] = useState('shubh');
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [selectedModel, setSelectedModel] = useState('kimi-k2.5');
  const [greeting, setGreeting] = useState('Hello! I am your CallMissed AI assistant. How can I help you today?');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful, conversational AI assistant. Keep responses natural, brief, and concise.'
  );
  const [showSettings, setShowSettings] = useState(false);

  // Live Transcripts
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [postCallTurns, setPostCallTurns] = useState<TranscriptTurn[] | null>(null);

  // LiveKit Room ref & audio elements ref
  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<HTMLMediaElement[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const cleanupCall = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (roomRef.current) {
      try {
        roomRef.current.disconnect();
      } catch (e) {
        console.error('Error disconnecting room:', e);
      }
      roomRef.current = null;
    }

    // Clean up attached audio elements
    audioElementsRef.current.forEach((el) => {
      try {
        el.pause();
        el.remove();
      } catch {}
    });
    audioElementsRef.current = [];
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  const startVoiceCall = async () => {
    try {
      setErrorMessage(null);
      setState('connecting');
      setTranscripts([]);
      setPostCallTurns(null);
      setCallDuration(0);
      setUserSpeaking(false);

      // 1. Create session via server route (API key remains strictly on server)
      const res = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice: selectedVoice,
          language: selectedLanguage,
          llm_model: selectedModel,
          greeting: greeting.trim() || undefined,
          system_prompt: systemPrompt.trim() || undefined,
          max_duration_seconds: 600,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || `Failed to create session (${res.status})`);
      }

      const { wsUrl, token, id } = data;
      if (!wsUrl || !token) {
        throw new Error('CallMissed media connection credentials were not returned.');
      }

      setSessionId(id);

      // 2. Initialize LiveKit WebRTC client
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // Handle subscribed tracks (Agent Audio)
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElementsRef.current.push(audioElement);
          document.body.appendChild(audioElement);
        }
      });

      // Handle Live Transcription with incremental segment update & deduplication
      room.on(
        RoomEvent.TranscriptionReceived,
        (segments: TranscriptionSegment[], participant?: Participant) => {
          setTranscripts((prev) => {
            const updated = [...prev];
            for (const seg of segments) {
              if (!seg.text || !seg.text.trim()) continue;
              const isLocal = participant?.isLocal ?? false;
              const sender: 'user' | 'agent' = isLocal ? 'user' : 'agent';
              const segId = seg.id || `seg-${sender}-${Date.now()}`;

              const existingIdx = updated.findIndex((item) => item.id === segId);
              if (existingIdx >= 0) {
                // Update in-place to avoid duplicate bubble entries during streaming
                updated[existingIdx] = {
                  ...updated[existingIdx],
                  text: seg.text,
                };
              } else {
                // Append new segment
                updated.push({
                  id: segId,
                  sender,
                  text: seg.text,
                  timestamp: Date.now(),
                });
              }
            }
            return updated;
          });
        }
      );

      // Handle Active Speakers
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const isAgentSpeaking = speakers.some((s) => !s.isLocal);
        const isUserSpeaking = speakers.some((s) => s.isLocal);
        setUserSpeaking(isUserSpeaking);

        if (isAgentSpeaking) {
          setState('speaking');
        } else if (isUserSpeaking) {
          setState('listening');
        }
      });

      // Handle Disconnection
      room.on(RoomEvent.Disconnected, () => {
        setState('ended');
        cleanupCall();
      });

      // 3. Connect to media server
      await room.connect(wsUrl, token);

      // 4. Request microphone permission and publish local audio
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (micErr: unknown) {
        const msg = micErr instanceof Error ? micErr.message : 'Microphone access denied';
        throw new Error(`Microphone permission error: ${msg}. Please enable your microphone.`);
      }

      setState('listening');

      // Start call timer
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voice session failed';
      setErrorMessage(msg);
      setState('error');
      cleanupCall();
    }
  };

  const endVoiceCall = async () => {
    setState('ended');
    const activeSessionId = sessionId;
    cleanupCall();

    // Fetch final structured transcript
    if (activeSessionId) {
      try {
        const res = await fetch(`/api/voice/transcript?id=${activeSessionId}`);
        const data = await res.json();
        if (data?.transcript && Array.isArray(data.transcript)) {
          setPostCallTurns(data.transcript);
        }
      } catch (e) {
        console.error('Failed to fetch call transcript:', e);
      }
    }
  };

  const toggleMute = async () => {
    if (!roomRef.current?.localParticipant) return;
    const newMutedState = !isMuted;
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
    } catch (e) {
      console.error('Error toggling microphone:', e);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCallActive = state === 'connecting' || state === 'listening' || state === 'speaking' || state === 'processing';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>CallMissed Real-Time Voice Agent</span>
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Voice Agent Interaction
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Low-latency conversational voice powered by CallMissed WebRTC Voice Session API (STT → LLM → TTS).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {!isCallActive && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium border transition-colors ${
                  showSettings
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'
                }`}
              >
                <Settings2 className="h-4 w-4" />
                <span>Agent Configuration</span>
              </button>
            )}

            {isCallActive && (
              <div className="flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-sm text-zinc-300 font-mono">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Drawer */}
        {showSettings && !isCallActive && (
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center space-x-2">
                <Settings2 className="h-4 w-4 text-indigo-400" />
                <span>Voice Agent Settings</span>
              </h3>
              <span className="text-xs text-zinc-400">Configured server-side for session creation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs sm:text-sm text-zinc-100 outline-none focus:border-indigo-500"
                >
                  {SUPPORTED_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs sm:text-sm text-zinc-100 outline-none focus:border-indigo-500"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  LLM Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs sm:text-sm text-zinc-100 outline-none focus:border-indigo-500"
                >
                  {SUPPORTED_VOICE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Agent Greeting (First spoken line)
                </label>
                <input
                  type="text"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs sm:text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  placeholder="e.g. Hello! How can I assist you today?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  System Persona & Instructions
                </label>
                <input
                  type="text"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs sm:text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  placeholder="e.g. You are a friendly customer service voice agent..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Voice Agent Experience */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Voice Orb & Controls Column (Left) */}
          <div className="flex flex-col items-center justify-between rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl lg:col-span-6 min-h-[480px]">
            {/* Status indicator badge */}
            <div className="flex items-center space-x-2 rounded-full bg-zinc-950/80 px-4 py-1.5 border border-zinc-800 shadow-inner">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  state === 'idle'
                    ? 'bg-zinc-500'
                    : state === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : state === 'speaking'
                    ? 'bg-violet-400 animate-pulse'
                    : state === 'listening'
                    ? 'bg-emerald-400 animate-pulse'
                    : state === 'ended'
                    ? 'bg-zinc-500'
                    : 'bg-red-400'
                }`}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                {state === 'idle' && 'Ready'}
                {state === 'connecting' && 'Connecting to WebRTC...'}
                {state === 'listening' && (userSpeaking ? 'Listening to you...' : 'Listening')}
                {state === 'speaking' && 'Agent Speaking...'}
                {state === 'processing' && 'Processing...'}
                {state === 'ended' && 'Call Ended'}
                {state === 'error' && 'Connection Error'}
              </span>
            </div>

            {/* Glowing Interactive Voice Orb */}
            <div className="my-8 relative flex items-center justify-center">
              {/* Outer glow aura */}
              <div
                className={`absolute h-64 w-64 rounded-full blur-3xl transition-all duration-500 ${
                  state === 'speaking'
                    ? 'bg-violet-600/30 scale-125'
                    : state === 'listening'
                    ? 'bg-emerald-600/25 scale-110'
                    : state === 'connecting'
                    ? 'bg-amber-600/20 scale-100 animate-pulse'
                    : 'bg-indigo-600/10 scale-90'
                }`}
              />

              {/* Middle animated ring */}
              <div
                className={`flex h-44 w-44 items-center justify-center rounded-full border transition-all duration-300 ${
                  state === 'speaking'
                    ? 'border-violet-400/50 bg-violet-950/40 animate-pulse'
                    : state === 'listening'
                    ? 'border-emerald-400/50 bg-emerald-950/40 animate-pulse'
                    : 'border-zinc-800 bg-zinc-900/80'
                }`}
              >
                {/* Core Orb */}
                <div
                  className={`flex h-32 w-32 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
                    state === 'speaking'
                      ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 scale-105 shadow-violet-500/50'
                      : state === 'listening'
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 scale-100 shadow-emerald-500/50'
                      : state === 'connecting'
                      ? 'bg-gradient-to-tr from-amber-600 to-orange-500 animate-spin shadow-amber-500/30'
                      : 'bg-zinc-800 text-zinc-500 shadow-none'
                  }`}
                >
                  {state === 'speaking' ? (
                    <Volume2 className="h-12 w-12 text-white animate-bounce" />
                  ) : state === 'listening' ? (
                    <Mic className="h-12 w-12 text-white" />
                  ) : state === 'connecting' ? (
                    <RefreshCw className="h-10 w-10 text-white animate-spin" />
                  ) : (
                    <Mic className="h-12 w-12 text-zinc-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Hint message */}
            <p className="text-center text-xs text-zinc-400 max-w-xs mb-4">
              {state === 'idle' && 'Click below to start a natural voice conversation with the AI agent.'}
              {state === 'connecting' && 'Establishing secure WebRTC audio session...'}
              {state === 'listening' && 'Speak normally into your microphone. The agent will listen and reply.'}
              {state === 'speaking' && 'Agent is responding. You can interrupt anytime by speaking.'}
              {state === 'ended' && 'Call finished. Review the transcript on the right or start a new call.'}
              {state === 'error' && errorMessage}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 w-full justify-center">
              {!isCallActive ? (
                <button
                  onClick={startVoiceCall}
                  className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all text-sm sm:text-base"
                >
                  <Mic className="h-5 w-5" />
                  <span>Start Voice Call</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMute}
                    className={`flex items-center space-x-2 rounded-2xl px-4 py-3 text-sm font-semibold border transition-all ${
                      isMuted
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>

                  <button
                    onClick={endVoiceCall}
                    className="flex items-center space-x-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 shadow-lg shadow-red-600/30 transition-all"
                  >
                    <PhoneOff className="h-4 w-4" />
                    <span>End Conversation</span>
                  </button>
                </>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-start space-x-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 w-full">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Real-Time Transcript Column (Right) */}
          <div className="flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl lg:col-span-6 min-h-[480px]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Live Captions & Transcript</h3>
              </div>
              <span className="text-xs text-zinc-500">
                {isCallActive ? 'Streaming' : 'Recorded session'}
              </span>
            </div>

            {/* Transcript Scroll Window */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 max-h-[380px]">
              {transcripts.length === 0 && !postCallTurns ? (
                <div className="flex flex-col items-center justify-center text-center py-16 text-zinc-500">
                  <FileText className="h-8 w-8 text-zinc-600 mb-2" />
                  <p className="text-xs">
                    {isCallActive
                      ? 'Listening for speech...'
                      : 'Live transcription will appear here when you speak.'}
                  </p>
                </div>
              ) : (
                <>
                  {transcripts.map((t) => (
                    <div
                      key={t.id}
                      className={`flex flex-col ${
                        t.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase text-zinc-500 mb-1 px-1">
                        {t.sender === 'user' ? 'You' : 'Agent'}
                      </span>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                          t.sender === 'user'
                            ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-100'
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-100'
                        }`}
                      >
                        {t.text}
                      </div>
                    </div>
                  ))}

                  {/* Post call turns if retrieved */}
                  {postCallTurns && postCallTurns.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                      <div className="text-xs font-semibold text-zinc-400">
                        Session Summary & Server-Recorded Turns:
                      </div>
                      {postCallTurns.map((turn, i) => (
                        <div key={turn.id || i} className="space-y-1.5 rounded-xl bg-zinc-950/80 p-3 border border-zinc-800 text-xs">
                          {turn.user_transcript && (
                            <p className="text-emerald-300">
                              <span className="font-semibold text-zinc-400">User: </span>
                              {turn.user_transcript}
                            </p>
                          )}
                          {turn.agent_response && (
                            <p className="text-zinc-200">
                              <span className="font-semibold text-zinc-400">Agent: </span>
                              {turn.agent_response}
                            </p>
                          )}
                          {turn.total_ms && (
                            <p className="text-[10px] text-zinc-500">
                              Latency: {turn.total_ms}ms • STT: {turn.stt_ms ?? '-'}ms • TTS TTFB: {turn.tts_ttfb_ms ?? '-'}ms
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div ref={transcriptEndRef} />
                </>
              )}
            </div>

            {/* Architecture Footer Note */}
            <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>WebRTC Client: livekit-client</span>
              <span>Backend: CallMissed Voice Session API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
